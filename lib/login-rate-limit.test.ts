import assert from "node:assert/strict";
import test from "node:test";
import { clearLoginFailures, loginRetryAfter, recordLoginFailure } from "./login-rate-limit.ts";

test("login is blocked after five failures and resets after 15 minutes", () => {
  const key = "test-user|127.0.0.1";
  clearLoginFailures(key);
  for (let attempt = 0; attempt < 5; attempt++) recordLoginFailure(key, 1_000);
  assert.equal(loginRetryAfter(key, 1_000), 900);
  assert.equal(loginRetryAfter(key, 901_000), 0);
});
