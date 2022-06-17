import { describe, it } from "mocha";
import { universalFetch } from "../fetch.js";
import { withHttpServer } from "../http.js";
import * as assert from "assert";
import { RequestListener } from "http";
import { InboxTester } from "../activitypub-http-test/inbox-tester.js";
import { InboxGetRequest } from "../activitypub-inbox/inbox.js";

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
  it("can be tested with InboxTester", async () => {
    await withHttpServer(HttpActivityPub(), async (baseUrl) => {
      const inboxUrl = new URL('/inbox', baseUrl)
      const getInbox = async (_req: InboxGetRequest) => {
        return (await universalFetch(inboxUrl.toString())).json()
      }
      const tester = new InboxTester(
        assert,
        getInbox,
      )
      await tester.testGetInbox();
    })
  })
});
