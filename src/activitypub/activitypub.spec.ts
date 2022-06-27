import { deriveActivity } from "../activity/activity.js";
import { ActivityPubController } from "../activitypub-http/controller.js";
import { OutboxPost } from "../activitypub-outbox/outbox.js";
import { test } from "../test.js";
import { createActivityPub } from "./activitypub.js";
import {
  AnnounceActivityPubCom,
  createAnnounceActivityPubCom,
} from "./announcement.js";

test("can federate across two activitypubs", async () => {
  const ap1 = createActivityPub();
  const ap2 = createActivityPub();
  const announcement = deriveActivity(createAnnounceActivityPubCom(), {
    cc: [ap2],
  });
  const postAnnouncementResponse = await ap1.outbox.post(announcement);
});
