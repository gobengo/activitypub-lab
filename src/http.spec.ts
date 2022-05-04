import * as assert from "assert";
import { describe, it } from "mocha";
import * as Server from "ucanto/src/server.js";
import * as Transport from "ucanto/src/transport.js";
import * as HTTP from "ucanto/src/transport/http.js";
import * as Client from "ucanto/src/client.js";
import * as Issuer from "./actor/issuer.js";
import { ucantoHttpRequestListener } from "./ucanto-node-http.js";
import { withHttpServer } from "./http.js";
import { universalFetch } from "./fetch.js";
import { NewService } from "./service.js";

describe("http name server", () => {
  it("can be invoked via Client with HTTP transport", async () => {
    const alice = await Issuer.generate();
    const service = NewService();
    const server = Server.create({
      service,
      decoder: Transport.CAR,
      encoder: Transport.CBOR,
    });
    await withHttpServer(
      ucantoHttpRequestListener(server),
      async (url: URL) => {
        const connection = Client.connect({
          encoder: Transport.CAR, // encode as CAR because server decodes from car
          decoder: Transport.CBOR, // decode as CBOR because server encodes as CBOR
          /** @type {Transport.Channel<typeof service>} */
          channel: HTTP.open<typeof service>({ fetch: universalFetch, url }), // simple `fetch` wrapper
        });
        const resolve = Client.invoke({
          issuer: alice,
          audience: alice,
          capability: {
            can: "name/resolve",
            with: alice.did(),
          },
        });
        await resolve.execute(connection);
      }
    );
  });
});
