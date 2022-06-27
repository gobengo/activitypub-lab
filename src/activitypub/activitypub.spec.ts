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
  const activity = deriveActivity(createAnnounceActivityPubCom(), {
    id: createRandomIdentifier(),
    cc: [actor2],
  });
  // ap1 posts an activity ccing ap2
  await actor1.outbox.post(activity);
  const ap2Inbox = await actor2.inbox.get({});
  assert.equal(ap2Inbox.totalItems, 1);
  assert.equal(ap2Inbox.items[0].id, activity.id);
  // ap2 replies to that post
  const reply = deriveActivity({
    id: createRandomIdentifier(),
    inReplyTo: activity.id,
  });
  await actor2.outbox.post(reply);
});
