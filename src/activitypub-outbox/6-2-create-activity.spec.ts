import { withHttpServer } from "../http.js";
import { describe, it } from "../test.js";
import { OutboxListener } from "./http-outbox.js";
import * as assert from "assert";
import { universalFetch } from "../fetch.js";
import { hasOwnProperty } from "../object.js";

/**
 * @see https://www.w3.org/TR/activitypub/#create-activity-outbox
 */

describe("activitypub-6-2-create-activity", () => {
  it("responds to / with 200 and welcome message", async () => {
    const outboxListener = OutboxListener();
    await withHttpServer(outboxListener, async (baseUrl) => {
      const index = outboxListener.urls.index(baseUrl);
      const resp = await universalFetch(index.toString());

      assert.equal(resp.status, 200, "expect successful http response");

      // parse json
      const respBodyText = await resp.text(),
        outbox = JSON.parse(respBodyText);

      await assertOutboxIsEmpty(outbox);
    });
  });
});

async function assertOutboxIsEmpty(outbox: unknown) {
  assert.ok(typeof outbox === "object");
  assert.ok(outbox);
  assert.ok(hasOwnProperty(outbox, "totalItems"));
  assert.equal(
    typeof outbox.totalItems,
    "number",
    "expected outbox.totalItems to be a number"
  );
  assert.equal(
    outbox.totalItems,
    0,
    "Expected initial totalItems to be 0. The outbox is initially empty."
  );
}
