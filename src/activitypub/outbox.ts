import { AnnounceActivityPubCom } from "./announcement";
import { Handler } from "./handler.js";
import { InboxItem } from "./inbox";
import { ArrayRepository } from "./repository-array";

export type OutboxRepository = ArrayRepository<OutboxItem>;
export type OutboxPostableActivity = AnnounceActivityPubCom;
// eslint-disable-next-line @typescript-eslint/ban-types
export type OutboxGetRequest = {};
export type OutboxGetResponse = {
  totalItems: number;
};
export type OutboxPostRequest = OutboxPostableActivity;
export type OutboxPostResponse = {
  posted: true;
};

export type OutboxGet = {
  Request: OutboxGetRequest;
  Resposne: OutboxGetResponse;
};
export type OutboxPost = {
  Request: OutboxPostRequest;
  Resposne: OutboxPostResponse;
};
export type OutboxItem = InboxItem;

export class OutboxGetHandler
  implements Handler<OutboxGetRequest, OutboxGetResponse>
{
  constructor(private outboxRepo: OutboxRepository) {}
  async handle(_request: OutboxGetRequest) {
    return {
      totalItems: await this.outboxRepo.count(),
    };
  }
}

export class OutboxPostHandler
  implements Handler<OutboxPostableActivity, OutboxPostResponse>
{
  constructor(private outboxRepo: OutboxRepository) {}
  async handle(_request: OutboxPostRequest) {
    await this.outboxRepo.push(_request);
    return {
      posted: true as const,
    };
  }
}
