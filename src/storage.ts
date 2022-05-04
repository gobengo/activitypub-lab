import { Link } from "ucanto/src/lib";

export class NotFoundError extends Error {
  public name = "NotFoundError";
}

export class InvalidInputError extends Error {
  public name = "InvalidInputError";

  constructor(public input: string) {
    super(`invalid input: ${input}`);
  }
}

type DIDString = `${string}:${string}`;

// Type narrowing function for DID strings
function isDIDString(s: string): s is `${string}:${string}` {
  return s.match(/^did:.*/) != null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PublishContent = Link<any>;

export type Publish = {
  can: "name/publish";
  with: `${string}:${string}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: PublishContent;
  // @todo this should be undefined-able, but doing so led to dag-cbor encoding error
  origin: null | Link<Publish>;
};

export interface StorageBackend {
  publish(
    did: string,
    content: PublishContent,
    origin: Link<Publish> | null
  ): Promise<boolean>;

  resolve(did: string): Promise<Publish>;
}

export function InMemoryStorage(
  m: Map<string, Publish> = new Map()
): StorageBackend {
  return {
    async publish(
      did: string,
      content: PublishContent,
      origin: Link<Publish, 0 | 1, number, number> | null
    ): Promise<boolean> {
      if (!isDIDString(did)) {
        throw new InvalidInputError("invalid did string: " + did);
      }

      m.set(did, {
        can: "name/publish",
        with: did,
        content,
        origin,
      });
      return true;
    },

    async resolve(did: string): Promise<Publish> {
      const p = m.get(did);
      if (!p) {
        throw new NotFoundError();
      }
      return p;
    },
  };
}
