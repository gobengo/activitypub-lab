import * as assert from "assert";
import { describe, it } from "mocha";
import { KeyPair } from "ucan-storage/keypair";
import { Client } from "ucanto/src/lib.js";
import { service } from "./service.js";
import { createIssuer } from './issuer.js';
import { CID } from "multiformats";

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
    console.log('expect permissionError', resp)
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
});
