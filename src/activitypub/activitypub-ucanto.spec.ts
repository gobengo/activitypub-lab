import { describe, it } from "mocha";
import { universalFetch } from "../fetch.js";
import { withHttpServer } from "../http.js";
import * as assert from "assert";
import * as Issuer from "../actor/issuer.js";
import { NewService } from "../service.js";
import * as Client from "ucanto/src/client.js";
import * as Server from "ucanto/src/server.js";
import * as Transport from "ucanto/src/transport.js";
import { RequestListener } from "http";
import { DID } from "@ipld/dag-ucan/src/ucan";

import type { Invocation, Link, Result } from "ucanto/src/client";

type InboxPost = {
    can: "activitypub/inbox/post";
    with: DID;
    activity: InboxPostableActivity
  };
  type InboxPostResponse = {
      posted: true;
  }
  
type AnnounceActivityPubCom = {
    type: "Announce",
    actor: "activitypub.com"
}

function createAnnounceActivityPubCom(): AnnounceActivityPubCom {
    return {
        type: "Announce",
        actor: "activitypub.com"
    }
}

type InboxPostableActivity = AnnounceActivityPubCom

type InboxPostHandler = (invocation: Invocation<InboxPost>) => Promise<Result<InboxPostResponse, Error>>

class _ActivityPubUcanto {
    public did: () => DID;
    public inbox: {
        post: InboxPostHandler
    }
    constructor() {
        const post: InboxPostHandler = async (_invocation) => {
            const value: InboxPostResponse = {
                posted: true,
            }
            return { ok: true, value }
        }
        this.inbox = {
            post,
        }
        this.did = () => "did:web:activitypub.com"
    }
}

function ActivityPubUcanto() {
    return new _ActivityPubUcanto
}

describe("activitypub-ucanto", () => {
  it("can invoke activitypub/inbox/post", async () => {
      const alice = await Issuer.generate();
      const activitypub = ActivityPubUcanto();
      const inboxPostResponse = await activitypub.inbox.post({
          issuer: alice,
          audience: activitypub,
          capability: {
              can: "activitypub/inbox/post",
              with: alice.did(),
              activity: createAnnounceActivityPubCom(),
          }
      });
      assert.ok(inboxPostResponse.ok);
      assert.ok(inboxPostResponse.value.posted)
  });
});
