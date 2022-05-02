import * as assert from "assert";
import { describe, it } from "mocha";
import * as Client from "ucanto/src/client.js";
import * as Transport from "ucanto/src/transport.js";
import { server } from "./server.js";
import { KeyPair } from "ucan-storage/keypair";

describe("server", () => {
  it("should be able to execute a test", () => {
    assert.equal(true, true);
  });
  it("can be invoked by ucanto Client", async () => {
    const alice = createSigner(await KeyPair.create());
    const bob = createSigner(await KeyPair.create());
    const connection = Client.connect({
      encoder: Transport.CAR, // encode as CAR because server decods from car
      decoder: Transport.CBOR, // decode as CBOR because server encodes as CBOR
      channel: server, // simply pass the server
    });
    const echoA = Client.invoke({
      issuer: alice,
      audience: bob,
      capability: {
        can: "intro/echo",
        with: `data:text/plain,foo`,
      },
    });
    const response = await echoA.execute(connection);
    console.log("response", response);
    assert.equal(response.ok, true);
    if (response.ok) {
      assert.equal(response.value, "foo");
    }
  });
});

function createSigner(keypair: KeyPair): Client.Issuer<number> {
  return Object.assign(keypair, {
    algorithm: 0xed as const,
  }) as Client.Issuer<number>;
}
