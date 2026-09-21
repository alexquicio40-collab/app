import { getGoogleMapsKey } from "@/features/map/lib/google-map";

/**
 * HTML del mapa de rutas sugeridas.
 * - Polyline principal intensa
 * - Hasta 3 alternativas más tenues
 * - Tooltip con minutos + lentitud
 * - Click en polyline o tip → postMessage select-route
 */
export function buildRoutesMapHtml() {
  const key = getGoogleMapsKey();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body, #map { height: 100%; margin: 0; background: #E7EEEB; }
    .tip {
      background: #FFFFFF;
      color: #0B1F1A;
      border-radius: 10px;
      padding: 6px 8px;
      box-shadow: 0 4px 14px rgba(8,61,48,0.22);
      border: 1.5px solid #D2DDD8;
      font-family: system-ui, -apple-system, sans-serif;
      min-width: 88px;
      text-align: center;
      cursor: pointer;
      user-select: none;
    }
    .tip.best { border-color: #0B5340; background: #DCEEE7; }
    .tip .mins { font-size: 13px; font-weight: 900; line-height: 1.1; color: #0B5340; }
    .tip .delta { font-size: 10px; font-weight: 800; color: #5C6B67; margin-top: 1px; }
    .tip .traf { font-size: 9px; font-weight: 800; letter-spacing: 0.3px; text-transform: uppercase; margin-top: 2px; }
    .tip .traf.ok { color: #0B5340; }
    .tip .traf.warn { color: #C2410C; }
    .tip .traf.bad { color: #B42318; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = null;
    var ready = false;
    var pending = null;
    var routeLayers = [];
    var endMarkers = [];
    var PRIMARY = "#0B5340";
    var ALT_COLORS = ["#5C8F7E", "#7FA898", "#A3C1B5"];

    function post(msg) {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        }
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(msg, "*");
        }
      } catch (e) {}
    }

    function clearAll() {
      routeLayers.forEach(function (layer) {
        if (layer.line) layer.line.setMap(null);
        if (layer.overlay) layer.overlay.setMap(null);
      });
      routeLayers = [];
      endMarkers.forEach(function (m) { m.setMap(null); });
      endMarkers = [];
    }

    function tipHtml(item, selectedId) {
      var isBest = item.id === selectedId;
      return (
        '<div class="tip' + (isBest ? ' best' : '') + '">' +
          '<div class="mins">' + (item.minsLabel || '') + '</div>' +
          (item.delta ? '<div class="delta">' + item.delta + '</div>' : '') +
          '<div class="traf ' + (item.trafficTone || 'ok') + '">' + (item.trafficText || 'Fluido') + '</div>' +
        '</div>'
      );
    }

    function makeTipOverlay(mid, item, selectedId) {
      var overlay = new google.maps.OverlayView();
      overlay.onAdd = function () {
        var div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.zIndex = item.id === selectedId ? '50' : '20';
        div.innerHTML = tipHtml(item, selectedId);
        div.onclick = function (ev) {
          ev.stopPropagation();
          post({ type: 'select-route', id: item.id });
        };
        this.div_ = div;
        this.getPanes().overlayMouseTarget.appendChild(div);
      };
      overlay.draw = function () {
        if (!this.div_ || !mid) return;
        var proj = this.getProjection();
        if (!proj) return;
        var point = proj.fromLatLngToDivPixel(new google.maps.LatLng(mid.lat, mid.lng));
        if (!point) return;
        this.div_.style.left = (point.x - 48) + 'px';
        this.div_.style.top = (point.y - 46) + 'px';
      };
      overlay.onRemove = function () {
        if (this.div_ && this.div_.parentNode) this.div_.parentNode.removeChild(this.div_);
        this.div_ = null;
      };
      overlay.setMap(map);
      return overlay;
    }

    function draw(payload) {
      if (!ready || !map) {
        pending = payload;
        return;
      }
      clearAll();

      var origin = payload.origin;
      var dest = payload.dest;
      var selectedId = payload.selectedId;
      var routes = payload.routes || [];
      if (!routes.length) return;

      var bounds = new google.maps.LatLngBounds();
      if (origin) bounds.extend(origin);
      if (dest) bounds.extend(dest);

      var ordered = routes.slice().sort(function (a, b) {
        if (a.id === selectedId) return 1;
        if (b.id === selectedId) return -1;
        return 0;
      });

      var altIndex = 0;
      ordered.forEach(function (item) {
        var isSelected = item.id === selectedId;
        var path = (item.coords || []).map(function (p) {
          return { lat: Number(p.lat), lng: Number(p.lng) };
        });
        if (path.length < 2) return;
        path.forEach(function (p) { bounds.extend(p); });

        var color = isSelected ? PRIMARY : ALT_COLORS[Math.min(altIndex, ALT_COLORS.length - 1)];
        if (!isSelected) altIndex += 1;

        var line = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: isSelected ? 0.96 : 0.42,
          strokeWeight: isSelected ? 7 : 4,
          zIndex: isSelected ? 40 : 10 + altIndex,
          map: map,
          clickable: true,
        });
        google.maps.event.addListener(line, 'click', function () {
          post({ type: 'select-route', id: item.id });
        });

        var mid = item.mid || path[Math.floor(path.length / 2)];
        var overlay = makeTipOverlay(mid, item, selectedId);
        routeLayers.push({ line: line, overlay: overlay });
      });

      if (origin) {
        endMarkers.push(new google.maps.Marker({
          position: origin,
          map: map,
          title: 'Inicio',
          zIndex: 60,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#C9A227',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
        }));
      }
      if (dest) {
        endMarkers.push(new google.maps.Marker({
          position: dest,
          map: map,
          title: 'Destino',
          zIndex: 60,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#B42318',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
        }));
      }

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { top: 56, right: 40, bottom: 56, left: 40 });
      }
    }

    window.updateRoutesMap = function (payload) { draw(payload); };

    window.initRoutesMap = function () {
      map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -12.0464, lng: -77.0428 },
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
      });
      ready = true;
      if (pending) {
        draw(pending);
        pending = null;
      }
    };

    window.addEventListener('message', function (event) {
      var data = event.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { return; }
      }
      if (!data || typeof data !== 'object') return;
      if (data.type === 'routes') window.updateRoutesMap(data);
    });
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly&callback=initRoutesMap" async></script>
</body>
</html>`;
}

export function routesMapUpdateScript(payload: unknown) {
  return `window.updateRoutesMap && window.updateRoutesMap(${JSON.stringify(payload)}); true;`;
}
