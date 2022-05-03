import * as assert from "assert";
import { describe, it } from "mocha";
import { KeyPair } from "ucan-storage/keypair";
import { Client } from "ucanto/src/lib.js";
import { service } from "./service.js";
import { createIssuer } from './issuer.js';
import { CID } from "multiformats";

// https://cid.ipfs.io/#bafkqaaa
const ZERO_CID = CID.parse("bafkqaaa");

describe("name", () => {
  it("exists", async () => {
    assert.ok(typeof service.name != 'undefined')
  });

  it("name/publish fails with PermissionError if resource DID is invalid", async () => {
    assert.ok(typeof service.name.publish === 'function')
    const alice = createIssuer(await KeyPair.create());
    const bob = createIssuer(await KeyPair.create());

    const invocation = Client.invoke({
      issuer: alice,
      audience: bob,
      capability: {
        can: "name/publish",
        with: "did:key:fake-key",
        content: CID.parse(
          
          "bafybeidaaryc6aga3zjpujfbh4zabwzogd22y4njzrqzc4yv6nvyfm3tee"
        
        ),
      },
    }); 

    const p = service.name.publish(invocation)
    assert.ok(p instanceof Promise)
    const resp = await p;
    assert.ok(!resp.ok);
    if ( ! (resp instanceof Error)) {
      throw new Error('expected resp to be Error')
    }
    assert.equal(resp.name, "PermissionError")
  })

  it("name/publish succeeds if `with` is issuer's did", async () => {
    assert.ok(typeof service.name.publish === 'function')
    const alice = createIssuer(await KeyPair.create());
    const bob = createIssuer(await KeyPair.create());
    

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
      },
    }); 

    const p = service.name.publish(invocation)
    assert.ok(p instanceof Promise)
    const resp = await p;
    assert.ok(resp.ok);
    assert.ok(resp.value.published);
  })

  
  /**
   * Test disabled because it's too complicated to implement today.
   * Handler function needs to inspect the whole delegation chain,
   * not just the issuer (which is alice, not bob)
   */
  xit("name/publish succeeds when invoked by a delegate", async () => {
    assert.ok(typeof service.name.publish === 'function')
    const alice = createIssuer(await KeyPair.create());
    const bob = createIssuer(await KeyPair.create());
    const aliceToBobDelegation = await Client.delegate({
      issuer: alice,
      audience: bob,
      capabilities: [{
        can: 'name/publish',
        with: alice.did().toString() as `${string}:${string}`,
      }]
    })

    const invocation = Client.invoke({
      issuer: bob,
      audience: bob,
      capability: {
        can: "name/publish",
        // @TODO dont use `as`
        with: alice.did().toString() as `${string}:${string}`,
        content: CID.parse(
          
          "bafybeidaaryc6aga3zjpujfbh4zabwzogd22y4njzrqzc4yv6nvyfm3tee"
        
        ),
      },
      proofs: [aliceToBobDelegation]
    }); 

    const p = service.name.publish(invocation)
    assert.ok(p instanceof Promise)
    const resp = await p;
    assert.ok(resp.ok);
    assert.ok(resp.value.published);
  });

  it("name/publish errors with InvalidInputError when publishing an invalid did", async () => {
    const alice = createIssuer(await KeyPair.create());

    const pubInvocation = Client.invoke({
      issuer: alice,
      audience: alice,
      capability: {
        can: "name/publish",
        // @ts-expect-error
        with: "not-a-did",
        content: CID.parse(
          "bafybeidaaryc6aga3zjpujfbh4zabwzogd22y4njzrqzc4yv6nvyfm3tee"
        ),
      },
    });

    try {
      // @ts-expect-error
      service.name.publish(pubInvocation);
    } catch (err) {
      assert.ok(err);
    }
  });

  it("it errors with NotFoundError if try to resolve unset id", async () => {
    const alice = createIssuer(await KeyPair.create());
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
    // set did
    const alice = createIssuer(await KeyPair.create());
    const aliceCid1 = ZERO_CID;
    // publish did1 -> cid1
    const publish = Client.invoke({
      issuer: alice,
      audience: alice,
      capability: {
        can: "name/publish",
        with: alice.did(),
        content: aliceCid1,
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
    console.log({ resolveResponse });
    assert.ok(resolveResponse.ok);
    assert.equal(
      resolveResponse.value.content.toString(),
      aliceCid1.toString()
    );
    // assert resolve result is cid1
  });
});
