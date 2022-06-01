// decodeWith.ts

import * as T from "io-ts";
import * as E from "fp-ts/lib/Either.js";
import { failure } from "io-ts/lib/PathReporter.js";
import { pipe } from "fp-ts/lib/pipeable.js";

const decodeWith =
  <ApplicationType = unknown, EncodeTo = ApplicationType, DecodeFrom = unknown>(
    codec: T.Type<ApplicationType, EncodeTo, DecodeFrom>
  ) =>
  (input: DecodeFrom): ApplicationType =>
    pipe(
      codec.decode(input),
      E.getOrElseW((errors) => {
        throw new Error(failure(errors).join("\n"));
      })
    );

export default decodeWith;
