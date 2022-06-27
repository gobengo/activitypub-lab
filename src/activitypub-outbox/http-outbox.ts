import { RequestListener } from "http";
import Koa from "koa";
import { Parser, Route, URL, route, router, Response } from "typera-koa";
import * as t from "io-ts";
import bodyParser from "koa-bodyparser";
import {
  OutboxPost,
  OutboxPostHandler,
  OutboxRepository,
  OutboxItem,
  OutboxGetHandler,
  OutboxGet,
  OutboxOptions,
} from "./outbox.js";
import { ArrayRepository } from "../activitypub/repository-array.js";
import type { AnnounceActivityPubCom } from "../activitypub/announcement";
import { Identifier } from "../activity/activity.js";

const defaultOutboxRepository: OutboxRepository =
  new ArrayRepository<OutboxItem>();

const outboxGetRoute = (
  options: OutboxOptions
): Route<
  Response.Response<
    OutboxGet["Response"]["status"],
    OutboxGet["Response"],
    undefined
  >
> =>
  route
    .get("/") // Capture id from the path
    .handler(async (request) => {
      const { authorizer, repository } = options;
      const authorization = request.ctx.get("authorization");
      const response = await new OutboxGetHandler(
        repository,
        authorizer
      ).handle({
        authorization,
        ...request,
      });
      return {
        status: response.status,
        body: response,
        headers: undefined,
      };
    });

export const announceActivityPubActivityType = t.type({
  "@context": t.literal("https://www.w3.org/ns/activitystreams"),
  id: t.string,
  type: t.literal("Announce"),
  actor: t.literal("activitypub.com"),
});

const outboxPostRoute: Route<
  | Response.BadRequest<string, undefined>
  | Response.Created<OutboxPost["Response"], { location: string }>
> = route
  .post("/") // Capture id from the path
  .use(Parser.body(announceActivityPubActivityType))
  .handler(async (request) => {
    const handler = new OutboxPostHandler(defaultOutboxRepository);
    const reqBody: AnnounceActivityPubCom = {
      ...request.body,
      /**
       * @todo - remove type assertion by modifying announceActivityPubActivityType.id
       * to be mroe specific than t.string
       */
      id: request.body.id as Identifier,
    };
    const response = await handler.handle(reqBody);
    const location = `?id=${reqBody.id}`;
    return Response.created(response, { location });
  });

export interface UrlResolver {
  (baseUrl: URL): URL;
}

export interface OutboxListener extends RequestListener {
  totalItems: number;
  urls: {
    index: UrlResolver;
  };
}

function OutboxKoa(options: OutboxOptions): Koa {
  const app = new Koa();
  app.use(bodyParser());
  app.use(router(outboxGetRoute(options), outboxPostRoute).handler());
  return app;
}

class OutboxListenerOptionsDefaults {
  constructor(
    public authorizer = () => false,
    public repository = defaultOutboxRepository
  ) {}
}

export function OutboxListener(
  options: Partial<OutboxOptions> = {}
): OutboxListener {
  const koa = OutboxKoa({
    ...new OutboxListenerOptionsDefaults(),
    ...options,
  });
  const listener: RequestListener = koa.callback();
  const properties: Omit<OutboxListener, "()"> = {
    totalItems: 0,
    urls: {
      index: (u: URL) => u,
    },
  };
  return Object.assign(listener, properties);
}
