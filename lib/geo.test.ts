import assert from "node:assert/strict";
import test from "node:test";
import { distanceMeters, nearestAllowedLocation } from "./geo.ts";

test("geofence accepts the nearest point only inside 50 meters", () => {
  const origin = { latitude: 1.4748, longitude: 124.8421 };
  assert.equal(Math.round(distanceMeters(origin, origin)), 0);
  assert.equal(
    nearestAllowedLocation(origin, [
      { id: "hq", name: "Kantor", ...origin, radiusM: 50 },
      { id: "far", name: "Jauh", latitude: 1.48, longitude: 124.85, radiusM: 50 },
    ])?.location.id,
    "hq",
  );
  assert.equal(
    nearestAllowedLocation({ latitude: 1.48, longitude: 124.85 }, [
      { id: "hq", name: "Kantor", ...origin, radiusM: 50 },
    ]),
    null,
  );
});
