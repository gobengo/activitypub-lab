import { describe, it } from "mocha";
import { universalFetch } from "./fetch.js";
import { withHttpServer } from "./http.js";
import {
  HttpNameResolver,
  HttpNameResolverUrls,
} from "./http-name-resolver.js";
import * as assert from "assert";

describe("http-name-resolver", () => {
  it("responds to / with 200", async () => {
    await withHttpServer(HttpNameResolver(), async (baseUrl) => {
      const index = HttpNameResolverUrls.index(baseUrl);
      const resp = await universalFetch(index.toString());
      assert.equal(resp.status, 200);
      const respBodyJson = await resp.json();
      assert.ok(respBodyJson.message);
      assert.ok(String(respBodyJson.message).includes("HttpNameResolver"));
    });
  });
});
