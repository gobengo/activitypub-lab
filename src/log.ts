import assert from "assert";
import { DebugLoggerFunction } from "util";

export type LogFunction = DebugLoggerFunction;

export const ConsoleLog = () => {
  return (level: string, ...loggables: unknown[]) => {
    switch (level) {
      case "debug":
        console.debug(...loggables);
        break;
      case "info":
        console.info(...loggables);
        break;
      case "warn":
        console.warn(...loggables);
        break;
      default:
        throw new Error(`unexpected log level ${level}`);
    }
  };
};

export const JSONLogger = (log: DebugLoggerFunction): DebugLoggerFunction => {
  return (level: string, ...loggables: unknown[]) => {
    const stringifiedLoggables = loggables.map((o) => JSON.stringify(o));
    return log(level, ...stringifiedLoggables);
  };
};

export const recordedLog = <LogLevel extends string>() => {
  const info: unknown[] = [];
  const log = (level: LogLevel, ...loggables: unknown[]) => {
    if (level === "info") {
      info.push(loggables);
    }
  };
  return { log, info };
};

export function DefaultLogger(): DebugLoggerFunction {
  const log: DebugLoggerFunction = (level, ...loggables) => {
    switch (level) {
      case "debug":
      case "warn":
      case "info":
        const consoleLog = JSONLogger(ConsoleLog());
        return consoleLog(level, ...loggables);
      default:
        throw new Error("unexpected log level: " + level);
    }
  };
  return log;
}
