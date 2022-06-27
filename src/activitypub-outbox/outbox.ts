import {
  Activity,
  ActivityDeliveryTarget,
  array,
} from "../activity/activity.js";
import { KnownActivitypubActivity } from "../activitypub/activitypub.js";
import { AnnounceActivityPubCom } from "../activitypub.com/announcement";
import { ServiceMethodHandler, ServiceMethod } from "../activitypub/handler.js";
import { ArrayRepository } from "../activitypub/repository-array.js";

export type Authorizer<Authorization = unknown> = (
  authorization: Authorization
) => boolean;

export type OutboxOptions = {
  authorizer: Authorizer;
  repository: ArrayRepository<OutboxItem>;
};

/** data repository for storing outbox items */
export type OutboxRepository = ArrayRepository<OutboxItem>;

export function MemoryOutboxRepository(): OutboxRepository {
  const repo = new ArrayRepository<OutboxItem>();
  return repo;
}

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
export type OutboxPostableActivity = AnnounceActivityPubCom | Activity;

type InvokeOutboxPostWithActivity = CapabilityInvocation<
  OutboxPostableActivity,
  OutboxPostableActivity
>;

/** https://www.w3.org/TR/activitypub/#client-to-server-interactions */
export type OutboxPost = {
  Request: OutboxPostableActivity | InvokeOutboxPostWithActivity;
  Response: {
    posted: true;
    status: 201;
  };
};

export const AS2_CONTEXT_VALUE = "https://www.w3.org/ns/activitystreams";

type Outbox = {
  "@context": typeof AS2_CONTEXT_VALUE;
  name: "outbox";
  status: 200;
  totalItems: number;
};

type NotAuthorizedError = {
  name: "NotAuthorizedError";
  status: 401;
};

/** https://www.w3.org/TR/activitypub/#outbox */
export type OutboxGet<Authorization = unknown> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  Request: {
    authorization: Authorization;
  };
  Response: Outbox | NotAuthorizedError;
};

/** type of Activity that can be in outbox */
export type OutboxItem = OutboxPostableActivity;

/**
 * ActivityPub handler for GET outbox.
 * It should return info about the outbox, e.g. how many items it contains and maybe a preview of them.
 */
export class OutboxGetHandler<Authorization = unknown>
  implements ServiceMethodHandler<OutboxGet<Authorization>>
{
  constructor(
    private outboxRepo: OutboxRepository,
    private authorize: Authorizer<Authorization>
  ) {}
  async handle(
    _request: OutboxGet<Authorization>["Request"]
  ): Promise<OutboxGet<Authorization>["Response"]> {
    if (!this.authorize(_request.authorization)) {
      return this.notAuthorizedResponse();
    }
    return this.outboxResponse();
  }
  protected notAuthorizedResponse(): NotAuthorizedError {
    return {
      name: "NotAuthorizedError",
      status: 401 as const,
    };
  }
  protected async outboxResponse(): Promise<Outbox> {
    return {
      "@context": AS2_CONTEXT_VALUE,
      name: "outbox",
      status: 200 as const,
      totalItems: await this.outboxRepo.count(),
    };
  }
}

type DeliveryResult =
  | { delivered: true; target: ActivityDeliveryTarget }
  | { delivered: false; reason: unknown };

const deliverToTarget = async (
  target: ActivityDeliveryTarget,
  activity: Activity
): Promise<DeliveryResult> => {
  if (typeof target === "string") {
    throw new Error("deliverToTarget cannot deliver to string targets");
  }
  const inboxPostResponse = await target.inbox.post(activity);
  return {
    target,
    delivered: inboxPostResponse.posted,
  };
};

type DeliverActivity = (activity: Activity) => Promise<{
  deliveries: DeliveryResult[];
}>;

const getInReplyToDeliveryTargets = (
  inReplyTo: Activity["inReplyTo"]
): ActivityDeliveryTarget[] => {
  if (typeof inReplyTo === "undefined") {
    return [];
  }
  if (typeof inReplyTo === "string") {
    return [inReplyTo];
  }
  return array(inReplyTo).flatMap((replyParent) => {
    if (typeof replyParent === "string") {
      console.warn(
        "getInReplyToDeliveryTargets cannot dereference string value. skipping. (@todo)",
        replyParent
      );
      return [];
    }
    return array(replyParent.attributedTo);
  });
};

const deliverActivity: DeliverActivity = async (activity) => {
  const targets: ActivityDeliveryTarget[] = [
    ...array(activity.cc ?? []),
    ...array(activity.inReplyTo ?? []).flatMap(getInReplyToDeliveryTargets),
  ];
  const deliveries = (
    await Promise.allSettled(
      targets.map(async (target) => {
        const result = await deliverToTarget(target, activity);
        return result;
      })
    )
  ).map((settledResult): DeliveryResult => {
    switch (settledResult.status) {
      case "rejected":
        return { delivered: false, reason: settledResult.reason };
      case "fulfilled":
        return settledResult.value;
      default:
        const _never: never = settledResult;
        throw new Error("unexpected settledResult.status");
    }
  });
  return { deliveries };
};

/**
 * ActivityPub handler for POST outbox.
 * This is invoked when a client publishes an activity to a server.
 */
export class OutboxPostHandler implements ServiceMethodHandler<OutboxPost> {
  constructor(
    private outboxRepo: OutboxRepository,
    private deliver = deliverActivity
  ) {}
  async handle(request: OutboxPost["Request"]) {
    const activity = this.readActivity(request);
    await this.outboxRepo.push(activity);
    await this.deliver(activity);
    return {
      posted: true as const,
      status: 201 as const,
    };
  }
  protected readActivity(request: OutboxPost["Request"]): Activity {
    switch (request["@context"]) {
      case "https://example.org/zcap/v1":
        return request.action;
    }
    return request;
  }
}
