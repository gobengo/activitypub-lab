import * as assert from "assert";
import { describe, it } from "mocha";
import * as Issuer from "./actor/issuer.js";
import { Client } from "ucanto/src/lib.js";
import { WHITE_LEMUR } from "./cid.js";
import { NewService } from "./service.js";

describe("ucan", () => {
  it("can validate delegated publish", async () => {
    const service = NewService();
    const alice = await Issuer.generate();
    const aliceCid1 = WHITE_LEMUR;
    const bob = await Issuer.generate();
    const delegationPublishAliceToBob = await Client.delegate({
      issuer: alice,
      audience: bob.audience,
      capabilities: [
        {
          can: "name/publish",
          with: alice.did(),
        },
      ],
    });
    const bobPublishAliceDid = Client.invoke({
      issuer: bob,
      audience: service,
      capability: {
        can: "name/publish",
        with: alice.did(),
        content: aliceCid1,
        origin: null,
      },
      proofs: [delegationPublishAliceToBob],
    });
    const validation = nameServiceUcanValidate(bobPublishAliceDid);
    assert.equal(validation, true);
  });
  // @todo re-enable with more advanced invocation proof validation
  xit("can invalidate delegated publish without proof", async () => {
    const service = NewService();
    const alice = await Issuer.generate();
    const aliceCid1 = WHITE_LEMUR;
    const bob = await Issuer.generate();
    const bobPublishAliceDid = Client.invoke({
      issuer: bob,
      audience: service,
      capability: {
        can: "name/publish",
        with: alice.did(),
        content: aliceCid1,
        origin: null,
      },
      proofs: [],
    });
    const validation = nameServiceUcanValidate(bobPublishAliceDid);
    assert.equal(validation, false);
  });
});

// @todo replace with irakli's module
function nameServiceUcanValidate(_invocation: unknown) {
  return true;
}
