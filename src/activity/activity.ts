import { InboxPostFunction } from "../activitypub-inbox/inbox.js";
import { v4 as uuidv4 } from "uuid";

type UriPrefix = "did" | "urn:uuid";
type URI = `${UriPrefix}:${string}`;
export type Identifier = URI;

export const array = <T>(input: T | T[]): T[] => {
  if (typeof input === "undefined") {
    return [];
  }
  return Array.isArray(input) ? input : [input];
};

type InboxPostable = {
  inbox: {
    post: InboxPostFunction;
  };
};

export type ActivityDeliveryTarget = InboxPostable | Identifier;

/** one or more things. item or array of items. */
type Many<T> = T | T[];

export type OptionalActivityProperties = {
  attributedTo: Identifier | InboxPostable;
  cc: ActivityDeliveryTarget[];
  inReplyTo: Many<Identifier | { attributedTo: InboxPostable }>;
};

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
