import { describe, it } from "mocha";
import { universalFetch } from "../fetch.js";
import { withHttpServer } from "../http.js";
import * as assert from "assert";
import { RequestListener } from "http";
import { test as testActivityPub } from "../activitypub-http-test/tester.js";
import { HttpActivityPubController } from "./controller-http.js";

const HttpActivityPub = Object.assign(
  (): RequestListener => {
    return (_req, _res) => {
      _res.writeHead(200);
      _res.end(JSON.stringify({ message: "activitypub", totalItems: 0 }));
    };
  },
  {
    urls: {
      index(baseUrl: URL) {
        return new URL(baseUrl);
      },
    },
  }
);

describe("activitypub-http", () => {
  it("responds to / with 200 and welcome message", async () => {
    const requestListener: RequestListener = HttpActivityPub();
    await withHttpServer(requestListener, async (baseUrl) => {
      const index = HttpActivityPub.urls.index(baseUrl);
      const resp = await universalFetch(index.toString());
      assert.equal(resp.status, 200);
      const respBodyJson = await resp.json();
      assert.ok(respBodyJson.message);
      assert.ok(
        String(respBodyJson.message).toLowerCase().includes("activitypub")
      );
    });
  });
  it("can be tested with ActivityPubTester", async () => {
    await withHttpServer(HttpActivityPub(), async (baseUrl) => {
      await testActivityPub(new HttpActivityPubController(baseUrl));
    });
  });
});
