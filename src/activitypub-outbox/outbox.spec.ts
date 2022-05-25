import { describe, it } from "mocha";
import { universalFetch } from "../fetch.js";
import { withHttpServer } from "../http.js";
import * as assert from "assert";
import { OutboxListener } from "./http-outbox.js";
import { hasOwnProperty } from "../object.js";

describe("activitypub-outbox", () => {
  it("responds to / with 200 and has name", async () => {
    const outboxListener = OutboxListener();
    await withHttpServer(outboxListener, async (baseUrl) => {
      const index = outboxListener.urls.index(baseUrl);
      const resp = await universalFetch(index.toString());
      assert.equal(resp.status, 200);
      const outbox = await resp.json();
      await assertOutboxIsNamed(outbox, "outbox");
    });
  });
});

async function assertOutboxIsNamed(outbox: unknown, expectedName: string) {
  assert.ok(typeof outbox === "object");
  assert.ok(outbox);
  assert.ok(hasOwnProperty(outbox, "name"));
  assert.ok(outbox.name);
  assert.ok(String(outbox.name).toLowerCase().includes(expectedName));
}
