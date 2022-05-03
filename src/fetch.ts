import polyfillFetch from "@web-std/fetch";

// in node <17.5.0, globalThis.fetch is not defined, so use polyfill
// https://nodejs.org/api/globals.html#fetch
export const universalFetch =
  typeof globalThis.fetch !== "undefined" ? globalThis.fetch : polyfillFetch;
