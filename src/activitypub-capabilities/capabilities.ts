import * as t from "io-ts";
import {
  MemoryOutboxRepository,
  OutboxGetHandler,
  OutboxItem,
  OutboxPostHandler,
  OutboxRepository,
} from "../activitypub-outbox/outbox.js";
import { ArrayRepository } from "../activitypub/repository-array.js";
import { hasOwnProperty } from "../object.js";
import decodeWith from "./decodeWith.js";
import Ajv, { JSONSchemaType } from "ajv";
import { v4 as uuidv4 } from "uuid";
import Ajv2020 from "ajv/dist/core.js";
import { string } from "fp-ts";
import * as assert from "assert";
import { DebugLoggerFunction } from "util";
import { ConsoleLog, DefaultLogger, JSONLogger } from "../log.js";
import { ServiceMethodHandler } from "../activitypub/handler.js";

const ajv = new Ajv();

/** expectation */

const ExpectationCodec = t.partial({});

interface ExpectationChecker {
  (expectation: unknown, actual: unknown): Promise<void>;
}

const SimpleExpectationChecker = (
  _logger: DebugLoggerFunction
): ExpectationChecker => {
  return async (expectation, actual) => {
    if (
      expectation &&
      typeof expectation === "object" &&
      "$schema" in expectation
    ) {
      const expectationAjvSchema = {
        ...expectation,
        $schema: undefined,
      };
      const validate = ajv.compile(
        expectationAjvSchema as unknown as JSONSchemaType<unknown>
      );
      if (validate(actual)) {
        // _logger('debug', {
        //   verb: 'expectationCheckSucceed',
        //   actual,
        // })
      } else {
        const errors = validate.errors;
        throw Object.assign(new Error(`expectation not met: ${errors}`), {
          errors,
        });
      }
    }
    return;
  };
};

/** announce */

const AnnounceActivityPubComCodec = t.type({
  "@context": t.literal("https://www.w3.org/ns/activitystreams"),
  type: t.literal("Announce"),
  id: t.string,
  actor: t.literal("activitypub.com"),
});

/** Post */

const OutboxPostCodec = t.type({
  verb: t.literal("post"),
  target: t.literal("outbox"),
  object: AnnounceActivityPubComCodec,
});
type OutboxPost = t.TypeOf<typeof OutboxPostCodec>;

/** Outbox */

const OutboxNameCodec = t.literal("outbox");
type OutboxName = t.TypeOf<typeof OutboxNameCodec>;

/** OutboxGet Capability */

const GetCapabilityNameCodec = t.literal("outbox/capabilities/get");
type GetCapabilityName = t.TypeOf<typeof GetCapabilityNameCodec>;

/** OutboxPost Capability */

const PostOutboxCapabilityNameCodec = t.literal("outbox/capabilities/post");
type PostOutboxCapabilityName = t.TypeOf<typeof PostOutboxCapabilityNameCodec>;

/** Get activity */

const GetCodecType = t.type({
  verb: t.literal("get"),
  object: t.union([
    OutboxNameCodec,
    GetCapabilityNameCodec,
    PostOutboxCapabilityNameCodec,
  ]),
});

const GetCodecPartial = t.partial({
  expectation: ExpectationCodec,
  result: t.type({
    name: t.string,
  }),
});

const GetCodec = t.intersection([GetCodecType, GetCodecPartial]);

type GetType = t.TypeOf<typeof GetCodec>;

/** getter */

interface Getter {
  get(getActivity: GetType): Promise<unknown>;
}

class OutboxGetter implements Getter {
  constructor(
    private logger: DebugLoggerFunction,
    private kv: Map<string, unknown>,
    private outboxGet: OutboxGetHandler
  ) {}
  async get(_request: GetType) {
    const request = ensureId(_request);
    const { verb, object } = request;
    let response = null;
    switch (object) {
      case "outbox":
        response = await this.outboxGet.handle(request);
        break;
      case "outbox/capabilities/get":
        response = {
          content: "invoke this capability to get the outbox",
        };
        break;
      case "outbox/capabilities/post":
        response = {
          content: "invoke this capability to post messages to the outbox",
        };
        break;
      default:
        const x: never = object;
        throw new Error(`unexpected get object ${object}`);
    }

    const finalResponse = ensureId(response);
    // this.logger(
    //   "debug",
    //   ensureId({
    //     verb: "respond",
    //     content: finalResponse,
    //     inReplyTo: request.id,
    //   })
    // );
    return finalResponse;
  }
}

/** finish */

const FinishCodec = t.type({
  verb: t.literal("finish"),
});

type Finish = t.TypeOf<typeof FinishCodec>;

interface Finisher {
  (activity: Finish): void;
}

const DefaultFinish = (): Finisher => (_finish) => {
  // console.debug(JSON.stringify(finish));
};

/** OutboxPost */

interface OutboxPoster {
  (post: OutboxPost): Promise<{
    posted: true;
    status: 201;
  }>;
}

function DefaultOutboxPoster(outbox: OutboxRepository): OutboxPoster {
  return async (post) => {
    const response = await new OutboxPostHandler(outbox).handle(post.object);
    return response;
  };
}

/** actor */

interface Actor<Action> {
  act(activity: Action): Promise<void>;
}

class DefaultActorConfig {
  constructor(
    private logger = DefaultLogger(),
    private kv: Map<string, unknown>,
    private outboxRepo: OutboxRepository,
    public getter: Getter = new OutboxGetter(
      logger,
      kv,
      new OutboxGetHandler(outboxRepo)
    ),
    public finish: Finisher = DefaultFinish(),
    public log: DebugLoggerFunction = DefaultLogger(),
    public outboxPost: OutboxPoster = DefaultOutboxPoster(outboxRepo),
    public checkExpectation: ExpectationChecker = SimpleExpectationChecker(
      logger
    )
  ) {}
}

export const actor = (
  _logger = JSONLogger(ConsoleLog()),
  kv = new Map<string, unknown>(),
  outbox = MemoryOutboxRepository(),
  config = new DefaultActorConfig(_logger, kv, outbox)
): Actor<unknown> => {
  return {
    async act(_activity) {
      const activity = ensureId(_activity as Record<string, unknown>);
      let response: unknown = null;

      // console.debug(
      //   JSON.stringify(
      //     ensureId({
      //       verb: "act",
      //       object: activity,
      //     })
      //   )
      // );
      if (
        activity &&
        typeof activity === "object" &&
        hasOwnProperty(activity, "verb")
      ) {
        switch (activity.verb) {
          case "get":
            const get = decodeWith(GetCodec)(activity);
            const getResponse = await config.getter.get(get);
            response = getResponse;
            break;
          case "finish":
            const finish = decodeWith(FinishCodec)(activity);
            response = config.finish(finish);
            break;
          case "log":
            const log = ensureId(decodeWith(LogCodec())(activity));
            const objectName = log.object.name;
            response = ensureId({
              verb: "log",
              name: objectName,
              value: kv.get(objectName),
              inReplyTo: log.id,
            });
            config.log("info", response);
            break;
          case "post":
            const post = decodeWith(OutboxPostCodec)(activity);
            response = await config.outboxPost(post);
            break;
          default:
            throw new Error(`unexpected activity verb ${activity.verb}`);
        }
      } else {
        throw new Error("activity with no .verb");
      }
      /**
       * If request.expectation is set, it may be a schema to validate the response with
       */
      const expectation = hasOwnProperty(activity, "expectation")
        ? activity.expectation
        : undefined;
      if (expectation) {
        const actual = response;
        // config.log("debug", { verb: "checkingExpectation", activity, expectation, actual: response || null })
        if (typeof actual === "undefined") {
          throw new Error("expectation but no actual");
        }
        try {
          await config.checkExpectation(expectation, response);
        } catch (error) {
          config.log("warn", {
            verb: "expectationFail",
            error,
          });
          throw error;
        }
      }
      /**
       * If the request.result.name is set, it indicates that the result of the request (ie the response) should be saved in kv as key=request.result.name
       */
      if (hasOwnProperty(activity, "result") && activity.result && response) {
        const WithResultCodec = t.type({
          result: t.type({
            name: t.string,
          }),
        });
        const requestWithResult = decodeWith(WithResultCodec)(activity);
        const kvName = requestWithResult.result.name;
        assert.ok(kvName);
        // config.log("debug", { verb: "kv/set", name: kvName, value: response });
        kv.set(kvName, response);
      }
    },
  };
};

function ensureId<T extends Record<string, unknown>>(
  activity: T
): T & { id: unknown } {
  activity = {
    ...activity,
    id:
      activity && hasOwnProperty(activity, "id")
        ? activity.id
        : `urn:uuid:${uuidv4()}`,
  };
  assert.ok(activity);
  assert.ok(typeof activity === "object");
  assert.ok(hasOwnProperty(activity, "id"));
  assert.ok(activity.id);
  assert.ok(typeof activity.id === "string");
  return activity;
}

/* log */

function LogCodec() {
  return t.type({
    verb: t.literal("log"),
    object: t.type({
      name: t.string,
    }),
  });
}
