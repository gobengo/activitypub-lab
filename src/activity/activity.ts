import { InboxPost } from "../activitypub-inbox/inbox.js";

type UriScheme = "did";
type URI = `${UriScheme}:${string}`;
type Identifier = URI;

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

export const deriveActivity = (
  base: Record<string, unknown>,
  overlay: ActivityOverlay
) => {
  const activity = {
    ...base,
    cc: [...toArray(base.cc), ...(overlay.cc || [])],
  };
  return activity;
};
