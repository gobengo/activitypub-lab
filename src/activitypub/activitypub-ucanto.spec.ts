import { describe, it } from "mocha";
import * as assert from "assert";
import * as Issuer from "../actor/issuer.js";
import { ActivityPubUcanto, createAnnounceActivityPubCom } from "./activitypub-ucanto.js";

describe("activitypub-ucanto", () => {
  it("can invoke activitypub/inbox/post", async () => {
      const alice = await Issuer.generate();
      const activitypub = ActivityPubUcanto();
      const inboxPostResponse = await activitypub.inbox.post({
          issuer: alice,
          audience: activitypub,
          capability: {
              can: "activitypub/inbox/post",
              with: alice.did(),
              activity: createAnnounceActivityPubCom(),
          }
      });
      assert.ok(inboxPostResponse.ok);
      assert.ok(inboxPostResponse.value.posted)
  });
});
