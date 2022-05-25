import { describe, it } from "mocha";
import { universalFetch } from "../fetch.js";
import { withHttpServer } from "../http.js";
import * as assert from "assert";
import { RequestListener } from "http";
import { OutboxListener } from "./http-outbox.js";

describe("activitypub-outbox", () => {
    it("responds to / with 200 and welcome message", async () => {
      const outbox = OutboxListener();
      await withHttpServer(outbox, async (baseUrl) => {
        const index = outbox.urls.index(baseUrl);
        const resp = await universalFetch(index.toString());
        assert.equal(resp.status, 200);
        const respBodyText = await resp.text();
        const respBodyJson = JSON.parse(respBodyText);
        // console.log('respBodyText', respBodyText)
        // console.log('respBodyJson', respBodyJson)
        assert.ok(respBodyJson);
        assert.ok(
          String(respBodyJson).toLowerCase().includes("outbox")
        );
      });
    });
  });
  