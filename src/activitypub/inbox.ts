import { AnnounceActivityPubCom } from "./announcement.js";

export type InboxPostableActivity = AnnounceActivityPubCom;
export type InboxGetRequest = Record<string, unknown>;
export type InboxGetResponse = {
  totalItems: number;
};
export type InboxPostResponse = {
  posted: true;
};
export type InboxItem = AnnounceActivityPubCom;
