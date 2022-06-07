import { withHttpServer } from "../http.js";
import { describe, it } from "../test.js";
import {
  OutboxListener,
  announceActivityPubActivityType,
} from "./http-outbox.js";
import * as assert from "assert";
import { universalFetch } from "../fetch.js";
import { hasOwnProperty } from "../object.js";
import {
  AnnounceActivityPubCom,
  createAnnounceActivityPubCom,
} from "../activitypub/announcement.js";
import { PathReporter } from "io-ts/lib/PathReporter.js";

/**
 * @fileoverview Test http-outbox for requirements from Section 6.2 of the ActivityPub Spec
 * @see https://www.w3.org/TR/activitypub/#create-activity-outbox
 */

const EXAMPLE_15 = {
  "@context": "https://www.w3.org/ns/activitystreams" as const,
  type: "Note" as const,
  content: "This is a note",
  published: "2015-02-10T15:04:55Z",
  to: ["https://example.org/~john/"],
  cc: [
    "https://example.com/~erik/followers",
    "https://www.w3.org/ns/activitystreams#Public",
  ],
};

describe("activitypub-6-2-create-activity", () => {
  it("can io-ts decode announceActivityPubActivityType", async () => {
    const decoded = announceActivityPubActivityType.decode(
      createAnnounceActivityPubCom()
    );
    const report = PathReporter.report(decoded);
    assert.deepEqual(report, ["No errors!"]);
  });
  // skip until finish authz @todo
  it.skip("can send announce", async () => {
    const outboxListener = OutboxListener();
    await withHttpServer(outboxListener, async (baseUrl) => {
      const index = outboxListener.urls.index(baseUrl);
      const act: AnnounceActivityPubCom = createAnnounceActivityPubCom();
      const resp = await universalFetch(index.toString(), {
        headers: {
          "content-type": "application/json",
        },
        method: "post",
        body: JSON.stringify(act),
      });
      assert.equal(resp.status, 201, "expect 201 created http response");

      const resultLocation = resp.headers.get("location");
      assert.ok(resultLocation);
      assert.equal(typeof resultLocation, "string");

      // can fetch location
      const checkResp = await universalFetch(
        new URL(resultLocation, index).toString()
      );
      assert.equal(checkResp.status, 200);

      // parse postOutbox response json
      const postOutboxResponse = await resp.json();
      assert.equal(postOutboxResponse.posted, true);

      // fetch outbox
      const outbox = await fetchOutbox(outboxListener, baseUrl);
      assert.equal(outbox.totalItems, 1);
    });
  });
});

async function fetchOutbox(listener: OutboxListener, baseUrl: URL) {
  const index = listener.urls.index(baseUrl);
  const resp = await universalFetch(index.toString(), {
    method: "get",
  });
  const respJson = await resp.json();
  return respJson;
}
