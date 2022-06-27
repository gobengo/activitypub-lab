import { InboxPost } from "../activitypub-inbox/inbox.js";
import { v4 as uuidv4 } from "uuid";

type UriPrefix = "did" | "urn:uuid";
type URI = `${UriPrefix}:${string}`;
export type Identifier = URI;

const toArray = <T>(input: T | T[]): T[] => {
  if (typeof input === "undefined") {
    return [];
  }
  return Array.isArray(input) ? input : [input];
};

type InboxPostable = {
  inbox: {
    post: InboxPost;
  };
};

export type ActivityOverlay = {
  cc?: Array<InboxPostable | Identifier>;
};

export type Activity = {
  id: URI;
  cc: Array<InboxPostable | Identifier>;
};

export const deriveActivity = <T extends Partial<Activity>>(
  base: T,
  overlay: ActivityOverlay
): T & Activity => {
  const activity = {
    id: base.id ?? createRandomIdentifier(),
    ...base,
    cc: [...toArray(base.cc), ...(overlay.cc || [])],
  };
  return activity;
};

function createRandomIdentifier(): Identifier {
  return `urn:uuid:${uuidv4()}`;
}
