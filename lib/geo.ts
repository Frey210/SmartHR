export type Coordinates = { latitude: number; longitude: number };
export type AttendancePoint = Coordinates & { id: string; name: string; radiusM: number };

const EARTH_RADIUS_M = 6_371_000;

export function distanceMeters(a: Coordinates, b: Coordinates) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const deltaLat = radians(b.latitude - a.latitude);
  const deltaLng = radians(b.longitude - a.longitude);
  const value =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(value));
}

export function nearestAllowedLocation(point: Coordinates, locations: AttendancePoint[]) {
  return locations
    .map((location) => ({ location, distanceM: distanceMeters(point, location) }))
    .filter(({ location, distanceM }) => distanceM <= Math.min(location.radiusM, 50))
    .sort((a, b) => a.distanceM - b.distanceM)[0] ?? null;
}
