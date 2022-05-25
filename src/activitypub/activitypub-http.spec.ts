import { describe, it } from "mocha";
import { universalFetch } from "../fetch.js";
import { withHttpServer } from "../http.js";
import * as assert from "assert";
import { RequestListener } from "http";

const HttpActivityPub = Object.assign(
  (): RequestListener => {
    return (_req, _res) => {
      _res.writeHead(200);
      _res.end(JSON.stringify({ message: "activitypub" }));
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
});
