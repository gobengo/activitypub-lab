import { Link } from "ucanto/src/lib";

export class NotFoundError extends Error {
  public name = "NotFoundError";
}

type Publish = {
  can: "name/publish";
  with: `${string}:${string}`;
  content: Link<any>;
  origin?: Link<Publish>;
};

interface StorageBackend {
  publish(
    did: string,
    content: Link<any>,
    origin?: Link<Publish>
  ): Promise<boolean>;

  resolve(did: string): Promise<Publish>;
}

export function InMemoryStorage(
  m: Map<string, Publish> = new Map()
): StorageBackend {
  return {
    async publish(
      did: string,
      content: Link<any>,
      origin?: Link<Publish, 0 | 1, number, number>
    ): Promise<boolean> {
      m.set(did, {
        can: "name/publish",
        with: did as `${string}:${string}`,
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
