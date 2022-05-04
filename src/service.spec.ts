import * as assert from "assert";
import { describe, it } from "mocha";
import { Client } from "ucanto/src/lib.js";
import * as Issuer from "./actor/issuer.js";
import * as Audience from "./actor/audience.js";
import { CID } from "multiformats";
import { ZERO_CID } from "./cid.js";
import { NewService } from "./service.js";

const bob = Audience.parse(
  "did:key:z6MkffDZCkCTWreg8868fG1FGFogcJj5X6PY93pPcWDn9bob"
);

describe("name", () => {
  it("exists", async () => {
    assert.ok(typeof NewService().name != "undefined");
  });

  it("name/publish fails with PermissionError if resource DID is invalid", async () => {
    const service = NewService();
    assert.ok(typeof service.name.publish === "function");
    const alice = await Issuer.generate();

    const invocation = Client.invoke({
      issuer: alice,
      audience: bob,
      capability: {
        can: "name/publish",
        with: "did:key:fake-key",
        content: CID.parse(
          "bafybeidaaryc6aga3zjpujfbh4zabwzogd22y4njzrqzc4yv6nvyfm3tee"
        ),
        origin: null,
      },
    });

    const p = service.name.publish(invocation);
    assert.ok(p instanceof Promise);
    const resp = await p;
    assert.ok(!resp.ok);
    if (!(resp instanceof Error)) {
      throw new Error("expected resp to be Error");
    }
    assert.equal(resp.name, "PermissionError");
  });

  it("name/publish succeeds if `with` is issuer's did", async () => {
    const service = NewService();
    assert.ok(typeof service.name.publish === "function");
    const alice = await Issuer.generate();

    const invocation = Client.invoke({
      issuer: alice,
      audience: bob,
      capability: {
        can: "name/publish",
        // @TODO dont use `as`
        with: alice.did().toString() as `${string}:${string}`,
        content: CID.parse(
          "bafybeidaaryc6aga3zjpujfbh4zabwzogd22y4njzrqzc4yv6nvyfm3tee"
        ),
        origin: null,
      },
    });

    const p = service.name.publish(invocation);
    assert.ok(p instanceof Promise);
    const resp = await p;
    assert.ok(resp.ok);
    assert.ok(resp.value.published);
  });

  /**
   * Test disabled because it's too complicated to implement today.
   * Handler function needs to inspect the whole delegation chain,
   * not just the issuer (which is alice, not bob)
   */
  xit("name/publish succeeds when invoked by a delegate", async () => {
    const service = NewService();
    assert.ok(typeof service.name.publish === "function");
    const alice = await Issuer.generate();
    const mallory = await Issuer.generate();

    const delegation = await Client.delegate({
      issuer: alice,
      audience: mallory.audience,
      capabilities: [
        {
          can: "name/publish",
          with: alice.did(),
        },
      ],
    });

    const invocation = Client.invoke({
      issuer: mallory,
      audience: bob,
      capability: {
        can: "name/publish",
        // @TODO dont use `as`
        with: alice.did().toString() as `${string}:${string}`,
        content: CID.parse(
          "bafybeidaaryc6aga3zjpujfbh4zabwzogd22y4njzrqzc4yv6nvyfm3tee"
        ),
        origin: null,
      },
      proofs: [delegation],
    });

    const p = service.name.publish(invocation);
    assert.ok(p instanceof Promise);
    const resp = await p;
    console.log({ resp });
    assert.ok(resp.ok);
    assert.ok(resp.value.published);
  });

  it("it errors with NotFoundError if try to resolve unset id", async () => {
    const service = NewService();
    const alice = await Issuer.generate();
    const resolveUnsetInvocation = Client.invoke({
      issuer: alice,
      audience: alice,
      capability: {
        can: "name/resolve",
        with: alice.did(),
      },
    });
    const resolveResponse = await service.name.resolve(resolveUnsetInvocation);
    assert.ok(!resolveResponse.ok);
    assert.equal(resolveResponse.name, "NotFoundError");
  });

  it("can resolve id after publishing it", async () => {
    const service = NewService();
    // set did
    const alice = await Issuer.generate();
    const aliceCid1 = ZERO_CID;
    // publish did1 -> cid1
    const publish = Client.invoke({
      issuer: alice,
      audience: alice,
      capability: {
        can: "name/publish",
        with: alice.did(),
        content: aliceCid1,
        origin: null,
      },
    });
    const publishResponse = await service.name.publish(publish);
    assert.ok(publishResponse.ok);
    // resolve did1
    const resolve = Client.invoke({
      issuer: alice,
      audience: alice,
      capability: {
        can: "name/resolve",
        with: alice.did(),
      },
    });
    const resolveResponse = await service.name.resolve(resolve);
    assert.ok(resolveResponse.ok);
    // assert resolve result is cid1
    assert.equal(
      resolveResponse.value.content.toString(),
      aliceCid1.toString()
    );
  });
});
