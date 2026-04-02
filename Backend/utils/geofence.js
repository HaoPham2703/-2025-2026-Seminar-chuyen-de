const OFFICE_LAT = process.env.OFFICE_LAT ? Number(process.env.OFFICE_LAT) : null;
const OFFICE_LNG = process.env.OFFICE_LNG ? Number(process.env.OFFICE_LNG) : null;
const OFFICE_RADIUS_METERS = process.env.OFFICE_RADIUS_METERS
  ? Number(process.env.OFFICE_RADIUS_METERS)
  : 100;

const toRadians = (value) => (value * Math.PI) / 180;

const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export function ensureWithinGeofence(location) {
  if (OFFICE_LAT === null || OFFICE_LNG === null) {
    return { ok: true, distanceMeters: null, radiusMeters: OFFICE_RADIUS_METERS };
  }

  if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    return {
      ok: false,
      message: 'Location is required for QR attendance',
      distanceMeters: null,
      radiusMeters: OFFICE_RADIUS_METERS,
    };
  }

  const distanceMeters = getDistanceMeters(
    OFFICE_LAT,
    OFFICE_LNG,
    location.latitude,
    location.longitude
  );

  if (distanceMeters > OFFICE_RADIUS_METERS) {
    return {
      ok: false,
      message: 'Outside allowed geofence',
      distanceMeters,
      radiusMeters: OFFICE_RADIUS_METERS,
    };
  }

  return { ok: true, distanceMeters, radiusMeters: OFFICE_RADIUS_METERS };
}
