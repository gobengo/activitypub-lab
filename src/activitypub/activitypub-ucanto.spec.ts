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
  actor: Agent
) {
  const response = await activitypub.inbox.post({
    issuer: actor,
    audience: activitypub,
    capability: {
      can: "activitypub/inbox/post",
      with: actor.did(),
      activity: createAnnounceActivityPubCom(),
    },
  });
  assert.ok(response.ok);
  assert.ok(response.value);
  return response;
}

async function exampleInboxGet(
  activitypub: ReturnType<typeof ActivityPubUcanto>,
  actor: Agent
) {
  const result = await activitypub.inbox.get({
    issuer: actor,
    audience: activitypub,
    capability: {
      can: "activitypub/inbox/get",
      with: actor.did(),
    }
  })
  assert.ok(result.ok);
  const { value: inbox } = result;
  assert.ok(inbox);
  assert.equal(typeof inbox.totalItems, 'number')
  return inbox;
}

describe("activitypub-ucanto", () => {
  it("has apparently functional inbox", async () => {
    const alice = await Issuer.generate();
    const activitypub = ActivityPubUcanto();
    const postIntentions = new Array(3);
    for (const _i of postIntentions) {
      await exampleInboxPost(activitypub, alice);
    }
    const inbox = await exampleInboxGet(activitypub, alice);
    assert.equal(inbox.totalItems, postIntentions.length);
  });
});
