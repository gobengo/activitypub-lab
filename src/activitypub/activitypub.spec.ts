import assert from "assert";
import {
  createRandomIdentifier,
  deriveActivity,
} from "../activity/activity.js";
import { createActivityPubActor } from "../activitypub-actor/activitypub-actor.js";
import { createTestConsole, test } from "../test.js";
import { createAnnounceActivityPubCom } from "../activitypub.com/announcement.js";

test("can federate", async () => {
  const console = createTestConsole();
  const actor1 = createActivityPubActor(console);
  const actor2 = createActivityPubActor(console);
  const activity = {
    ...createAnnounceActivityPubCom(),
    id: createRandomIdentifier(),
    attributedTo: actor1,
    cc: [actor2],
  };
  // actor1 posts an activity ccing actor2
  await actor1.outbox.post(activity);
  const a2Inbox = await actor2.inbox.get({});
  assert.equal(a2Inbox.totalItems, 1);
  assert.equal(a2Inbox.items[0].id, activity.id);
  // actor1's inbox shouldn't have been modified (only a2Inbox)
  assert.equal((await actor1.inbox.get({})).totalItems, 0);

  // actor2 replies to that post
  const reply = deriveActivity({
    attributedTo: actor2,
    id: createRandomIdentifier(),
    inReplyTo: activity,
  });
  await actor2.outbox.post(reply);
  const a1Inbox = await actor1.inbox.get({});
  assert.equal(a1Inbox.totalItems, 1);
  assert.equal(a1Inbox.items[0].id, reply.id);

  // make an actor3 reply to both `activity` and `reply`
  const actor3 = createActivityPubActor(console);
  const replyFrom3 = deriveActivity({
    inReplyTo: [activity, reply],
  });
  await actor2.outbox.post(replyFrom3);
  // actor1 and actor2 both got it
  assert.equal((await actor1.inbox.get({})).totalItems, 2);
  assert.equal((await actor2.inbox.get({})).totalItems, 2);
  // actor3 didn't get their own thing
  assert.equal((await actor3.inbox.get({})).totalItems, 0);
});
