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

export function createAnnounceActivityPubCom(): AnnounceActivityPubCom {
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

export function ActivityPubUcanto() {
    return new _ActivityPubUcanto
}
