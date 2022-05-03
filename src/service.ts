import type { Invocation, Link, Result } from "ucanto/src/client";
import type { StorageBackend } from './storage.js';
import { NotFoundError, InvalidInputError, InMemoryStorage } from "./storage.js";

type Echo = {
  can: "intro/echo";
  with: `${string}:${string}`;
};

type Sqrt = {
  can: "intro/echo";
  with: `${string}:${string}`;
  n: number;
};

type Publish = {
  can: "name/publish";
  with: `${string}:${string}`;
  content: Link<any>;
  origin?: Link<Publish>;
};

type PublishResponse = {
  published: boolean;
};

type Resolve = {
  can: "name/resolve";
  with: `${string}:${string}`;
};

export const echo = async ({
  capability,
}: Invocation<Echo>): Promise<Result<string, InvalidInputError>> => {
  const result = !capability.with.startsWith("data:")
    ? new InvalidInputError(
        `Capability "intro/echo" expects with to be a data URL, instead got ${capability.with}`
      )
    : !capability.with.startsWith("data:text/plain,")
    ? new InvalidInputError(
        `Capability "intro/echo" currently only support data URLs in text/plain encoding`
      )
    : {
        ok: true as const,
        value: capability.with.slice("data:text/plain,".length),
      };
  return result;
};

export const sqrt = async ({
  capability,
}: Invocation<Sqrt>): Promise<Result<number, InvalidInputError>> => {
  const result =
    capability.n < 0
      ? new InvalidInputError(
          `Capability "math/sqrt" only operates on positive numbers, instead got ${capability.can}`
        )
      : { ok: true as const, value: Math.sqrt(capability.n) };
  return result;
};

// @todo: don't use module scope for state
const storage: StorageBackend = InMemoryStorage()

export const publish = (storage: StorageBackend) => { 
  return async (
    invocation: Invocation<Publish>
  ): Promise<Result<PublishResponse, PermissionError|InvalidInputError>> => {
    const { issuer, capability } = invocation;
    if (issuer.did().toString() !== capability.with) {
      return new PermissionError();
    }
    const name = capability.with;
    const referent = capability.content;
    // @todo should it keep track of { origin } ?
    try {
      const published = await storage.publish(name, referent, capability.origin);
      return { ok: true, value: { published } };
    } catch (err) {
      if (err instanceof PermissionError
        || err instanceof InvalidInputError) {
          return err
      }
      // TODO: make a catch-all error type
      throw new Error(`unexpected error: ${err}`)
    }
  }
};

export const resolve = (storage: StorageBackend) => {
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
          // TODO: make a catch-all error type
          throw new Error(`unexpected error: ${err}`)
        }
    };
};

// heirarchical mapping of (cap)abilities with corresponding handlers
// 'intro/echo' -> .intro.echo
// 'math/sqrt' -> .math.sqrt
export const service = {
  name: { 
    publish: publish(storage), 
    resolve: resolve(storage) 
  },
};

// export const NewService(storage: StorageBackend = InMemoryStorage()) {

// }

export class PermissionError extends Error {
  public name = "PermissionError";
}

