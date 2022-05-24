import { DID } from "@ipld/dag-ucan/src/ucan";
import type { Invocation, Link, Result } from "ucanto/src/client";
import { AnnounceActivityPubCom } from "./announcement.js";
import {
  InboxGetRequest,
  InboxGetResponse,
  InboxItem,
  InboxPostableActivity,
  InboxPostResponse,
} from "./inbox.js";
import {
  OutboxGetResponse,
  OutboxPostableActivity,
  OutboxPostResponse,
} from "./outbox.js";
import { ArrayRepository } from "./repository-array.js";

// inbox
type InboxGetUcanto = InboxGetRequest & {
  with: DID;
  can: "activitypub/inbox/get";
};
type InboxPostUcanto = {
  can: "activitypub/inbox/post";
  with: DID;
  activity: InboxPostableActivity;
};
type InboxPostUcantoHandler = (
  invocation: Invocation<InboxPostUcanto>
) => Promise<Result<InboxPostResponse, Error>>;
type InboxGetHandler = (
  invocation: Invocation<InboxGetUcanto>
) => Promise<Result<InboxGetResponse, Error>>;

class InboxUcanto {
  constructor(
    public get: InboxGetHandler,
    public post: InboxPostUcantoHandler
  ) {}
}

// bind outbox<->ucanto

type OutboxPostHandler = (
  invocation: Invocation<OutboxPostUcanto>
) => Promise<Result<OutboxPostResponse, Error>>;
type OutboxGetHandler = (
  invocation: Invocation<OutboxGetUcanto>
) => Promise<Result<OutboxGetResponse, Error>>;
type OutboxGetUcanto = {
  with: DID;
  can: "activitypub/outbox/get";
};
type OutboxPostUcanto = {
  can: "activitypub/outbox/post";
  with: DID;
  activity: OutboxPostableActivity;
};

class OutboxUcanto {
  constructor(public get: OutboxGetHandler, public post: OutboxPostHandler) {}
}

/**
 * Implements ActivityPub Server as ucanto Invocations
 */
class _ActivityPubUcanto {
  // public inbox: InboxUcanto;
  constructor(
    private getInboxRepository: () => ArrayRepository<AnnounceActivityPubCom>,
    private getOutboxRepository: () => ArrayRepository<AnnounceActivityPubCom>
  ) {}
  public did(): DID {
    return "did:web:activitypub.com";
  }
  #receiveActivity = async (activity: AnnounceActivityPubCom) => {
    return this.getInboxRepository().push(activity);
  };
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
    const post: InboxPostUcantoHandler = async (_invocation) => {
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

type KnownActivitypubActivity = AnnounceActivityPubCom;

export function ActivityPubUcanto() {
  const inboxRepository = new ArrayRepository<KnownActivitypubActivity>();
  const outboxRepository = new ArrayRepository<KnownActivitypubActivity>();
  return new _ActivityPubUcanto(
    () => inboxRepository,
    () => outboxRepository
  );
}
