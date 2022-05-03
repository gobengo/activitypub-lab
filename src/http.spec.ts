import * as assert from "assert";
import { describe, it } from "mocha";
import { service } from "./service.js";
import * as Server from "ucanto/src/server.js";
import * as Transport from "ucanto/src/transport.js";
// import * as HTTP from "ucanto/src/transport/http.js";
import * as Client from "ucanto/src/client.js";
import { createIssuer } from "./issuer.js";
import { KeyPair } from "ucan-storage/keypair";
import { CID } from "multiformats";
describe("http name server", () => {
  //   xit("can be invoked via Client with HTTP transport", () => {
  //     await withServer(server, async (baseUrl: string) => {
  //         const connection = Client.connect({
  //             encoder: Transport.CAR, // encode as CAR because server decodes from car
  //             decoder: Transport.CBOR, // decode as CBOR because server encodes as CBOR
  //             /** @type {Transport.Channel<typeof service>} */
  //             channel: HTTP.open(new URL(baseUrl), // simple `fetch` wrapper
  //           });
  //     })
  //   })
});

// async function withServer<T>(server: Client.ServerView<T>, useServer: (baseUrl: string) => Promise<void>) {

// }
