import { ActivityPubController } from "../activitypub-http/controller.js";
import { test as testInbox } from "./inbox-tester.js";

/**
 * ActivityPub Test Suite
 */
export const test = async (
  /**
   * controller to invoke methods of an activitypub implementation,
   * e.g. by issuing HTTP requests
   */
  activitypub: ActivityPubController
) => {
  await testInbox(activitypub.inbox);
  return true;
};
