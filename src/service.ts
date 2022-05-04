import type { Invocation, Link, Result } from "ucanto/src/client";
import type { StorageBackend, Publish } from "./storage.js";
import type { Audience } from "./actor/api.js";
import { parse as parseAudience } from "./actor/audience.js";
import {
  NotFoundError,
  InvalidInputError,
  InMemoryStorage,
} from "./storage.js";
import { Client } from "ucanto/src/lib";

type PublishResponse = {
  published: boolean;
};

type Resolve = {
  can: "name/resolve";
  with: `${string}:${string}`;
};

const publish = ({ storage }: Context) => {
  return async (
    invocation: Invocation<Publish>
  ): Promise<Result<PublishResponse, PermissionError | InvalidInputError>> => {
    const { issuer, capability } = invocation;
    if (issuer.did().toString() !== capability.with) {
      return new PermissionError();
    }
    const name = capability.with;
    const referent = capability.content;
    // @todo should it keep track of { origin } ?
    try {
      const published = await storage.publish(
        name,
        referent,
        capability.origin || null
      );
      return { ok: true, value: { published } };
    } catch (err) {
      if (err instanceof PermissionError || err instanceof InvalidInputError) {
        return err;
      }
      throw err;
    }
  };
};

const resolve = ({ storage }: Context) => {
  return async (
    _invocation: Invocation<Resolve>
  ): Promise<Result<Publish, NotFoundError>> => {
    const name = _invocation.capability.with;
    try {
      const value = await storage.resolve(name);
      return { ok: true, value };
    } catch (err) {
      if (err instanceof NotFoundError) {
        return err;
      }

      throw new Error(`unknown error: ${String(err)}`);
    }
  };
};

export interface Context {
  storage: StorageBackend;
  audience: Audience;
}
export function NewService({
  storage = InMemoryStorage(),
  audience = parseAudience(
    "did:key:z6MknjRbVGkfWK1x5gyJZb6D4LjMj1EsitFzcSccS3sAaviQ"
  ),
}: Partial<Context> = {}) {
  const config = { storage, audience };
  return {
    did: () => audience.did(),
    name: {
      publish: publish(config),
      resolve: resolve(config),
    },
  };
}

export type IServiceAPI = ReturnType<typeof NewService>;

export type IClientConnection = Client.ConnectionView<IServiceAPI>;

export class PermissionError extends Error {
  public name = "PermissionError";
}
