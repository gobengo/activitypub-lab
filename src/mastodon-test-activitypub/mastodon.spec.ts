import { describe, it, test } from "mocha";
import { universalFetch } from "../fetch.js";
import * as assert from "assert";
import { HttpActivityPubController } from "../activitypub-http/controller-http.js";
import { test as testOutbox } from "../activitypub-http-test/outbox-tester.js";

test.skip("mastodon can be tested with ActivityPubTester", async () => {
  const actorUrl = new URL("https://mastodon.social/users/bengo");
  const actor = await universalFetch(actorUrl.toString(), {
    headers: {
      accept: "application/json",
    },
  }).then((r) => r.json());
  assert.ok(actor.name);
  assert.ok(typeof actor.name === "string");
  assert.ok(actor.inbox);
  assert.ok(typeof actor.inbox === "string");
  assert.ok(actor.outbox);
  assert.ok(typeof actor.outbox === "string");

  const controller = new HttpActivityPubController(
    actorUrl,
    new URL(actor.inbox, actorUrl),
    undefined,
    new URL(actor.outbox, actorUrl),
    undefined
  );
  await testOutbox(controller.outbox);
});
