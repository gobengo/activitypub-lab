import { test } from "mocha";
import { universalFetch } from "../fetch.js";
import { withHttpServer } from "../http.js";
import * as assert from "assert";
import { OutboxListener } from "./http-outbox.js";
import { hasOwnProperty } from "../object.js";

// disabled until update providing authorziation
test("activitypub-outbox responds to / with 401 and NotAuthorizedError", async () => {
  const outboxListener = OutboxListener();
  await withHttpServer(outboxListener, async (baseUrl) => {
    const index = outboxListener.urls.index(baseUrl);
    const resp = await universalFetch(index.toString());
    const expectedStatus = 401;
    assert.equal(resp.status, expectedStatus);
    const outbox = await resp.json();
    assertProperty(outbox, "status", expectedStatus);
    assertProperty(outbox, "name", "NotAuthorizedError");
  });
});

test("activitypub-outbox responds to / + authz with 200 and has name", async () => {
  const authzRequirement = `Bearer ${Math.random().toString().slice(2)}`;
  const authorizer = (authz: unknown) => {
    return authz === authzRequirement;
  };
  const outboxListener = OutboxListener({ authorizer });
  await withHttpServer(outboxListener, async (baseUrl) => {
    const index = outboxListener.urls.index(baseUrl);
    const resp = await universalFetch(index.toString(), {
      headers: {
        authorization: authzRequirement,
      },
    });
    const expectedStatus = 200;
    assert.equal(resp.status, expectedStatus);
    const outbox = await resp.json();
    assertProperty(outbox, "status", expectedStatus);
    await assertOutboxIsNamed(outbox, "outbox");
  });
});

async function assertOutboxIsNamed(outbox: unknown, expectedName: string) {
  assert.ok(typeof outbox === "object");
  assert.ok(outbox);
  assert.ok(hasOwnProperty(outbox, "name"));
  assert.ok(outbox.name);
  assert.ok(String(outbox.name).toLowerCase().includes(expectedName));
}

function assertProperty<T>(input: unknown, prop: string, expectedValue: T) {
  assert.ok(typeof input === "object");
  assert.ok(input);
  assert.ok(hasOwnProperty(input, prop));
  assert.equal(input[prop], expectedValue);
}
