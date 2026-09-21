import { LIMA } from "../constants";
import { CAR_3D_SCRIPT } from "./scripts/car-3d";
import { buildMapEngineScript } from "./scripts/map-engine";

const KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "AIzaSyCj1xJNYLv2E45yrRRNPAi-BBTfp_L01z0";

export function getGoogleMapsKey() {
  return KEY;
}

const MAP_STYLES = `
  html, body, #map { height: 100%; margin: 0; background: #083D30; }
`;

/**
 * HTML del mapa en vivo.
 * Furgoneta sólida + badge de nombre + rutas (inicio/destino) + mi ubicación admin.
 */
export function buildGoogleMapHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>${MAP_STYLES}</style>
</head>
<body>
  <div id="map"></div>
  <script>
    ${CAR_3D_SCRIPT}
    ${buildMapEngineScript(LIMA.lat, LIMA.lng)}
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=geometry&v=weekly&callback=initBioclimMap" async></script>
</body>
</html>`;
}

export function mapUpdateScript(payload: unknown) {
  return `window.updateLiveMap && window.updateLiveMap(${JSON.stringify(payload)}); true;`;
}
