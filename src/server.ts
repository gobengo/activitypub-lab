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
import { response, Router } from "express";
import { hasOwnProperty } from "./object.js";
import express from "express";

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

type NameServerSubsystem = "control" | "data";
type NameServerSubsystemOptions<T> = {
  [subsystem in NameServerSubsystem]: T;
};
type TcpPortOption = { port: number };
type HttpPathOption = { path: string };
// configure the subsystems to either listen on their own ports,
// or to listen on the same http port, but mounted at different paths
type NameServerSubsystemsOnDifferentPortOptions =
  NameServerSubsystemOptions<TcpPortOption>;
type NameServerSubsystemsOnSamePortOptions = {
  port: number;
} & NameServerSubsystemOptions<HttpPathOption>;
type NameServerStartOptions =
  | NameServerSubsystemsOnDifferentPortOptions
  | NameServerSubsystemsOnSamePortOptions;
type NameServerSubsystemUrls = NameServerSubsystemOptions<URL>;

export async function start(
  server = create(),
  options: NameServerStartOptions = {
    data: { port: 0 },
    control: { port: 0 },
  }
) {
  const { listeners, nameService } = await server;
  const { urls, httpServers } = hasOwnProperty(options, "port")
    ? await listenSamePort(listeners, options)
    : await listenDifferentPorts(listeners, options);

  return { urls, nameService, stop: () => stop(httpServers) };

  async function stop(httpServers: Array<nodeHttp.Server>) {
    await Promise.allSettled(
      httpServers.map(
        (server) =>
          new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve(1)));
          })
      )
    );
  }
}

async function listenSamePort(
  listeners: { [key in NameServerSubsystem]: nodeHttp.RequestListener },
  options: NameServerSubsystemsOnSamePortOptions
): Promise<{
  urls: NameServerSubsystemUrls;
  httpServers: nodeHttp.Server[];
}> {
  const distinctPaths = new Set();
  let subsystemName: keyof typeof listeners;
  for (subsystemName in listeners) {
    distinctPaths.add(options[subsystemName].path);
  }
  if (distinctPaths.size !== Object.keys(listeners).length) {
    throw new Error(
      "Unable to listen on same port. At least two subsystems are configured to listen on same http path"
    );
  }
  const requestListener: nodeHttp.RequestListener = (() => {
    const router = Router();
    let subsystem: keyof typeof listeners;
    for (subsystem in listeners) {
      router.use(options[subsystem].path, listeners[subsystem]);
    }
    const app = express().use(router);
    return app;
  })();
  const httpServer = nodeHttp.createServer(requestListener);
  await listen(httpServer, options.port);
  const baseUrl = addressUrl(httpServer.address());
  const urls: { [subsystem in NameServerSubsystem]: URL } = {
    control: new URL(options.control.path, baseUrl),
    data: new URL(options.data.path, baseUrl),
  };
  const httpServers = [httpServer];
  return { urls, httpServers };
}

async function listenDifferentPorts(
  listeners: { [key in NameServerSubsystem]: nodeHttp.RequestListener },
  options: NameServerSubsystemsOnDifferentPortOptions
): Promise<{
  urls: NameServerSubsystemUrls;
  httpServers: nodeHttp.Server[];
}> {
  const controlServer = nodeHttp.createServer(listeners.control);
  await listen(controlServer, options.control.port);
  const dataServer = nodeHttp.createServer(listeners.data);
  await listen(dataServer, options.data.port);
  const httpServers = [controlServer, dataServer];
  const urls = {
    control: addressUrl(controlServer.address()),
    data: addressUrl(dataServer.address()),
  };
  return { urls, httpServers };
}

async function listen(httpServer: nodeHttp.Server, port: number) {
  await new Promise((resolve, _reject) => {
    httpServer.listen(port ?? 0, () => resolve(1));
  });
}

/**
 * Run a server
 */
export async function main() {
  const argv = await yargs(hideBin(process.argv)).env("UCANTO_NAME").argv;
  console.log({ argv });
  const startOptions =
    typeof argv.port !== "undefined"
      ? {
          port: Number(argv.port ?? 0),
          control: {
            path: String(argv.controlPath || "/control"),
          },
          data: {
            path: String(argv.dataPath || "/"),
          },
        }
      : {
          control: {
            port: Number(argv.controlPort || 0),
          },
          data: {
            port: Number(argv.dataPort || 0),
          },
        };
  const { stop, urls, nameService } = await start(undefined, startOptions);
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
