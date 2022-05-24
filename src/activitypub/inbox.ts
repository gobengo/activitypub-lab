import { Handler } from "./handler.js";
import { AnnounceActivityPubCom } from "./announcement.js";

/** type of Activity accepted by Inbox */
export type InboxPostableActivity = AnnounceActivityPubCom;

/** request to GET inbox */
export type InboxGetRequest = Record<string, unknown>;

/** response from GET inbox */
export type InboxGetResponse = {
  /** total number of items in Inbox */
  totalItems: number;
};

export type InboxPostRequest = InboxPostableActivity;

/** response from POST inbox */
export type InboxPostResponse = {
  /** indication that the post was posted */
  posted: true;
};

/** type that inbox contains */
export type InboxItem = InboxPostableActivity;
