import assert from "node:assert/strict";
import test from "node:test";
import { canReviewAttendance, roleHome } from "./roles.ts";

test("HR has a dedicated landing page and only reviewers get verification navigation", () => {
  assert.equal(roleHome("HR"), "/hr");
  assert.equal(roleHome("ADMIN"), "/admin");
  assert.equal(roleHome("EMPLOYEE"), "/employee");
  assert.equal(canReviewAttendance("ADMIN"), true);
  assert.equal(canReviewAttendance("HR"), true);
  assert.equal(canReviewAttendance("EMPLOYEE"), false);
  assert.equal(canReviewAttendance("ARCHIVED_EMPLOYEE"), false);
});
