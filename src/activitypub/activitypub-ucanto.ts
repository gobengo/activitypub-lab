import { DID } from "@ipld/dag-ucan/src/ucan";
import type { Invocation, Link, Result } from "ucanto/src/client";

// sample activity

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

// inbox
type InboxPostableActivity = AnnounceActivityPubCom;
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
type InboxPostHandler = (
  invocation: Invocation<InboxPost>
) => Promise<Result<InboxPostResponse, Error>>;
type InboxGetHandler = (
  invocation: Invocation<InboxGet>
) => Promise<Result<InboxGetResponse, Error>>;
type InboxItem = AnnounceActivityPubCom;

class ArrayRepository<T> {
  private inboxArray: Array<T> = [];
  // constructor() {}
  async push(activity: T): Promise<void> {
    this.inboxArray.push(activity);
  }
  async count(): Promise<number> {
    return this.inboxArray.length;
  }
}

class InboxUcanto {
  constructor(public get: InboxGetHandler, public post: InboxPostHandler) {}
}

type OutboxPostableActivity = AnnounceActivityPubCom;
type OutboxPostHandler = (
  invocation: Invocation<OutboxPost>
) => Promise<Result<OutboxPostResponse, Error>>;
type OutboxGetHandler = (
  invocation: Invocation<OutboxGet>
) => Promise<Result<OutboxGetResponse, Error>>;
type OutboxGet = {
  with: DID;
  can: "activitypub/outbox/get";
};
type OutboxGetResponse = {
  totalItems: number;
};
type OutboxPost = {
  can: "activitypub/outbox/post";
  with: DID;
  activity: OutboxPostableActivity;
};
type OutboxPostResponse = {
  posted: true;
};

type OutboxItem = InboxItem;

class OutboxUcanto {
  constructor(
    public get: OutboxGetHandler,
    public post: OutboxPostHandler,
  ) {}
}

/**
 * Implements ActivityPub Server as ucanto Invocations
 */
class _ActivityPubUcanto {
  // public inbox: InboxUcanto;
  constructor(
    private getInboxRepository: () => ArrayRepository<AnnounceActivityPubCom>,
    private getOutboxRepository: () => ArrayRepository<AnnounceActivityPubCom>,
  ) {}
  public did(): DID {
    return "did:web:activitypub.com";
  }
  #receiveActivity = async (activity: AnnounceActivityPubCom) => {
    return this.getInboxRepository().push(activity);
  }
  public get outbox(): OutboxUcanto {
    const get: OutboxGetHandler = async (_invocation) => {
      const value: OutboxGetResponse = {
        totalItems: await this.getOutboxRepository().count(),
      };
      return { ok: true, value };
    };
    const post: OutboxPostHandler = async (_invocation) => {
      const { activity } = _invocation.capability;
      await this.#receiveActivity(activity);
      const value: OutboxPostResponse = {
        posted: true,
      };
      return { ok: true, value };
    };
    return { get, post };
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

type KnownActivitypubActivity = AnnounceActivityPubCom

export function ActivityPubUcanto() {
  const inboxRepository = new ArrayRepository<KnownActivitypubActivity>();
  const outboxRepository = new ArrayRepository<KnownActivitypubActivity>();
  return new _ActivityPubUcanto(
    () => inboxRepository,
    () => outboxRepository,
  );
}
