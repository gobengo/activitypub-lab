import * as Server from "ucanto/src/server.js";
import * as Transport from "ucanto/src/transport.js";
import {
  HttpNameResolver,
  HttpNameResolverUrls,
} from "./http-name-resolver.js";
import { IServiceAPI, NewService } from "./service.js";
import { ucantoHttpRequestListener } from "./ucanto-node-http.js";
import * as nodeHttp from "http";
import { addressUrl } from "./http.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { WHITE_LEMUR, ZERO_CID } from "./cid.js";
import * as Issuer from "./actor/issuer.js";
import * as Client from "ucanto/src/client.js";
import { universalFetch } from "./fetch.js";
import * as HTTP from "ucanto/src/transport/http.js";
import * as assert from "assert";
import type * as UCAN from "ucanto/src/api.js";
import { response } from "express";
import { hasOwnProperty } from "./object.js";

export async function create() {
  const nameService = NewService();
  const ucantoServer = Server.create({
    service: nameService,
    decoder: Transport.CAR,
    encoder: Transport.CBOR,
  });
  const controlListener = ucantoHttpRequestListener(ucantoServer);
  const listeners = {
    control: controlListener,
    data: await HttpNameResolver(nameService),
  };
  return { listeners, nameService };
}

export async function start(
  server = create(),
  options?: {
    control?: {
      port?: number;
    };
    data?: {
      port?: number;
    };
  }
) {
  const { listeners, nameService } = await server;
  const httpServers = Object.fromEntries(
    Object.entries(listeners).map(([key, listener]) => [
      key,
      nodeHttp.createServer(listener),
    ])
  );
  await listen();
  const urls = Object.fromEntries(
    Object.entries(httpServers).map(([key, httpServer]) => {
      return [key, addressUrl(httpServer.address())];
    })
  );
  return { stop, urls, httpServers, nameService };

  async function listen() {
    const listeningEntries = Object.entries(httpServers).map(
      async ([key, httpServer]) => {
        const serverOptions =
          options && hasOwnProperty(options, key) ? options[key] : undefined;
        const serverPort =
          serverOptions &&
          typeof serverOptions === "object" &&
          hasOwnProperty(serverOptions, "port") &&
          typeof serverOptions.port === "number"
            ? serverOptions.port
            : 0;
        await new Promise((resolve, _reject) => {
          httpServer.listen(serverPort, () => {
            resolve(true);
          });
        });
        return [key, httpServer];
      }
    );
  }
  async function close() {
    await Promise.allSettled(
      Object.values(httpServers).map(
        (server) =>
          new Promise((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve(err)));
          })
      )
    );
  }
  async function stop() {
    await close();
  }
}

/**
 * Run a server
 */
export async function main() {
  const argv = await yargs(hideBin(process.argv)).argv;
  console.log({ argv });
  const { stop, urls, nameService } = await start(undefined, {
    control: {
      port: argv.controlPort ? Number(argv.controlPort) : 0,
    },
    data: {
      port: argv.dataPort ? Number(argv.dataPort) : 0,
    },
  });
  function handleExit(signal: string) {
    console.log(`Received ${signal}. Stopping NameServer`);
    stop()
      .then(() => {
        // eslint-disable-next-line no-process-exit
        process.exit(0);
      })
      .catch((error) => {
        console.error("error stopping NameServer", error);
        throw error;
      });
  }
  process.on("SIGINT", handleExit);
  process.on("SIGQUIT", handleExit);
  process.on("SIGTERM", handleExit);
  console.log("NameServer started", {
    urls: Object.fromEntries(
      Object.entries(urls).map(([key, url]) => [key, url.toString()])
    ),
    nameService: {
      did: nameService.did(),
    },
  });

  if ("seed" in argv && argv.seed) {
    const alice = await Issuer.generate();
    const aliceCid1 = WHITE_LEMUR;
    console.log("seeding control plane");
    const publishResponse = await invokeNameServiceHttp(
      urls.control,
      Client.invoke({
        issuer: alice,
        audience: nameService,
        capability: {
          can: "name/publish",
          with: alice.did(),
          content: aliceCid1,
          origin: null,
        },
      })
    );
    assert.ok(publishResponse.ok);
    console.log("seeded control plane with", {
      alice: {
        did: alice.did(),
        cid: aliceCid1,
        resolve: HttpNameResolverUrls.resolve(
          urls.data,
          alice.did()
        ).toString(),
      },
    });
  }
}

async function invokeNameServiceHttp<
  ServiceAPI,
  Capability extends UCAN.Capability
>(url: URL, invocation: Client.IssuedInvocationView<Capability>) {
  const connection = Client.connect({
    encoder: Transport.CAR, // encode as CAR because server decodes from car
    decoder: Transport.CBOR, // decode as CBOR because server encodes as CBOR
    /** @type {Transport.Channel<typeof service>} */
    channel: HTTP.open<ServiceAPI>({
      fetch: universalFetch,
      url,
    }), // simple `fetch` wrapper
  });
  // @todo type better
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await invocation.execute(connection as any);
  return response;
}
