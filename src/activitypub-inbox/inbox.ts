import { Activity } from "../activity/activity.js";
import { KnownActivitypubActivity } from "../activitypub/activitypub.js";
import { AnnounceActivityPubCom } from "../activitypub.com/announcement.js";
import { ServiceMethodHandler } from "../activitypub/handler.js";
import { ArrayRepository } from "../activitypub/repository-array.js";

/** type of Activity accepted by Inbox */
export type InboxPostableActivity = AnnounceActivityPubCom | Activity;

/** request to GET inbox */
export type InboxGetRequest = unknown;

/** response from GET inbox */
export type InboxGetResponse = {
  /** total number of items in Inbox */
  totalItems: number;
  items: Activity[];
};

export type InboxPostRequest = InboxPostableActivity;

/** response from POST inbox */
export type InboxPostResponse = {
  /** indication that the post was posted */
  posted: true;
};

/** type that inbox contains */
export type InboxItem = InboxPostableActivity;

export type InboxPostFunction = (
  request: InboxPostRequest
) => Promise<InboxPostResponse>;

export type InboxPost = {
  Request: InboxPostRequest;
  Response: InboxPostResponse;
};

/** data repository for storing inbox items */
export type InboxRepository = ArrayRepository<InboxPostableActivity>;

/**
 * ActivityPub handler for POST inbox.
 * This is invoked when one server delivers an activity to another server
 */
export class InboxPostHandler implements ServiceMethodHandler<InboxPost> {
  constructor(private repository: InboxRepository, private console: Console) {}
  async handle(_request: InboxPost["Request"]) {
    this.console.log("inboxPost handling", _request);
    await this.repository.push(_request);
    return {
      posted: true as const,
      status: 201 as const,
    };
  }
}

export type InboxGet = {
  Request: InboxGetRequest;
  Response: InboxGetResponse;
};

export class InboxGetHandler implements ServiceMethodHandler<InboxGet> {
  constructor(private repository: InboxRepository, private console: Console) {}
  async handle(_request: InboxGet["Request"]) {
    this.console.log("inbox.get", _request);
    return {
      ...(await this.repository.read()),
      totalItems: await this.repository.count(),
    };
  }
}
