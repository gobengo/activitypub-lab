import type { Invocation, Result } from "ucanto/src/client";

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
  content: string;
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

export const publish = async (_invocation: Invocation<Publish>) => {
  return { ok: true as const, value: "" };
};

// heirarchical mapping of (cap)abilities with corresponding handlers
// 'intro/echo' -> .intro.echo
// 'math/sqrt' -> .math.sqrt
export const service = {
  intro: { echo },
  math: { sqrt },
  name: { publish },
};

export class InvalidInputError extends Error {
  constructor(public input: string) {
    super(`"intro/echo" capability expects \`with\``);
  }
}
