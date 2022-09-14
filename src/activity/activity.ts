import { InboxPostFunction } from "../activitypub-inbox/inbox.js";
import { v4 as uuidv4 } from "uuid";

export type UriPrefix = "did" | "urn:uuid";
/** uniform resource indicator */
export type URI = `${UriPrefix}:${string}`;
export type Identifier = URI;

export const array = <T>(input: T | T[]): T[] => {
  if (typeof input === "undefined") {
    return [];
  }
  return Array.isArray(input) ? input : [input];
};

export type InboxPostable = {
  inbox: {
    post: InboxPostFunction;
  };
};

/**  */
export type ActivityDeliveryTarget = InboxPostable | Identifier;

/** one or more things. item or array of items. */
export type OneOrMore<T> = T | T[];

export type OptionalActivityProperties = {
  attributedTo: Identifier | InboxPostable;
  cc: ActivityDeliveryTarget[];
  inReplyTo: OneOrMore<Identifier | { attributedTo: InboxPostable }>;
};

/**
 * a social activity
 * matching activitystreams 2.0 schema
 */
export type Activity = {
  "@context": "https://www.w3.org/ns/activitystreams";
  id: URI;
} & Partial<OptionalActivityProperties>;

export const deriveActivity = <T extends Partial<Activity>>(
  base: T,
  overlay: Partial<Activity> = {}
) => {
  const activity = {
    "@context": "https://www.w3.org/ns/activitystreams" as const,
    ...base,
    id: base.id ?? createRandomIdentifier(),
    cc: [...array(base.cc ?? []), ...(overlay.cc ?? [])],
  };
  return activity;
};

export function createRandomIdentifier(): Identifier {
  return `urn:uuid:${uuidv4()}`;
}
