import * as assert from "assert";
import { InboxController } from "../activitypub-http/controller.js";
import { createAnnounceActivityPubCom } from "../activitypub/announcement.js";

const testGetInbox = async (get: InboxController['get']) => {
  const inbox = await get({});
  assert.equal(typeof inbox.totalItems, "number");
}

/**
 * Test that a sample activity can be posted to the inbox.
 */
const testCanPostAnnouncementToInbox = async (post: InboxController['post']) => {
  const announcePostResponse = await post(createAnnounceActivityPubCom());
  assert.ok(announcePostResponse)
}

const testPostInbox = async (post: InboxController['post']) => {
  await testCanPostAnnouncementToInbox(post);
}

/**
 * General Purpose ActivityPub Inbox test suite.
 * The goal is to be able to use this to test ap:inbox over any number of protocols
 * because e.g. the `getInbox` method is pluggable.
 */
export const test = async ({ get, post }: InboxController) => {
  await testGetInbox(get);
  await testPostInbox(post);
};
