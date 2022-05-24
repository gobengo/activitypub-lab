import { KnownActivitypubActivity } from "../activitypub/activitypub-ucanto";
import { AnnounceActivityPubCom } from "../activitypub/announcement";
import { ServiceMethodHandler, ServiceMethod } from "../activitypub/handler.js";
import { ArrayRepository } from "../activitypub/repository-array";

/** data repository for storing outbox items */
export type OutboxRepository = ArrayRepository<OutboxItem>;

type Iso8601String = string;
type Uri = string;
type VerificationMethodUri = Uri;
type Ed25519Signature2020<ProofPurpose> = {
  type: "Ed25519Signature2020";
  created: Iso8601String;
  verificationMethod: VerificationMethodUri;
  proofPurpose: ProofPurpose;
  proofValue: string;
  domain?: string;
};
type JsonldProved<ProofPurpose> = {
  proof: Ed25519Signature2020<ProofPurpose>;
};

type CapabilityInvocation<_Request, _Action> = {
  "@context": "https://example.org/zcap/v1";
  /** nonce */
  id: string;
  action: _Request;
  proof: {
    /** capability being invoked */
    capability: Uri;
    created: Iso8601String;
    /** creator of this invocation proof */
    creator: Uri;
  };
};

/** type of Activity that can be posted to outbox */
export type OutboxPostableActivity = AnnounceActivityPubCom;

type InvokeOutboxPostWithActivity = CapabilityInvocation<
  OutboxPostableActivity,
  OutboxPostableActivity
>;

/** https://www.w3.org/TR/activitypub/#client-to-server-interactions */
export type OutboxPost = {
  Request: OutboxPostableActivity | InvokeOutboxPostWithActivity;
  Response: {
    posted: true;
  };
};

/** https://www.w3.org/TR/activitypub/#outbox */
export type OutboxGet = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  Request: {};
  Response: {
    totalItems: number;
  };
};

/** type of Activity that can be in outbox */
export type OutboxItem =
  | KnownActivitypubActivity
  | InvokeOutboxPostWithActivity;

/**
 * ActivityPub handler for GET outbox.
 * It should return info about the outbox, e.g. how many items it contains and maybe a preview of them.
 */
export class OutboxGetHandler implements ServiceMethodHandler<OutboxGet> {
  constructor(private outboxRepo: OutboxRepository) {}
  async handle(_request: OutboxGet["Request"]) {
    return {
      totalItems: await this.outboxRepo.count(),
    };
  }
}

/**
 * ActivityPub handler for POST outbox.
 * This is invoked when a client publishes an activity to a server.
 */
export class OutboxPostHandler implements ServiceMethodHandler<OutboxPost> {
  constructor(private outboxRepo: OutboxRepository) {}
  async handle(_request: OutboxPost["Request"]) {
    await this.outboxRepo.push(_request);
    return {
      posted: true as const,
    };
  }
}
