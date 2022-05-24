import { AnnounceActivityPubCom } from "./announcement";
import { InboxItem } from "./inbox";

export type OutboxPostableActivity = AnnounceActivityPubCom;
export type OutboxGetResponse = {
  totalItems: number;
};
export type OutboxPostResponse = {
  posted: true;
};

export type OutboxItem = InboxItem;
