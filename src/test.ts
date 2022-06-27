import { Console } from "console";
import { Writable } from "stream";

export { describe, it, test } from "mocha";

/**
 * Create a Console that logs nothing
 * unless env.DEBUG
 */
export const createTestConsole = (
  shouldLog = () => Boolean(process.env.DEBUG),
  loggingConsole = console,
  silentConsole = new Console(new Writable())
): Console => {
  if (shouldLog()) {
    loggingConsole;
  }
  return silentConsole;
};
