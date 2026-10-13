import { LIMA } from "../constants";
import { leafletHead, leafletStart } from "./map-raster";
import { CAR_3D_SCRIPT } from "./scripts/car-3d";
import { buildMapEngineScript } from "./scripts/map-engine";

const KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "AIzaSyCj1xJNYLv2E45yrRRNPAi-BBTfp_L01z0";

export function getGoogleMapsKey() {
  return KEY;
}

const MAP_STYLES = `
  html, body, #map { height: 100%; margin: 0; background: #083D30; }
  #compassRose {
    position: absolute; top: 12px; right: 12px; z-index: 4;
    width: 44px; height: 44px; pointer-events: none;
    display: none; align-items: center; justify-content: center;
  }
  #compassRose.on { display: flex; }
  #compassRose svg { width: 44px; height: 44px; filter: drop-shadow(0 2px 4px rgba(0,0,0,.35)); }
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
  ${leafletHead()}
</head>
<body>
  <div id="map"></div>
  <div id="compassRose" aria-hidden="true">
    <svg viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="20" fill="#FFFFFF" stroke="#0B5340" stroke-width="2"/>
      <path id="compassNeedle" d="M22 6 L26 24 L22 21 L18 24 Z" fill="#B42318"/>
      <text x="22" y="14" text-anchor="middle" font-size="8" font-weight="800" fill="#0B5340">N</text>
    </svg>
  </div>
  <script>
    ${CAR_3D_SCRIPT}
    ${buildMapEngineScript(LIMA.lat, LIMA.lng)}
  </script>
  ${leafletStart("initBioclimMap")}
</body>
</html>`;
}

export function mapUpdateScript(payload: unknown) {
  return `window.updateLiveMap && window.updateLiveMap(${JSON.stringify(payload)}); true;`;
}
