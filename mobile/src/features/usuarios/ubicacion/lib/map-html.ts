import { LIMA } from "@/features/map/constants";
import { MAPS_RASTER_OPTION, leafletHead, leafletDynamicBoot } from "@/features/map/lib/map-raster";

export function buildUsuariosUbicacionHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  ${leafletHead()}
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
    var pending = null;
    var lastFit = '';

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

    function pinIcon(vivo, active) {
      var color = vivo ? '#0B5340' : '#5C6B67';
      var s = active ? 1.14 : 1;
      var w = Math.round(36 * s);
      var h = Math.round(46 * s);
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">' +
        '<path d="M18 1.5C9.4 1.5 2.5 8.4 2.5 17c0 11 15.5 27.5 15.5 27.5S33.5 28 33.5 17C33.5 8.4 26.6 1.5 18 1.5z" fill="' + color + '" stroke="#fff" stroke-width="2.2"/>' +
        '<circle cx="18" cy="17" r="6" fill="#fff"/></svg>';
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(w, h),
        anchor: new google.maps.Point(w / 2, h)
      };
    }

    function apply(payload) {
      if (!map || !payload) return;
      var pins = payload.puntos || [];
      var selected = payload.selectedId || null;
      var keep = {};
      var bounds = new google.maps.LatLngBounds();

      pins.forEach(function (p) {
        keep[p.id] = true;
        var pos = { lat: p.lat, lng: p.lng };
        var icon = pinIcon(!!p.vivo, selected === p.id);
        var marker = markers[p.id];
        if (!marker) {
          marker = new google.maps.Marker({
            map: map, position: pos, icon: icon, title: p.nombre || 'Usuario', zIndex: 8
          });
          marker.addListener('click', function () { emit({ type: 'select', id: p.id }); });
          markers[p.id] = marker;
        } else {
          marker.setPosition(pos);
          marker.setIcon(icon);
          marker.setTitle(p.nombre || 'Usuario');
        }
        bounds.extend(pos);
      });

      Object.keys(markers).forEach(function (id) {
        if (!keep[id]) { markers[id].setMap(null); delete markers[id]; }
      });

      var fitKey = pins.map(function (p) { return p.id; }).join('|');
      if (selected && markers[selected]) {
        map.panTo(markers[selected].getPosition());
        if (map.getZoom() < 14) map.setZoom(14);
        lastFit = fitKey;
        return;
      }
      if (fitKey === lastFit) return;
      lastFit = fitKey;
      if (!pins.length) {
        map.setCenter({ lat: ${LIMA.lat}, lng: ${LIMA.lng} });
        map.setZoom(11);
        return;
      }
      if (pins.length === 1) {
        map.setCenter({ lat: pins[0].lat, lng: pins[0].lng });
        map.setZoom(14);
        return;
      }
      map.fitBounds(bounds, 48);
    }

    function boot() {
      map = new google.maps.Map(document.getElementById('map'), {
        ${MAPS_RASTER_OPTION},
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

    window.addEventListener('message', function (e) {
      if (e.data && e.data.__usuariosUbic && e.data.payload) {
        pending = e.data.payload;
        if (map) apply(e.data.payload);
      }
    });
    document.addEventListener('message', function (e) {
      try {
        var data = JSON.parse(e.data);
        if (data && data.__usuariosUbic && data.payload) {
          pending = data.payload;
          if (map) apply(data.payload);
        }
      } catch (err) {}
    });
    window.__applyUsuariosUbic = function (payload) {
      pending = payload;
      if (map) apply(payload);
    };

    ${leafletDynamicBoot("boot")}
  </script>
</body>
</html>`;
}

export function usuariosUbicacionScript(payload: unknown) {
  return `(function(){try{if(window.__applyUsuariosUbic)window.__applyUsuariosUbic(${JSON.stringify(payload)});}catch(e){}})();true;`;
}
