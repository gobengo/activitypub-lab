import * as assert from "assert";
import { InboxController } from "../activitypub-http/controller";
import { InboxGetRequest, InboxGetResponse } from "../activitypub-inbox/inbox";

/**
 * General Purpose ActivityPub Inbox test suite.
 * The goal is to be able to use this to test ap:inbox over any number of protocols
 * because e.g. the `getInbox` method is pluggable.
 */
export const test = async ({ get }: InboxController) => {
  const inbox = await get({});
  assert.equal(typeof inbox.totalItems, "number");
};
