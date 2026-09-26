import { getGoogleMapsKey } from "@/features/map/lib/google-map";
import { myLocationDotJs } from "@/features/map/lib/my-location-dot";
import { LIMA } from "@/features/map/constants";

/**
 * Mapa de rutas asignadas: pines numerados por color de operador + polilínea.
 */
export function buildRutasMapaHtml() {
  const key = getGoogleMapsKey();

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
</head>
<body>
  <div id="boot">Cargando mapa…</div>
  <div id="map"></div>
  <script>
    var map = null;
    var markers = {};
    var polyline = null;
    var selectedId = null;
    var pendingPayload = null;
    var lastFitKey = '';
    var fittedWithMe = false;
    ${myLocationDotJs()}

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

    function pinIcon(color, orden, active) {
      var scale = active ? 1.18 : 1;
      var w = Math.round(36 * scale);
      var h = Math.round(46 * scale);
      var label = String(orden > 0 ? orden : '');
      var fontSize = orden >= 100 ? 11 : (orden >= 10 ? 13 : 15);
      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 36 46">' +
        '<path d="M18 1.5C9.4 1.5 2.5 8.4 2.5 17c0 11 15.5 27.5 15.5 27.5S33.5 28 33.5 17C33.5 8.4 26.6 1.5 18 1.5z" fill="'+color+'" stroke="#fff" stroke-width="2.2"/>' +
        '<circle cx="18" cy="17" r="9.2" fill="'+color+'"/>' +
        '<text x="18" y="17" text-anchor="middle" dominant-baseline="central" fill="#fff" font-family="system-ui,sans-serif" font-weight="900" font-size="'+fontSize+'">'+label+'</text>' +
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
        map.setZoom(14);
        return;
      }
      var bounds = new google.maps.LatLngBounds();
      points.forEach(function (p) { bounds.extend({ lat: p.lat, lng: p.lng }); });
      map.fitBounds(bounds, 56);
    }

    function applyPayload(payload) {
      if (!map || !payload) return;
      var pins = payload.pins || [];
      selectedId = payload.selectedId || null;
      var keep = {};

      pins.forEach(function (pin) {
        keep[pin.id] = true;
        var active = selectedId === pin.id;
        var icon = pinIcon(pin.color || '#1976D2', pin.orden || 0, active);
        if (markers[pin.id]) {
          markers[pin.id].setPosition({ lat: pin.lat, lng: pin.lng });
          markers[pin.id].setIcon(icon);
          markers[pin.id].setZIndex(active ? 999 : (pin.orden || 1));
        } else {
          var m = new google.maps.Marker({
            map: map,
            position: { lat: pin.lat, lng: pin.lng },
            icon: icon,
            title: pin.label || '',
            zIndex: active ? 999 : (pin.orden || 1)
          });
          m.addListener('click', function () {
            emit({ type: 'select', id: pin.id });
          });
          markers[pin.id] = m;
        }
      });

      Object.keys(markers).forEach(function (id) {
        if (!keep[id]) {
          markers[id].setMap(null);
          delete markers[id];
        }
      });

      if (polyline) {
        polyline.setMap(null);
        polyline = null;
      }
      if (payload.path && payload.path.length > 1) {
        polyline = new google.maps.Polyline({
          path: payload.path,
          geodesic: true,
          strokeColor: payload.pathColor || '#1976D2',
          strokeOpacity: 0.85,
          strokeWeight: 4,
          icons: [{
            icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
            offset: '0',
            repeat: '14px'
          }],
          map: map
        });
      }

      var mePos = paintMyLocation(payload.me);
      var includeMe = false;
      if (mePos && !fittedWithMe) { fittedWithMe = true; includeMe = true; }
      var fitKey = pins.map(function (p) { return p.id; }).join('|') + '#' + (selectedId || '');
      if (fitKey !== lastFitKey || includeMe) {
        lastFitKey = fitKey;
        fitAll(pins, mePos);
      }
    }

    function boot() {
      map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: ${LIMA.lat}, lng: ${LIMA.lng} },
        zoom: 11,
        disableDefaultUI: true,
        zoomControl: false,
        gestureHandling: 'greedy',
        clickableIcons: false
      });
      map.addListener('click', function () { emit({ type: 'select', id: null }); });
      document.getElementById('boot').className = 'hide';
      emit({ type: 'ready' });
      if (pendingPayload) applyPayload(pendingPayload);
    }

    function onHostMessage(data) {
      if (!data || typeof data !== 'object') return;
      if (data.__rutasMapa && data.payload) {
        pendingPayload = data.payload;
        if (map) applyPayload(data.payload);
      }
    }

    window.addEventListener('message', function (event) { onHostMessage(event.data); });
    document.addEventListener('message', function (event) {
      try { onHostMessage(JSON.parse(event.data)); } catch (e) {}
    });

    window.__applyRutasMapa = function (payload) {
      pendingPayload = payload;
      if (map) applyPayload(payload);
    };

    if (window.google && window.google.maps) boot();
    else {
      var s = document.createElement('script');
      s.src = 'https://maps.googleapis.com/maps/api/js?key=${key}';
      s.async = true;
      s.onload = boot;
      s.onerror = function () {
        document.getElementById('boot').textContent = 'Error al cargar Maps';
      };
      document.head.appendChild(s);
    }
  </script>
</body>
</html>`;
}

export function rutasMapaUpdateScript(payload: unknown) {
  return `(function(){try{if(window.__applyRutasMapa)window.__applyRutasMapa(${JSON.stringify(payload)});}catch(e){}})();true;`;
}
