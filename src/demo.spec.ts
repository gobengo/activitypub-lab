import { describe, it } from "mocha";
import { simpleDemo } from "./demos.js";

it("can do simple demo", async () => {
  await simpleDemo();
});
