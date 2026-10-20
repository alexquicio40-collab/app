/**
 * Cámara de navegación estilo Google Maps.
 *
 * Al iniciar ruta el mapa queda heading-up, con tilt ~50–60°,
 * el punto de cámara unos metros por delante del vehículo y el
 * auto en el tercio inferior (se ve la calle que viene).
 *
 * La lógica vive en el WebView (teselas Google + shim). Estas
 * curvas se inyectan como JS para no duplicar números mágicos.
 */

export const NAV_TILT_CITY = 50;
export const NAV_TILT_ROAD = 54;
export const NAV_TILT_HIGHWAY = 60;

export const NAV_ZOOM_STOP = 18;
export const NAV_ZOOM_CITY = 17;
export const NAV_ZOOM_ROAD = 16;

/** Metros por delante del auto a 0 km/h (el auto queda abajo). */
export const NAV_LOOKAHEAD_MIN_M = 38;
/** Tope de look-ahead en carretera. */
export const NAV_LOOKAHEAD_MAX_M = 140;

export const NAV_CAMERA_JS = `
function navKmh(mps) {
  return Math.max(0, Number(mps) || 0) * 3.6;
}

function navZoomForSpeed(mps) {
  var kmh = navKmh(mps);
  if (kmh < 12) return 18;
  if (kmh < 40) return 17;
  return 16;
}

function navTiltForSpeed(mps) {
  var kmh = navKmh(mps);
  if (kmh >= 80) return 60;
  if (kmh >= 40) return 54;
  return 50;
}

function navLookAheadMeters(mps) {
  var kmh = navKmh(mps);
  var meters = 38 + kmh * 1.2;
  return meters > 140 ? 140 : meters;
}

function navOffsetAlongHeading(pos, headingDeg, meters) {
  var rad = (Number(headingDeg) || 0) * Math.PI / 180;
  var dLat = (meters * Math.cos(rad)) / 111320;
  var cos = Math.cos(pos.lat * Math.PI / 180);
  var dLng = (meters * Math.sin(rad)) / (111320 * (cos || 1e-6));
  return { lat: pos.lat + dLat, lng: pos.lng + dLng };
}

function navAimPoint(pos, headingDeg, mps) {
  return navOffsetAlongHeading(pos, headingDeg, navLookAheadMeters(mps));
}

function applyNavCamera(map, pos, headingDeg, speedMps, opts) {
  opts = opts || {};
  if (!map || !pos) return null;
  var aim = navAimPoint(pos, headingDeg, speedMps);
  var zoom = navZoomForSpeed(speedMps);
  var tiltOn = opts.tilt !== false;
  if (map.setTilt) map.setTilt(tiltOn ? navTiltForSpeed(speedMps) : 0);
  if (opts.snap) {
    map.setCenter(aim);
    if (Math.abs((map.getZoom() || 0) - zoom) >= 0.35) map.setZoom(zoom);
  } else {
    map.panTo(aim);
    if (opts.zoom && Math.abs((map.getZoom() || 0) - zoom) >= 0.9) map.setZoom(zoom);
  }
  return aim;
}

function clearNavCamera(map) {
  if (map && map.setTilt) map.setTilt(0);
}
`;
