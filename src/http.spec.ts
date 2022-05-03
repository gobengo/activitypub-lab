import * as assert from "assert";
import { describe, it } from "mocha";
import { service } from "./service.js";
import * as Server from "ucanto/src/server.js";
import * as Transport from "ucanto/src/transport.js";
import * as HTTP from "ucanto/src/transport/http.js";
import * as Client from "ucanto/src/client.js";
import { createIssuer } from "./issuer.js";
import { KeyPair } from "ucan-storage/keypair";
import * as http from "http";
import { AddressInfo } from "net";
import { server } from "./server.js";
import { blob } from "stream/consumers";
import polyfillFetch from "@web-std/fetch";
import all from "it-all";
import * as uint8arrays from "uint8arrays";

// in node <17.5.0, globalThis.fetch is not defined, so use polyfill
// https://nodejs.org/api/globals.html#fetch
const fetch =
  typeof globalThis.fetch !== "undefined" ? globalThis.fetch : polyfillFetch;

describe("http name server", () => {
  it("can be invoked via Client with HTTP transport", async () => {
    const alice = createIssuer(await KeyPair.create());
    const server = Server.create({
      service,
      decoder: Transport.CAR,
      encoder: Transport.CBOR,
    });
    await withUcantoServer(server, async (url: URL) => {
      const connection = Client.connect({
        encoder: Transport.CAR, // encode as CAR because server decodes from car
        decoder: Transport.CBOR, // decode as CBOR because server encodes as CBOR
        /** @type {Transport.Channel<typeof service>} */
        channel: HTTP.open<typeof service>({ fetch, url }), // simple `fetch` wrapper
      });
      const publish = Client.invoke({
        issuer: alice,
        audience: alice,
        capability: {
          can: "name/resolve",
          with: alice.did(),
        },
      });
      await publish.execute(connection);
    });
  });
});

function toHeadersRecord(
  headers: http.IncomingHttpHeaders
): Readonly<Record<string, string>> {
  const headersRecord: Record<string, string> = {};
  for (const [key, valueOrValues] of Object.entries(headers)) {
    const value = Array.isArray(valueOrValues)
      ? valueOrValues[0]
      : valueOrValues;
    if (typeof value !== "string") {
      console.warn("got unexpected non-string header value. ignoring", value);
      continue;
    }
    headersRecord[key] = value;
  }
  return headersRecord;
}

async function withUcantoServer<T>(
  ucantoServer: Client.ServerView<T>,
  useServer: (baseUrl: URL) => Promise<void>
) {
  const httpServer = http.createServer((req, res) => {
    all(req).then(async (httpRequestBodyChunks) => {
      const httpRequestBodyArrayBuffer = uint8arrays.concat(
        httpRequestBodyChunks
      );
      let ucantoResponse;
      const headers = toHeadersRecord(req.headers);
      try {
        ucantoResponse = await ucantoServer.request({
          body: httpRequestBodyArrayBuffer,
          headers,
        });
      } catch (error) {
        console.warn("ucantoServer error", error);
        res.writeHead(500);
        res.end(
          JSON.stringify({
            message: error instanceof Error ? error.message : undefined,
          })
        );
        return;
      }
      res.writeHead(200, ucantoResponse?.headers);
      res.end(ucantoResponse?.body);
    });
  });
  await new Promise((resolve, _reject) => {
    httpServer.listen(0, () => {
      resolve(true);
    });
  });
  const baseUrl = addressUrl(httpServer.address());
  if (!baseUrl) {
    throw new Error(`failed to determine baseUrl from ucantoServer`);
  }
  try {
    await useServer(baseUrl);
  } finally {
    await new Promise((resolve, _reject) => {
      httpServer.close(resolve);
    });
  }
  return;
}

function addressUrl(addressInfo: string | AddressInfo | null): URL | null {
  if (addressInfo === null) return null;
  if (typeof addressInfo === "string") return new URL(addressInfo);
  const { address, port } = addressInfo;
  const host = address === "::" ? "127.0.0.1" : address;
  const urlString = `http://${host}:${port}`;
  return new URL(urlString);
}
