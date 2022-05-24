import { AnnounceActivityPubCom } from "./announcement";
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

export type OutboxItem = InboxItem;

export interface Handler<Request, Response> {
  handle(request: Request): Promise<Response>;
}

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
