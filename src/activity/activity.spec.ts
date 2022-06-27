import { createAnnounceActivityPubCom } from "../activitypub.com/announcement.js";
import { test } from "../test.js";
import { deriveActivity } from "./activity.js";
import assert from "assert/strict";

test("can deriveActivity to add cc", () => {
  const base = createAnnounceActivityPubCom();
  const ccTarget = "did:web:bengo.is";
  const created = deriveActivity(base, { cc: [ccTarget] });
  assert.ok(created.cc?.includes(ccTarget));
});
