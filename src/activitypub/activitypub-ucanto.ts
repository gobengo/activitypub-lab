import { DID } from "@ipld/dag-ucan/src/ucan";
import type { Invocation, Link, Result } from "ucanto/src/client";

type InboxGet = {
  with: DID;
  can: "activitypub/inbox/get";
};
type InboxGetResponse = {
  totalItems: number;
};

type InboxPost = {
  can: "activitypub/inbox/post";
  with: DID;
  activity: InboxPostableActivity;
};
type InboxPostResponse = {
  posted: true;
};

type AnnounceActivityPubCom = {
  "@context": "https://www.w3.org/ns/activitystreams";
  id: string;
  type: "Announce";
  actor: "activitypub.com";
};

export function createAnnounceActivityPubCom(
  id: DID = "did:key:z6Mkvy3ZJUpwtvFpkMUFi5AxJaMhc8TK8LAXTR5RdyBPHWM1"
): AnnounceActivityPubCom {
  return {
    "@context": "https://www.w3.org/ns/activitystreams",
    id,
    type: "Announce",
    actor: "activitypub.com",
  };
}

type InboxPostableActivity = AnnounceActivityPubCom;

type InboxPostHandler = (
  invocation: Invocation<InboxPost>
) => Promise<Result<InboxPostResponse, Error>>;
type InboxGetHandler = (
  invocation: Invocation<InboxGet>
) => Promise<Result<InboxGetResponse, Error>>;

type InboxItem = AnnounceActivityPubCom;

class InboxRepository {
  private inboxArray: Array<InboxItem> = [];
  // constructor() {}
  async push(activity: AnnounceActivityPubCom): Promise<void> {
    this.inboxArray.push(activity);
  }
  async count(): Promise<number> {
    return this.inboxArray.length;
  }
}

class InboxUcanto {
  constructor(public get: InboxGetHandler, public post: InboxPostHandler) {}
}

/**
 * Implements ActivityPub Server as ucanto Invocations
 */
class _ActivityPubUcanto {
  // public inbox: InboxUcanto;
  constructor(private getInboxRepository: () => InboxRepository) {}
  public did(): DID {
    return "did:web:activitypub.com";
  }
  public get inbox(): InboxUcanto {
    const get: InboxGetHandler = async (_invocation) => {
      const value: InboxGetResponse = {
        totalItems: await this.getInboxRepository().count(),
      };
      return { ok: true, value };
    };
    const post: InboxPostHandler = async (_invocation) => {
      const { activity } = _invocation.capability;
      await this.getInboxRepository().push(activity);
      const value: InboxPostResponse = {
        posted: true,
      };
      return { ok: true, value };
    };
    return { get, post };
  }
}

export function ActivityPubUcanto() {
  const inboxRepository = new InboxRepository();
  return new _ActivityPubUcanto(() => inboxRepository);
}
