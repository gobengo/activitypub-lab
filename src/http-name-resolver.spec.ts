import { describe, it } from "mocha";
import { universalFetch } from "./fetch.js";
import { withHttpServer } from "./http.js";
import {
  HttpNameResolver,
  HttpNameResolverUrls,
} from "./http-name-resolver.js";
import * as assert from "assert";
import * as Issuer from "./actor/issuer.js";
import { NewService } from "./service.js";

describe("http-name-resolver", () => {
  it("responds to / with 200 and welcome message", async () => {
    await withHttpServer(
      await HttpNameResolver(NewService()),
      async (baseUrl) => {
        const index = HttpNameResolverUrls.index(baseUrl);
        const resp = await universalFetch(index.toString());
        assert.equal(resp.status, 200);
        const respBodyJson = await resp.json();
        assert.ok(respBodyJson.message);
        assert.ok(String(respBodyJson.message).includes("HttpNameResolver"));
      }
    );
  });
  it("responds to unpublished /{did} with 404", async () => {
    const alice = await Issuer.generate();
    await withHttpServer(
      await HttpNameResolver(NewService()),
      async (baseUrl) => {
        const aliceNameResolution = HttpNameResolverUrls.resolve(
          baseUrl,
          alice.did()
        );
        const resp = await universalFetch(aliceNameResolution.toString());
        assert.equal(resp.status, 404);
      }
    );
  });
});
