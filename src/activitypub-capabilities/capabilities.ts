import * as t from "io-ts";
import {
  MemoryOutboxRepository,
  OutboxGetHandler,
  OutboxItem,
  OutboxRepository,
} from "../activitypub-outbox/outbox.js";
import { ArrayRepository } from "../activitypub/repository-array.js";
import { hasOwnProperty } from "../object.js";
import decodeWith from "./decodeWith.js";
import Ajv, { JSONSchemaType } from "ajv";
import Ajv2020 from "ajv/dist/core.js";
const ajv = new Ajv();

/** expectation */

const ExpectationCodec = t.partial({});

interface ExpectationChecker {
  (expectation: unknown, actual: unknown): Promise<void>;
}

const SimpleExpectationChecker = (): ExpectationChecker => {
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
        // console.debug('expectation met', actual);
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

/** Outbox */

const OutboxNameCodec = t.literal("outbox");
type OutboxName = t.TypeOf<typeof OutboxNameCodec>;

/** Get Capability */

const GetCapabilityNameCodec = t.literal("outbox/capabilities/get");
type GetCapabilityName = t.TypeOf<typeof GetCapabilityNameCodec>;

/** Get activity */

const GetCodecType = t.type({
  verb: t.literal("get"),
  object: t.union([OutboxNameCodec, GetCapabilityNameCodec]),
});

const GetCodecPartial = t.partial({
  expectation: ExpectationCodec,
});

const GetCodec = t.intersection([GetCodecType, GetCodecPartial]);

type GetType = t.TypeOf<typeof GetCodec>;

/** getter */

interface Getter {
  get(getActivity: GetType): Promise<void>;
}

class OutboxGetter implements Getter {
  constructor(
    private outboxRepo: OutboxRepository,
    private checkExpectation: ExpectationChecker = SimpleExpectationChecker()
  ) {}
  async get(request: GetType) {
    const { verb, object } = request;
    console.debug(
      JSON.stringify({
        ...request,
        expectation: undefined,
      })
    );
    let response;
    switch (object) {
      case "outbox":
        const handler = new OutboxGetHandler(this.outboxRepo);
        response = await handler.handle(request);
        break;
      case "outbox/capabilities/get":
        response = {
          content: "invoke this capability to post a message to the outbox",
        };
        break;
      default:
        const x: never = object;
        throw new Error(`unexpected get object ${object}`);
    }
    console.debug(
      JSON.stringify({
        verb: "respond",
        content: response,
      })
    );
    const expectation = request.expectation;
    if (expectation && response) {
      await this.checkExpectation(expectation, response);
    }
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

const DefaultFinish = (): Finisher => (finish) => {
  console.debug(JSON.stringify(finish));
};

/** actor */

interface Actor<Action> {
  act(activity: Action): Promise<void>;
}

class DefaultActorConfig {
  constructor(
    private outboxRepo: OutboxRepository,
    public getter: Getter = new OutboxGetter(outboxRepo),
    public finish: Finisher = DefaultFinish()
  ) {}
}

export const actor = (
  outbox = MemoryOutboxRepository(),
  config = new DefaultActorConfig(outbox)
): Actor<unknown> => {
  const activities: OutboxRepository = new ArrayRepository<OutboxItem>();
  return {
    async act(activity) {
      if (
        activity &&
        typeof activity === "object" &&
        hasOwnProperty(activity, "verb")
      ) {
        switch (activity.verb) {
          case "get":
            const get = decodeWith(GetCodec)(activity);
            const object = await config.getter.get(get);
            break;
          case "finish":
            const finish = decodeWith(FinishCodec)(activity);
            await config.finish(finish);
            break;
          default:
            throw new Error(`unexpected activity verb ${activity.verb}`);
        }
      } else {
        throw new Error("activity with no .verb");
      }
    },
  };
};
