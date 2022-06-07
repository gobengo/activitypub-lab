import { describe, it } from "mocha";
import * as assert from "assert";
import * as Issuer from "../actor/issuer.js";
import { ActivityPubUcanto } from "./activitypub-ucanto.js";
import { Agent } from "ucanto/src/api";
import { createAnnounceActivityPubCom } from "./announcement.js";

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
    },
  });
  assert.ok(result.ok);
  const { value: inbox } = result;
  assert.ok(inbox);
  assert.equal(typeof inbox.totalItems, "number");
  return inbox;
}

async function exampleOutboxGet(
  activitypub: ReturnType<typeof ActivityPubUcanto>,
  actor: Agent
) {
  const result = await activitypub.outbox.get({
    issuer: actor,
    audience: activitypub,
    capability: {
      can: "activitypub/outbox/get",
      with: actor.did(),
    },
  });
  assert.ok(result.ok);
  const { value: inbox } = result;
  assert.ok(inbox);
  // assert.equal(typeof inbox.totalItems, "number");
  return inbox;
}

async function examplePost(
  activitypub: ReturnType<typeof ActivityPubUcanto>,
  collectionRel: "outbox" | "inbox",
  actor: Agent
) {
  // const collection = activitypub[collectionRel]
  // const can: "activitypub/inbox/post" | "activitypub/outbox/post" = `activitypub/${collectionRel}/post` as const;
  if (collectionRel === "inbox") {
    const result1 = await activitypub[collectionRel].post({
      issuer: actor,
      audience: activitypub,
      capability: {
        can: "activitypub/inbox/post",
        with: actor.did(),
        activity: createAnnounceActivityPubCom(),
      },
    });
    assert.ok(result1.ok);
    assert.ok(result1.value);
    return result1;
  } else {
    const result2 = await activitypub[collectionRel].post({
      issuer: actor,
      audience: activitypub,
      capability: {
        can: "activitypub/outbox/post",
        with: actor.did(),
        activity: createAnnounceActivityPubCom(),
      },
    });
    assert.ok(result2.ok);
    assert.ok(result2.value);
    return result2;
  }
  throw new Error("unexpected collectionRel");
}

describe("activitypub-ucanto", () => {
  it("has apparently functional inbox", async () => {
    const alice = await Issuer.generate();
    const activitypub = ActivityPubUcanto();
    const postIntentions = new Array(3);
    for (const _i of postIntentions) {
      await examplePost(activitypub, "inbox", alice);
    }
    const inbox = await exampleInboxGet(activitypub, alice);
    assert.equal(inbox.totalItems, postIntentions.length);
  });
  it("has apparently functional outbox", async () => {
    const alice = await Issuer.generate();
    const activitypub = ActivityPubUcanto();
    const outboxIntentions = new Array(3);
    for (const _i of outboxIntentions) {
      await examplePost(activitypub, "outbox", alice);
    }
    const outbox = await exampleOutboxGet(activitypub, alice);
    // assert.equal(outbox.totalItems, outboxIntentions.length);
  });
});
