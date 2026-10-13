import { MAPS_RASTER_OPTION, leafletHead, leafletStart } from "@/features/map/lib/map-raster";
import { myLocationDotJs } from "@/features/map/lib/my-location-dot";
import { LIMA } from "@/features/map/constants";

export type LocalesMapPin = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  /** alta = rojo · media = amarillo · baja = verde */
  tone: "alta" | "media" | "baja";
  restringido?: boolean;
};

/**
 * HTML autónomo: pins de locales + selección + fitBounds.
 * Importante: no tocar `google.*` hasta que cargue el script de Maps.
 */
export function buildLocalesMapHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; background: #E7EEEB; }
    #boot {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      color: #5C6B67; font: 700 13px system-ui, sans-serif; z-index: 2; pointer-events: none;
    }
    #boot.hide { display: none; }
  </style>
  ${leafletHead()}
</head>
<body>
  <div id="boot">Cargando mapa…</div>
  <div id="map"></div>
  <script>
    var map = null;
    var markers = {};
    var selectedId = null;
    var info = null;
    var pendingPayload = null;
    var didFit = false;
    var fittedWithMe = false;
    var lastPinKey = '';
    ${myLocationDotJs()}
    var COLORS = {
      alta: { fill: '#E53935', stroke: '#FDECEC' },
      media: { fill: '#F9A825', stroke: '#FFF8E1' },
      baja: { fill: '#2E7D32', stroke: '#E8F5E9' }
    };

    function emit(payload) {
      try {
        var raw = JSON.stringify(payload);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(raw);
        } else if (window.parent && window.parent !== window) {
          window.parent.postMessage(payload, '*');
        }
      } catch (e) {}
    }

    function pinIcon(tone, active) {
      var c = COLORS[tone] || COLORS.media;
      var scale = active ? 1.2 : 1;
      var w = Math.round(32 * scale);
      var h = Math.round(40 * scale);
      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 36 45">' +
        '<path d="M18 1C9.7 1 3 7.7 3 16c0 10.5 15 27 15 27s15-16.5 15-27C33 7.7 26.3 1 18 1z" fill="'+c.fill+'" stroke="'+c.stroke+'" stroke-width="2.2"/>' +
        '<circle cx="18" cy="16" r="5.5" fill="#fff"/>' +
        '</svg>';
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(w, h),
        anchor: new google.maps.Point(w / 2, h)
      };
    }

    function fitAll(pins, me) {
      var points = pins.slice();
      if (me) points.push(me);
      if (!points.length) {
        map.setCenter({ lat: ${LIMA.lat}, lng: ${LIMA.lng} });
        map.setZoom(11);
        return;
      }
      if (points.length === 1) {
        map.setCenter({ lat: points[0].lat, lng: points[0].lng });
        map.setZoom(15);
        return;
      }
      var bounds = new google.maps.LatLngBounds();
      for (var i = 0; i < points.length; i++) {
        bounds.extend({ lat: points[i].lat, lng: points[i].lng });
      }
      map.fitBounds(bounds, 48);
    }

    function showInfo(pin) {
      if (!info) info = new google.maps.InfoWindow();
      info.setContent(
        '<div style="font:700 12px system-ui,sans-serif;color:#0B1F1A;max-width:180px">' +
        String(pin.nombre).replace(/</g,'&lt;') +
        (pin.restringido
          ? '<div style="margin-top:4px;display:inline-block;padding:2px 6px;border-radius:6px;background:#FDECEC;color:#B42318;font-size:10px">Local restringido</div>'
          : '') +
        '</div>'
      );
      info.open({ map: map, anchor: markers[pin.id] });
    }

    window.updateLocalesMap = function(payload) {
      if (!payload) return;
      if (!map) {
        pendingPayload = payload;
        return;
      }
      var pins = payload.pins || [];
      var nextId = payload.selectedId || null;
      var keep = {};

      for (var i = 0; i < pins.length; i++) {
        var pin = pins[i];
        keep[pin.id] = true;
        var active = nextId === pin.id;
        var existing = markers[pin.id];
        if (existing) {
          existing.setPosition({ lat: pin.lat, lng: pin.lng });
          existing.setIcon(pinIcon(pin.tone, active));
          existing.__pin = pin;
        } else {
          (function(p) {
            var marker = new google.maps.Marker({
              map: map,
              position: { lat: p.lat, lng: p.lng },
              icon: pinIcon(p.tone, nextId === p.id),
              title: p.nombre
            });
            marker.__pin = p;
            marker.addListener('click', function() {
              emit({ type: 'select', id: p.id });
            });
            markers[p.id] = marker;
          })(pin);
        }
      }

      Object.keys(markers).forEach(function(id) {
        if (!keep[id]) {
          markers[id].setMap(null);
          delete markers[id];
        }
      });

      var prev = selectedId;
      selectedId = nextId;
      var mePos = paintMyLocation(payload.me);
      var includeMe = false;
      if (mePos && !fittedWithMe) { fittedWithMe = true; includeMe = true; }
      var pinKey = pins.map(function (p) { return p.id; }).join('|');
      if (pinKey !== lastPinKey) { lastPinKey = pinKey; didFit = false; }

      if (selectedId && markers[selectedId]) {
        showInfo(markers[selectedId].__pin);
        map.panTo({ lat: markers[selectedId].__pin.lat, lng: markers[selectedId].__pin.lng });
        if (map.getZoom() < 14) map.setZoom(15);
      } else {
        if (info) info.close();
        if (!selectedId && (prev || !didFit || includeMe)) {
          didFit = true;
          fitAll(pins, mePos);
        }
      }
    };

    window.initLocalesMap = function() {
      var boot = document.getElementById('boot');
      if (boot) boot.className = 'hide';

      map = new google.maps.Map(document.getElementById('map'), {
        ${MAPS_RASTER_OPTION},
        center: { lat: ${LIMA.lat}, lng: ${LIMA.lng} },
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'greedy',
        clickableIcons: false,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] }
        ]
      });

      map.addListener('click', function() {
        selectedId = null;
        if (info) info.close();
        Object.keys(markers).forEach(function(key) {
          var m = markers[key];
          m.setIcon(pinIcon(m.__pin.tone, false));
        });
        emit({ type: 'select', id: null });
      });

      emit({ type: 'ready' });
      if (pendingPayload) {
        window.updateLocalesMap(pendingPayload);
        pendingPayload = null;
      }
    };

    window.gm_authFailure = function() {
      var boot = document.getElementById('boot');
      if (boot) {
        boot.className = '';
        boot.textContent = 'Error de API Key de Google Maps';
      }
      emit({ type: 'error', message: 'gm_authFailure' });
    };

    window.addEventListener('message', function(event) {
      var data = event.data;
      if (!data) return;
      // Padre (web) envía { __localesMap: true, payload }
      if (data.__localesMap && data.payload) {
        window.updateLocalesMap(data.payload);
        return;
      }
      // Payload directo { pins, selectedId }
      if (data.pins) window.updateLocalesMap(data);
    });
  </script>
  ${leafletStart("initLocalesMap")}
</body>
</html>`;
}

export function localesMapUpdateScript(payload: unknown) {
  return `window.updateLocalesMap && window.updateLocalesMap(${JSON.stringify(payload)}); true;`;
}
