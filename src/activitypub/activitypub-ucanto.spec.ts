import { describe, it } from "mocha";
import * as assert from "assert";
import * as Issuer from "../actor/issuer.js";
import {
  ActivityPubUcanto,
  createAnnounceActivityPubCom,
} from "./activitypub-ucanto.js";
import { Agent } from "ucanto/src/api";

async function exampleInboxPost(
  activitypub: ReturnType<typeof ActivityPubUcanto>,
  issuer: Agent
) {
  const response = await activitypub.inbox.post({
    issuer,
    audience: activitypub,
    capability: {
      can: "activitypub/inbox/post",
      with: issuer.did(),
      activity: createAnnounceActivityPubCom(),
    },
  });
  assert.ok(response.ok);
  assert.ok(response.value);
  return response;
}

describe("activitypub-ucanto", () => {
  it("has functional inbox", async () => {
    const alice = await Issuer.generate();
    const activitypub = ActivityPubUcanto();
    const postIntentions = new Array(3);
    for (const iter of postIntentions) {
      await exampleInboxPost(activitypub, alice);
    }
    /**
     * Now let's get the inbox
     */
    const inboxGetResponse = await activitypub.inbox.get({
      issuer: alice,
      audience: activitypub,
      capability: {
        can: "activitypub/inbox/get",
        with: alice.did(),
      },
    });
    assert.ok(inboxGetResponse.ok);
    assert.equal(
      inboxGetResponse.value.inbox.totalItems,
      postIntentions.length
    );
  });
});
