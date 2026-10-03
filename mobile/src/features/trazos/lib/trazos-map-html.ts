import { LIMA } from "@/features/map/constants";
import { getGoogleMapsKey } from "@/features/map/lib/google-map";

export function buildTrazosMapHtml() {
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
  <div id="boot">Cargando trazo…</div>
  <div id="map"></div>
  <script>
    var map = null;
    var pathUnder = null;
    var pathMain = null;
    var extraLines = [];
    var startDots = [];
    var stopMarkers = {};
    var localMarkers = {};
    var startMarker = null;
    var endMarker = null;
    var carMarker = null;
    var pending = null;
    var lastFit = '';
    var lastPath = '';

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

    function svgIcon(svg, w, h, ax, ay) {
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(w, h),
        anchor: new google.maps.Point(ax, ay)
      };
    }

    function stopIcon(minutos, active) {
      var s = active ? 1.15 : 1;
      var w = Math.round(34 * s);
      var label = minutos >= 60 ? Math.round(minutos / 60) + 'h' : Math.round(minutos) + 'm';
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">' +
        '<circle cx="17" cy="17" r="15" fill="#C2410C" stroke="#fff" stroke-width="2.2"/>' +
        '<text x="17" y="17.5" text-anchor="middle" dominant-baseline="central" fill="#fff" font-family="system-ui,sans-serif" font-weight="800" font-size="10">' + label + '</text></svg>';
      return svgIcon(svg, w, w, w / 2, w / 2);
    }

    function localIcon(orden, visitado, active) {
      var color = visitado ? '#0B5340' : '#5C6B67';
      var s = active ? 1.16 : 1;
      var w = Math.round(36 * s);
      var h = Math.round(46 * s);
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">' +
        '<path d="M18 1.5C9.4 1.5 2.5 8.4 2.5 17c0 11 15.5 27.5 15.5 27.5S33.5 28 33.5 17C33.5 8.4 26.6 1.5 18 1.5z" fill="' + color + '" stroke="#fff" stroke-width="2.2"/>' +
        '<circle cx="18" cy="17" r="9" fill="' + color + '"/>' +
        '<text x="18" y="17" text-anchor="middle" dominant-baseline="central" fill="#fff" font-family="system-ui,sans-serif" font-weight="900" font-size="13">' + orden + '</text></svg>';
      return svgIcon(svg, w, h, w / 2, h);
    }

    function flagIcon(kind) {
      var color = kind === 'start' ? '#148A46' : '#1E4D7B';
      var letter = kind === 'start' ? 'A' : 'B';
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">' +
        '<circle cx="14" cy="14" r="12" fill="' + color + '" stroke="#fff" stroke-width="2"/>' +
        '<text x="14" y="15" text-anchor="middle" dominant-baseline="central" fill="#fff" font-family="system-ui,sans-serif" font-weight="900" font-size="12">' + letter + '</text></svg>';
      return svgIcon(svg, 28, 28, 14, 14);
    }

    function carIcon(heading) {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">' +
        '<g transform="rotate(' + (heading || 0) + ' 18 18)">' +
        '<path d="M18 4 L26 28 L18 23 L10 28 Z" fill="#083D30" stroke="#fff" stroke-width="1.6"/></g></svg>';
      return svgIcon(svg, 36, 36, 18, 18);
    }

    function fitPayload(payload) {
      var pts = [];
      (payload.rutas || []).forEach(function (r) {
        (r.path || []).forEach(function (p) { pts.push(p); });
      });
      if (pts.length < 2) pts = (payload.path || []).slice();
      if (pts.length < 2) {
        (payload.paradas || []).forEach(function (p) { pts.push(p); });
        (payload.locales || []).forEach(function (p) {
          if (p.visitado) pts.push(p);
        });
      }
      if (!pts.length) {
        map.setCenter({ lat: ${LIMA.lat}, lng: ${LIMA.lng} });
        map.setZoom(11);
        return;
      }
      if (pts.length === 1) {
        map.setCenter(pts[0]);
        map.setZoom(15);
        return;
      }
      var b = new google.maps.LatLngBounds();
      pts.forEach(function (p) { b.extend(p); });
      map.fitBounds(b, 48);
    }

    function clearExtras() {
      extraLines.forEach(function (l) { l.setMap(null); });
      extraLines = [];
      startDots.forEach(function (m) { m.setMap(null); });
      startDots = [];
    }

    function drawOne(path, color, many) {
      extraLines.push(new google.maps.Polyline({
        path: path, geodesic: false, strokeColor: '#083D30', strokeOpacity: 0.22,
        strokeWeight: many ? 6 : 7, map: map, zIndex: 2
      }));
      extraLines.push(new google.maps.Polyline({
        path: path, geodesic: false, strokeColor: color || '#12A354', strokeOpacity: 1,
        strokeWeight: many ? 3.5 : 4, map: map, zIndex: 4
      }));
    }

    function drawPath(payload) {
      if (pathUnder) { pathUnder.setMap(null); pathUnder = null; }
      if (pathMain) { pathMain.setMap(null); pathMain = null; }
      clearExtras();
      var rutas = payload.rutas && payload.rutas.length
        ? payload.rutas
        : (payload.path && payload.path.length > 1 ? [{ path: payload.path, color: '#12A354', nombre: '' }] : []);
      var many = rutas.length > 1;
      rutas.forEach(function (r) {
        if (!r.path || r.path.length < 2) return;
        drawOne(r.path, r.color, many);
        if (many) {
          startDots.push(new google.maps.Marker({
            map: map,
            position: r.path[0],
            title: r.nombre || 'Operador',
            zIndex: 12,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: r.color || '#12A354',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2
            }
          }));
        }
      });
    }

    function apply(payload) {
      if (!map || !payload) return;
      var selected = payload.selectedId || null;
      var src = [];
      (payload.rutas || []).forEach(function (r) {
        var a = r.path && r.path[0];
        var b = r.path && r.path[r.path.length - 1];
        src.push((r.id || '') + ':' + (a ? a.lat.toFixed(4) + a.lng.toFixed(4) : '') + (b ? b.lat.toFixed(4) + b.lng.toFixed(4) : '') + ':' + (r.path || []).length);
      });
      if (!src.length && payload.path) src.push('p:' + payload.path.length);
      var pathKey = src.join('|');
      if (pathKey !== lastPath) {
        lastPath = pathKey;
        drawPath(payload);
        lastFit = '';
      }

      var keepS = {};
      (payload.paradas || []).forEach(function (p) {
        keepS[p.id] = true;
        var icon = stopIcon(p.minutos || 1, selected === p.id);
        if (stopMarkers[p.id]) {
          stopMarkers[p.id].setPosition({ lat: p.lat, lng: p.lng });
          stopMarkers[p.id].setIcon(icon);
        } else {
          var m = new google.maps.Marker({
            map: map, position: { lat: p.lat, lng: p.lng }, icon: icon, title: p.label || 'Parada', zIndex: 8
          });
          m.addListener('click', function () { emit({ type: 'select', id: p.id }); });
          stopMarkers[p.id] = m;
        }
      });
      Object.keys(stopMarkers).forEach(function (id) {
        if (!keepS[id]) { stopMarkers[id].setMap(null); delete stopMarkers[id]; }
      });

      var keepL = {};
      (payload.locales || []).forEach(function (p) {
        keepL[p.id] = true;
        var icon = localIcon(p.orden || 1, !!p.visitado, selected === p.id);
        if (localMarkers[p.id]) {
          localMarkers[p.id].setPosition({ lat: p.lat, lng: p.lng });
          localMarkers[p.id].setIcon(icon);
        } else {
          var m = new google.maps.Marker({
            map: map, position: { lat: p.lat, lng: p.lng }, icon: icon, title: p.label || 'Local', zIndex: 10
          });
          m.addListener('click', function () { emit({ type: 'select', id: p.id }); });
          localMarkers[p.id] = m;
        }
      });
      Object.keys(localMarkers).forEach(function (id) {
        if (!keepL[id]) { localMarkers[id].setMap(null); delete localMarkers[id]; }
      });

      if (startMarker) { startMarker.setMap(null); startMarker = null; }
      if (endMarker) { endMarker.setMap(null); endMarker = null; }
      if (payload.inicio) {
        startMarker = new google.maps.Marker({
          map: map, position: payload.inicio, icon: flagIcon('start'), title: 'Inicio', zIndex: 12
        });
      }
      if (payload.fin) {
        endMarker = new google.maps.Marker({
          map: map, position: payload.fin, icon: flagIcon('end'), title: 'Fin', zIndex: 12
        });
      }

      if (payload.cursor) {
        var c = payload.cursor;
        if (!carMarker) {
          carMarker = new google.maps.Marker({
            map: map, position: c, icon: carIcon(c.heading || 0), title: 'Operador', zIndex: 20
          });
        } else {
          carMarker.setPosition(c);
          carMarker.setIcon(carIcon(c.heading || 0));
        }
      } else if (carMarker) {
        carMarker.setMap(null);
        carMarker = null;
      }

      var fitKey = pathKey + '#' + (payload.locales || []).map(function (p) { return p.id; }).join('|');
      if (fitKey && fitKey !== lastFit) {
        lastFit = fitKey;
        fitPayload(payload);
      }
    }

    function boot() {
      map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: ${LIMA.lat}, lng: ${LIMA.lng} },
        zoom: 12,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        clickableIcons: false
      });
      map.addListener('click', function () { emit({ type: 'select', id: null }); });
      document.getElementById('boot').className = 'hide';
      emit({ type: 'ready' });
      if (pending) apply(pending);
    }

    function onHost(data) {
      if (!data || typeof data !== 'object') return;
      if (data.__trazos && data.payload) {
        pending = data.payload;
        if (map) apply(data.payload);
      }
    }

    window.addEventListener('message', function (e) { onHost(e.data); });
    document.addEventListener('message', function (e) {
      try { onHost(JSON.parse(e.data)); } catch (err) {}
    });
    window.__applyTrazos = function (payload) {
      pending = payload;
      if (map) apply(payload);
    };

    if (window.google && window.google.maps) boot();
    else {
      var s = document.createElement('script');
      s.src = 'https://maps.googleapis.com/maps/api/js?key=${key}';
      s.async = true;
      s.onload = boot;
      s.onerror = function () { document.getElementById('boot').textContent = 'Error al cargar Maps'; };
      document.head.appendChild(s);
    }
  </script>
</body>
</html>`;
}

export function trazosMapUpdateScript(payload: unknown) {
  return `(function(){try{if(window.__applyTrazos)window.__applyTrazos(${JSON.stringify(payload)});}catch(e){}})();true;`;
}
