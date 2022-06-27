import { deriveActivity } from "../activity/activity.js";
import { ActivityPubController } from "../activitypub-http/controller.js";
import { OutboxPost } from "../activitypub-outbox/outbox.js";
import { test } from "../test.js";
import { createActivityPub } from "./activitypub.js";
import {
  AnnounceActivityPubCom,
  createAnnounceActivityPubCom,
} from "./announcement.js";

// test('can federate across two activitypubs', () => {
//     const ap1 = createActivityPub()
//     const ap2 = createActivityPub()
//     const announce = createAnnounceActivityPubCom()
//     const postAnnounce: OutboxPost['Request'] = announce;
//     ap1.outbox.post(deriveActivity(createAnnounceActivityPubCom(), {
//         cc: [ap2]
//     }))
// })
