import { MAPS_RASTER_OPTION, leafletHead, leafletStart } from "@/features/map/lib/map-raster";
import { LIMA } from "@/features/map/constants";

/**
 * Mapa de 1 pin (tap + drag) para crear/editar local.
 * No usa `google.*` hasta que cargue Maps.
 */
export function buildLocalPickerMapHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  ${leafletHead()}
  <style>
    #hint {
      position: absolute; left: 8px; right: 8px; bottom: 8px; z-index: 2;
      background: rgba(255,255,255,.92); border: 1px solid #D2DDD8; border-radius: 10px;
      padding: 7px 10px; font: 700 11px system-ui, sans-serif; color: #5C6B67;
      text-align: center; pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="hint">Toca o arrastra el pin para ubicar</div>
  <script>
    var map = null, marker = null, pending = null;

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

    function pinIcon() {
      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="45" viewBox="0 0 36 45">' +
        '<path d="M18 1C9.7 1 3 7.7 3 16c0 10.5 15 27 15 27s15-16.5 15-27C33 7.7 26.3 1 18 1z" fill="#0B5340" stroke="#C9A227" stroke-width="2.2"/>' +
        '<circle cx="18" cy="16" r="5.5" fill="#fff"/>' +
        '</svg>';
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(36, 45),
        anchor: new google.maps.Point(18, 45)
      };
    }

    function ensureMarker(lat, lng, moveCamera) {
      var pos = { lat: lat, lng: lng };
      if (!marker) {
        marker = new google.maps.Marker({
          map: map,
          position: pos,
          draggable: true,
          icon: pinIcon()
        });
        marker.addListener('dragend', function() {
          var p = marker.getPosition();
          if (!p) return;
          emit({ type: 'pick', lat: p.lat(), lng: p.lng() });
        });
      } else {
        marker.setPosition(pos);
      }
      if (moveCamera) {
        map.panTo(pos);
        if (map.getZoom() < 15) map.setZoom(16);
      }
    }

    window.setPickerPosition = function(lat, lng, moveCamera) {
      if (!map) {
        pending = { lat: lat, lng: lng, moveCamera: !!moveCamera };
        return;
      }
      if (lat == null || lng == null || !isFinite(lat) || !isFinite(lng)) return;
      ensureMarker(lat, lng, moveCamera !== false);
    };

    window.initLocalPickerMap = function() {
      map = new google.maps.Map(document.getElementById('map'), {
        ${MAPS_RASTER_OPTION},
        center: { lat: ${LIMA.lat}, lng: ${LIMA.lng} },
        zoom: 13,
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

      map.addListener('click', function(event) {
        if (!event || !event.latLng) return;
        var lat = event.latLng.lat();
        var lng = event.latLng.lng();
        ensureMarker(lat, lng, false);
        emit({ type: 'pick', lat: lat, lng: lng });
      });

      emit({ type: 'ready' });
      if (pending) {
        ensureMarker(pending.lat, pending.lng, pending.moveCamera);
        pending = null;
      }
    };

    window.addEventListener('message', function(event) {
      var data = event.data;
      if (!data) return;
      if (data.__localPicker && data.lat != null && data.lng != null) {
        window.setPickerPosition(data.lat, data.lng, data.moveCamera !== false);
      }
    });

    window.gm_authFailure = function() {
      emit({ type: 'error', message: 'gm_authFailure' });
    };
  </script>
  ${leafletStart("initLocalPickerMap")}
</body>
</html>`;
}

export function localPickerSetScript(lat: number, lng: number, moveCamera = true) {
  return `window.setPickerPosition && window.setPickerPosition(${lat}, ${lng}, ${moveCamera ? "true" : "false"}); true;`;
}
