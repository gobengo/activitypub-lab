import * as assert from "assert";
import { OutboxController } from "../activitypub-http/controller.js";
import { createAnnounceActivityPubCom } from "../activitypub/announcement.js";

const testGet = async (get: OutboxController["get"]) => {
  const outbox = await get({
    authorization: "",
  });
  assert.ok(outbox.name === "outbox");
  assert.equal(typeof outbox.totalItems, "number");
};

/**
 * General Purpose ActivityPub Outbox test suite.
 * The goal is to be able to use this to test ap:inbox over any number of protocols
 * because e.g. the `getInbox` method is pluggable.
 */
export const test = async ({ get }: OutboxController) => {
  await testGet(get);
};
