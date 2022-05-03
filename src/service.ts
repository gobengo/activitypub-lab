import type { Invocation, Link, Result } from "ucanto/src/client";
import type { StorageBackend } from './storage.js';
import { NotFoundError, InvalidInputError, InMemoryStorage } from "./storage.js";

export type Publish = {
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

const publish = (storage: StorageBackend) => { 
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
      throw err;
    }
  }
};

const resolve = (storage: StorageBackend) => {
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
          throw err;
        }
    };
};

// heirarchical mapping of (cap)abilities with corresponding handlers
// 'intro/echo' -> .intro.echo
// 'math/sqrt' -> .math.sqrt
export const service = NewService();

export function NewService(storage: StorageBackend = InMemoryStorage()) {
  return {
    name: { 
      publish: publish(storage), 
      resolve: resolve(storage),
    },
  }
}

export class PermissionError extends Error {
  public name = "PermissionError";
}
