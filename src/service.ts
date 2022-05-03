import type { Invocation, Link, Result } from "ucanto/src/client";

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
  published: boolean
}

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

export const publish = async (
  invocation: Invocation<Publish>
): Promise<Result<PublishResponse, PermissionError>> => {
  const { issuer, capability } = invocation;
  if (issuer.did().toString() !== capability.with) {
    return new PermissionError();
  }
  return { ok: true, value: { published: true } };
};

export const resolve = async (
  _invocation: Invocation<Resolve>
): Promise<Result<Publish, NotFoundError>> => {
  return new NotFoundError();
};

// heirarchical mapping of (cap)abilities with corresponding handlers
// 'intro/echo' -> .intro.echo
// 'math/sqrt' -> .math.sqrt
export const service = {
  intro: { echo },
  math: { sqrt },
  name: { publish, resolve },
};

export class InvalidInputError extends Error {
  constructor(public input: string) {
    super(`"intro/echo" capability expects \`with\``);
  }
}

export class PermissionError extends Error {
  public name = 'PermissionError';
}

export class NotFoundError extends Error {
  public name = "NotFoundError";
}