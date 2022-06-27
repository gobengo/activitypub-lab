import assert from "assert";
import { deriveActivity } from "../activity/activity.js";
import { ActivityPubController } from "../activitypub-http/controller.js";
import { OutboxPost } from "../activitypub-outbox/outbox.js";
import { createTestConsole, test } from "../test.js";
import { createActivityPub } from "./activitypub.js";
import {
  AnnounceActivityPubCom,
  createAnnounceActivityPubCom,
} from "./announcement.js";

test("can federate", async () => {
  const console = createTestConsole();
  const actor1 = createActivityPub(console);
  const actor2 = createActivityPub(console);
  // ap1 posts an activity ccing ap2
  await actor1.outbox.post(
    deriveActivity(createAnnounceActivityPubCom(), {
      cc: [actor2],
    })
  );
  const ap2Inbox = await actor2.inbox.get({});
  assert.equal(ap2Inbox.totalItems, 1);
});
