import { describe, it } from "mocha";
import { universalFetch } from "./fetch.js";
import { withHttpServer } from "./http.js";
import {
  HttpNameResolver,
  HttpNameResolverUrls,
} from "./http-name-resolver.js";
import * as assert from "assert";
import * as Issuer from "./actor/issuer.js";
import { NewService } from "./service.js";
import * as Client from "ucanto/src/client.js";
import * as Server from "ucanto/src/server.js";
import * as Transport from "ucanto/src/transport.js";

import { ZERO_CID } from "./cid.js";

describe("http-name-resolver", () => {
  it("responds to / with 200 and welcome message", async () => {
    await withHttpServer(
      await HttpNameResolver(NewService()),
      async (baseUrl) => {
        const index = HttpNameResolverUrls.index(baseUrl);
        const resp = await universalFetch(index.toString());
        assert.equal(resp.status, 200);
        const respBodyJson = await resp.json();
        assert.ok(respBodyJson.message);
        assert.ok(String(respBodyJson.message).includes("HttpNameResolver"));
      }
    );
  });
  it("responds to unpublished /{did} with 404", async () => {
    const alice = await Issuer.generate();
    await withHttpServer(
      await HttpNameResolver(NewService()),
      async (baseUrl) => {
        const aliceNameResolution = HttpNameResolverUrls.resolve(
          baseUrl,
          alice.did()
        );
        const resp = await universalFetch(aliceNameResolution.toString());
        assert.equal(resp.status, 404);
      }
    );

    it("responds to /{did} with Accept: JSON with a 200 status & JSON body containing the CID, if the DID has a published CID", async () => {
      const alice = await Issuer.generate();
      const service = NewService();
      const server = Server.create({
        service,
        decoder: Transport.CAR,
        encoder: Transport.CBOR,
      });
      const connection = Client.connect({
        encoder: Transport.CAR, // encode as CAR because server decodes from car
        decoder: Transport.CBOR, // decode as CBOR because server encodes as CBOR
        /** @type {Transport.Channel<typeof service>} */
        channel: server,
      });

      // publish ZERO_CID to did:alice
      const pubInvocation = Client.invoke({
        issuer: alice,
        audience: alice,
        capability: {
          can: "name/publish",
          with: alice.did(),
          content: ZERO_CID,
          origin: null,
        },
      });
      const pubResponse = await pubInvocation.execute(connection);
      assert.ok(pubResponse.ok);

      // fetch via HttpNameResolver
      await withHttpServer(await HttpNameResolver(service), async (baseUrl) => {
        const aliceNameResolution = HttpNameResolverUrls.resolve(
          baseUrl,
          alice.did()
        );
        const resp = await universalFetch(aliceNameResolution.toString(), {
          headers: {
            Accept: "application/json",
          },
        });
        assert.equal(resp.status, 200);
        const body: { did: string; cid: string } = await resp.json();
        assert.equal(body.did, alice.did().toString());
        assert.equal(body.cid, ZERO_CID.toString());
      });
    });

    it("responds to /{did} without Accept: JSON with a 302 redirect to an IPFS gateway, if the DID has a published CID", async () => {
      const alice = await Issuer.generate();
      const service = NewService();
      const server = Server.create({
        service,
        decoder: Transport.CAR,
        encoder: Transport.CBOR,
      });
      const connection = Client.connect({
        encoder: Transport.CAR, // encode as CAR because server decodes from car
        decoder: Transport.CBOR, // decode as CBOR because server encodes as CBOR
        /** @type {Transport.Channel<typeof service>} */
        channel: server,
      });

      // publish ZERO_CID to did:alice
      const pubInvocation = Client.invoke({
        issuer: alice,
        audience: alice,
        capability: {
          can: "name/publish",
          with: alice.did(),
          content: ZERO_CID,
          origin: null,
        },
      });
      const pubResponse = await pubInvocation.execute(connection);
      assert.ok(pubResponse.ok);

      // fetch via HttpNameResolver
      await withHttpServer(await HttpNameResolver(service), async (baseUrl) => {
        const aliceNameResolution = HttpNameResolverUrls.resolve(
          baseUrl,
          alice.did()
        );
        const resp = await universalFetch(aliceNameResolution.toString());
        assert.equal(resp.status, 302);
        const location = resp.headers.get("Accept");
        assert.ok(location);
        // todo: match gateway URL structure
        assert.match(location, new RegExp(ZERO_CID.toString()));
      });
    });
  });
});
