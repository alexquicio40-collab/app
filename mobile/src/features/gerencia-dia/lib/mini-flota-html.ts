import { MAPS_RASTER_OPTION, leafletHead, leafletStart } from "@/features/map/lib/map-raster";
import { LIMA } from "@/features/map/constants";

export type MiniFlotaPin = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  avance: number | null;
};

export function buildMiniFlotaHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  ${leafletHead()}
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; background: #EAF3ED; }
    #boot {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      color: #667870; font: 600 13px system-ui, sans-serif; z-index: 2; pointer-events: none;
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

    function truckIcon() {
      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">' +
        '<circle cx="20" cy="20" r="16" fill="#148A46" stroke="#ffffff" stroke-width="3"/>' +
        '<path d="M11 16.2h9.2v7.2H11z" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/>' +
        '<path d="M20.2 18.6H24l2.2 2.2v2.6h-6z" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/>' +
        '<circle cx="14.2" cy="24.8" r="1.2" fill="#fff"/>' +
        '<circle cx="24.2" cy="24.8" r="1.2" fill="#fff"/>' +
        '</svg>';
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20),
        labelOrigin: new google.maps.Point(20, 46)
      };
    }

    function apply(payload) {
      if (!map || !window.google || !google.maps) {
        pending = payload;
        return;
      }
      var pins = (payload && payload.pins) || [];
      var seen = {};
      var bounds = new google.maps.LatLngBounds();
      var icon = truckIcon();

      pins.forEach(function (pin) {
        seen[pin.id] = true;
        var title = pin.avance != null ? pin.nombre + ' · ' + pin.avance + '%' : pin.nombre;
        var marker = markers[pin.id];
        if (!marker) {
          marker = new google.maps.Marker({
            map: map,
            position: { lat: pin.lat, lng: pin.lng },
            icon: icon,
            title: title,
            label: {
              text: title,
              color: '#14261F',
              fontSize: '11px',
              fontWeight: '700',
              className: 'mini-flota-label'
            }
          });
          markers[pin.id] = marker;
        } else {
          marker.setPosition({ lat: pin.lat, lng: pin.lng });
          marker.setTitle(title);
          marker.setLabel({
            text: title,
            color: '#14261F',
            fontSize: '11px',
            fontWeight: '700'
          });
        }
        bounds.extend({ lat: pin.lat, lng: pin.lng });
      });

      Object.keys(markers).forEach(function (id) {
        if (!seen[id]) {
          markers[id].setMap(null);
          delete markers[id];
        }
      });

      if (pins.length === 1) {
        map.panTo({ lat: pins[0].lat, lng: pins[0].lng });
        map.setZoom(13);
      } else if (pins.length > 1) {
        map.fitBounds(bounds, 48);
      } else {
        map.panTo({ lat: ${LIMA.lat}, lng: ${LIMA.lng} });
        map.setZoom(11);
      }
    }

    window.updateMiniFlota = apply;

    window.addEventListener('message', function (event) {
      var data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.__miniFlota && data.payload) apply(data.payload);
    });

    window.initMiniFlota = function () {
      map = new google.maps.Map(document.getElementById('map'), {
        ${MAPS_RASTER_OPTION},
        center: { lat: ${LIMA.lat}, lng: ${LIMA.lng} },
        zoom: 11,
        disableDefaultUI: true,
        clickableIcons: false,
        gestureHandling: 'cooperative',
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#E7EEEA' }] },
          { featureType: 'landscape', stylers: [{ color: '#F4F7F5' }] },
          { featureType: 'water', stylers: [{ color: '#C5D9F0' }] }
        ]
      });
      document.getElementById('boot').className = 'hide';
      emit({ type: 'ready' });
      if (pending) apply(pending);
    };
  </script>
  ${leafletStart("initMiniFlota")}
</body>
</html>`;
}

export function miniFlotaUpdateScript(payload: unknown) {
  return `window.updateMiniFlota && window.updateMiniFlota(${JSON.stringify(payload)}); true;`;
}
