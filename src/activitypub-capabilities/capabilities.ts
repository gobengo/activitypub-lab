import * as t from "io-ts";
import {
  Authorizer,
  MemoryOutboxRepository,
  OutboxGetHandler,
  OutboxPostHandler,
  OutboxRepository,
} from "../activitypub-outbox/outbox.js";
import { hasOwnProperty } from "../object.js";
import decodeWith from "./decodeWith.js";
import Ajv, { JSONSchemaType } from "ajv";
import { v4 as uuidv4 } from "uuid";
import * as assert from "assert";
import { DebugLoggerFunction } from "util";
import { ConsoleLog, DefaultLogger, JSONLogger } from "../log.js";

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
        _logger("debug", {
          verb: "expectationCheckSucceed",
          actual,
        });
      } else {
        const error = Object.assign(
          new Error(`expectation not met: ${validate.errors}`),
          {
            errors: validate.errors,
          }
        );
        _logger("error", {
          type: "expectationNotMet",
          error,
          actual,
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

const OutboxGetCapabilityNameCodec = t.literal("outbox/capabilities/get");
type OutboxGetCapabilityName = t.TypeOf<typeof OutboxGetCapabilityNameCodec>;

const OutboxGetCapabilityRequestCodec = t.type({
  type: OutboxGetCapabilityNameCodec,
  invoker: t.string,
});
type OutboxGetCapabilityRequest = t.TypeOf<
  typeof OutboxGetCapabilityRequestCodec
>;

/** OutboxPost Capability */

const PostOutboxCapabilityNameCodec = t.literal("outbox/capabilities/post");
type PostOutboxCapabilityName = t.TypeOf<typeof PostOutboxCapabilityNameCodec>;

/** Get activity */

const GetCodecType = t.type({
  authorization: t.unknown,
  verb: t.literal("get"),
  object: t.union([
    OutboxNameCodec,
    OutboxGetCapabilityRequestCodec,
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
    const objectType = typeof object === "string" ? object : object.type;
    switch (objectType) {
      case "outbox":
        response = await this.outboxGet.handle(request);
        break;
      case "outbox/capabilities/get":
        assert.ok(typeof object === "object");
        assert.ok(object.type === "outbox/capabilities/get");
        response = {
          type: objectType,
          content: "invoke this capability to get the outbox",
          invoker: object.invoker,
        };
        break;
      case "outbox/capabilities/post":
        response = {
          content: "invoke this capability to post messages to the outbox",
        };
        break;
      default:
        const x: never = objectType;
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
    /** @todo use a better authorizer than deny-all */
    public authorizer: Authorizer = () => true,
    public getter: Getter = new OutboxGetter(
      logger,
      kv,
      new OutboxGetHandler(outboxRepo, authorizer)
    ),
    public finish: Finisher = DefaultFinish(),
    public log: DebugLoggerFunction = DefaultLogger(),
    public outboxPost: OutboxPoster = DefaultOutboxPoster(outboxRepo),
    public checkExpectation: ExpectationChecker = SimpleExpectationChecker(
      logger
    )
  ) {}
}

/**
 * Create a function that will rewrite a property of an input value to be a value read from a kv store
 * @param kv - kv store
 * @param propName - property of input object to rewrite
 * @returns - function that will rewrite a property of an input object
 */
function rewriterAuthorizationFromKv(kv: Map<string, string|object>) {
  return <T extends { authorization: object }>(object: T): T => {
    const initialValue = object["authorization"];
    if ( ! initialValue) { return object }
    if ( typeof initialValue !== 'object') { return object }
    if (hasOwnProperty(initialValue, 'type') && initialValue.type === "RequireKvRewrite") {
      assert.ok(hasOwnProperty(initialValue, 'name'))
      assert.ok(typeof initialValue.name === "string")
      const updatedObject = {
        ...object,
        authorization: kv.get(initialValue.name)
      }
      return updatedObject;
    }
    return object
  }
}

export const actor = (
  _logger = JSONLogger(ConsoleLog()),
  kv = new Map<string, string | object>(),
  outbox = MemoryOutboxRepository(),
  config = new DefaultActorConfig(_logger, kv, outbox)
): Actor<unknown> => {
  return {
    async act(_activity) {
      let request = _activity;
      const requestWithId = ensureId(request as Record<string, unknown>);
      if ((hasOwnProperty(requestWithId, 'authorization') && (typeof requestWithId.authorization === 'object') && requestWithId.authorization)) {
        const authorization = requestWithId.authorization;
        const requestWithRewrittenAuthorization = rewriterAuthorizationFromKv(kv)({
          ...requestWithId,
          authorization,
        });
        request = requestWithRewrittenAuthorization;
      }
      config.log("debug", {
        type: "request",
        request,
      });
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
        request &&
        typeof request === "object" &&
        hasOwnProperty(request, "verb")
      ) {
        switch (request.verb) {
          case "get":
            const get = decodeWith(GetCodec)(request);
            const getResponse = await config.getter.get(get);
            response = getResponse;
            break;
          case "finish":
            const finish = decodeWith(FinishCodec)(request);
            response = config.finish(finish);
            break;
          case "log":
            const log = ensureId(decodeWith(LogCodec())(request));
            const objectName = log.object.name;
            const value = kv.get(objectName);
            assert.ok(value, `expect kv to have object ${objectName}`);
            response = ensureId({
              verb: "log/response",
              context: request,
              name: objectName,
              value,
              inReplyTo: log.id,
            });
            config.log("info", response);
            break;
          case "post":
            const post = decodeWith(OutboxPostCodec)(request);
            response = await config.outboxPost(post);
            break;
          default:
            throw new Error(`unexpected activity verb ${request.verb}`);
        }
      } else {
        throw new Error("activity with no .verb");
      }
      /**
       * If the request.result.name is set, it indicates that the result of the request (ie the response) should be saved in kv as key=request.result.name
       */
      if (hasOwnProperty(request, "result") && request.result && response) {
        const WithResultCodec = t.type({
          result: t.type({
            name: t.string,
          }),
        });
        const requestWithResult = decodeWith(WithResultCodec)(request);
        const kvName = requestWithResult.result.name;
        assert.ok(kvName);
        assert.ok(typeof response === "object");
        config.log("debug", { verb: "kv/set", name: kvName, value: response });
        kv.set(kvName, response);
      }


      /**
       * If request.expectation is set, it may be a schema to validate the response with
       */
      const expectation = hasOwnProperty(request, "expectation")
        ? request.expectation
        : undefined;
      if (expectation) {
        const actual = response;
        if (typeof actual === "undefined") {
          config.log("debug", {
            verb: "checkedExpectation",
            activity: request,
            expectation,
            actual: response,
          });
          throw new Error("expectation but no actual");
        }
        try {
          await config.checkExpectation(expectation, response);
        } catch (error) {
          console.log("warn", {
            verb: "FAIL",
            error,
            activity: request,
            expectation,
            actual,
          });
          throw error;
        }
      }

      if (response) {
        config.log("debug", {
          type: "response",
          response,
        });
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
