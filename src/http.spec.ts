import * as assert from "assert"
import { describe, it } from "mocha"
import { service } from "./service.js"
import * as Server from "ucanto/src/server.js"
import * as Transport from "ucanto/src/transport.js"
import * as HTTP from "ucanto/src/transport/http.js"
import * as Client from "ucanto/src/client.js"
import * as Issuer from "./actor/issuer.js"
import polyfillFetch from "@web-std/fetch"
import { ucantoHttpRequestListener } from "./ucanto-node-http.js"
import { withHttpServer } from "./http.js"

// in node <17.5.0, globalThis.fetch is not defined, so use polyfill
// https://nodejs.org/api/globals.html#fetch
const fetch =
  typeof globalThis.fetch !== "undefined" ? globalThis.fetch : polyfillFetch

describe("http name server", () => {
  it("can be invoked via Client with HTTP transport", async () => {
    const alice = await Issuer.generate()
    const server = Server.create({
      service,
      decoder: Transport.CAR,
      encoder: Transport.CBOR,
    })
    await withHttpServer(
      ucantoHttpRequestListener(server),
      async (url: URL) => {
        const connection = Client.connect({
          encoder: Transport.CAR, // encode as CAR because server decodes from car
          decoder: Transport.CBOR, // decode as CBOR because server encodes as CBOR
          /** @type {Transport.Channel<typeof service>} */
          channel: HTTP.open<typeof service>({ fetch, url }), // simple `fetch` wrapper
        })
        const publish = Client.invoke({
          issuer: alice,
          audience: alice,
          capability: {
            can: "name/resolve",
            with: alice.did(),
          },
        })
        await publish.execute(connection)
      }
    )
  })
})
