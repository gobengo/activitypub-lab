import * as assert from "assert";
import { describe, it } from "mocha";
import * as Client from "ucanto/src/client.js";
import * as Transport from "ucanto/src/transport.js";
import * as Issuer from "./actor/issuer.js";
import * as Server from "ucanto/src/server.js";
import { CID } from "multiformats";
import * as Audience from "./actor/audience.js";
import * as NameServer from "./server.js";
import { HttpNameResolverUrls } from "./http-name-resolver.js";
import { universalFetch } from "./fetch.js";
import * as HTTP from "ucanto/src/transport/http.js";
import { IServiceAPI, NewService } from "./service.js";
import { ZERO_CID } from "./cid.js";

describe("server", () => {
  it('can be started and get urls"', async () => {
    const { stop, urls } = await NameServer.start();
    try {
      assert.ok(urls.control);
      assert.ok(urls.data);
    } finally {
      await stop();
    }
  });
  it("can be started with specific ports", async () => {
    const controlPort = 1337;
    const dataPort = controlPort + 1;
    const { stop, urls } = await NameServer.start(undefined, {
      control: {
        port: controlPort,
      },
      data: {
        port: dataPort,
      },
    });
    try {
      assert.ok(urls.control);
      assert.ok(urls.control.toString().includes(String(controlPort)));
      assert.ok(urls.data);
      assert.ok(urls.data.toString().includes(String(dataPort)));
    } finally {
      await stop();
    }
  });
  it("can invoke control plane via ucanto Client HTTP transport", async () => {
    const alice = await Issuer.generate();
    const { stop, urls } = await NameServer.start();
    try {
      const connection = Client.connect({
        encoder: Transport.CAR, // encode as CAR because server decodes from car
        decoder: Transport.CBOR, // decode as CBOR because server encodes as CBOR
        channel: HTTP.open<IServiceAPI>({
          fetch: universalFetch,
          url: urls.control,
        }), // simple `fetch` wrapper
      });
      const resolve = Client.invoke({
        issuer: alice,
        audience: alice,
        capability: {
          can: "name/resolve",
          with: alice.did(),
        },
      });
      const publishResponse = await resolve.execute(connection);
      assert.ok(!publishResponse.ok);
      assert.equal(publishResponse.name, "NotFoundError");
    } finally {
      await stop();
    }
  });
  it("can invoke data plane", async () => {
    const { stop, urls } = await NameServer.start();
    try {
      await testHttpNameResolver(universalFetch, urls.data);
    } finally {
      await stop();
    }
  });
  it("can invoke publish via control plane and then resolve via data plane", async () => {
    // start server
    const alice = await Issuer.generate();
    const aliceCid1 = ZERO_CID;
    const { stop, urls, nameService } = await NameServer.start();
    try {
      // create client connection
      const connection = Client.connect({
        encoder: Transport.CAR, // encode as CAR because server decodes from car
        decoder: Transport.CBOR, // decode as CBOR because server encodes as CBOR
        channel: HTTP.open<IServiceAPI>({
          fetch: universalFetch,
          url: urls.control,
        }), // simple `fetch` wrapper
      });
      // publish aliceDid1 => aliceCid1 via control plane
      const publish = Client.invoke({
        issuer: alice,
        audience: nameService,
        capability: {
          can: "name/publish",
          with: alice.did(),
          content: aliceCid1,
          origin: null,
        },
      });
      const publishResponse = await publish.execute(connection);
      assert.ok(publishResponse.ok);
      // resolve aliceDid1 via data plane
      const resolveAliceDid = Client.invoke({
        issuer: alice,
        audience: nameService,
        capability: {
          can: "name/resolve",
          with: alice.did(),
        },
      });
      const resolveResponse = await resolveAliceDid.execute(connection);
      assert.ok(resolveResponse.ok);
      // expect resolution.content===aliceCid1
      assert.equal(
        resolveResponse.value.content.toString(),
        aliceCid1.toString()
      );
    } finally {
      await stop();
    }
  });
  it("cannot configure NameServer to listen on same port, same paths for different subsystems", async () => {
    let threw = false;
    try {
      const { stop, urls, nameService } = await NameServer.start(undefined, {
        port: 0,
        control: {
          path: "/",
        },
        data: {
          path: "/",
        },
      });
      await stop();
    } catch (error) {
      threw = true;
    }
    assert.equal(threw, true);
  });
  it("can configure NameServer to have control/data listen on same port, different http paths", async () => {
    const controlPathPrefix = "/control";
    const dataPathPrefix = "/data";
    const { stop, urls, nameService } = await NameServer.start(undefined, {
      port: 0,
      control: {
        path: controlPathPrefix,
      },
      data: {
        path: dataPathPrefix,
      },
    });
    try {
      assert.ok(urls.control.toString().includes(controlPathPrefix));
      assert.ok(urls.data.toString().includes(dataPathPrefix));
      const dataIndexResponse = await universalFetch(urls.data.toString());
      assert.equal(dataIndexResponse.status, 200);
      const controlIndexResponse = await universalFetch(
        urls.control.toString()
      );
      // this is an expected error
      assert.equal(controlIndexResponse.status, 500);
      const controlIndexResponseJson = await controlIndexResponse.json();
      assert.ok(controlIndexResponseJson.message);
    } finally {
      await stop();
    }
  });
});

async function testHttpNameResolver(
  universalFetch: typeof fetch,
  baseUrl: URL
) {
  const index = HttpNameResolverUrls.index(baseUrl);
  const indexResponse = await universalFetch(index.toString());
  assert.ok(indexResponse.ok);
  assert.equal(indexResponse.status, 200);
  const indexResponseJson = await indexResponse.json();
  assert.ok(indexResponseJson.message);
}
