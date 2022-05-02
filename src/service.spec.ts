import * as assert from "assert";
import { describe, it } from "mocha";
import { KeyPair } from "ucan-storage/keypair";
import { Client } from "ucanto/src/lib.js";
import { service } from "./service.js";
import { createIssuer } from './issuer.js';

describe("name", () => {
  it("exists", async () => {
    assert.ok(typeof service.name != 'undefined')
  });

  it("name/publish is an async function that takes a Publish message", async () => {
    assert.ok(typeof service.name.publish === 'function')
    const alice = createIssuer(await KeyPair.create());
    const bob = createIssuer(await KeyPair.create());

    const invocation = Client.invoke({
      issuer: alice,
      audience: bob,
      capability: {
        can: "name/publish",
        with: "foo:bar",
        content: "it's-a-link"
      },
    }) 

    const p = service.name.publish(invocation)
    assert.ok(p instanceof Promise)
    
  })
});
