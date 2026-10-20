import { MAPS_RASTER_OPTION, leafletHead, leafletStart } from "@/features/map/lib/map-raster";
import { NAV_CAMERA_JS } from "@/features/mapa-campo/lib/nav-camera";

/**
 * Mapa de campo: rutas estables + cámara de navegación estilo Google Maps
 * (tilt, look-ahead, vehículo abajo). No redibuja polylines en cada tick GPS.
 */
export function buildCampoMapHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  ${leafletHead()}
  <style>
    html, body, #stage, #map { height: 100%; width: 100%; margin: 0; background: #E7EEEB; }
    #compassRose {
      position: absolute; top: 12px; right: 12px; z-index: 4;
      width: 44px; height: 44px; pointer-events: none;
      display: none; align-items: center; justify-content: center;
    }
    #compassRose.on { display: flex; }
    #compassRose svg { width: 44px; height: 44px; filter: drop-shadow(0 2px 4px rgba(0,0,0,.35)); }
    .tip {
      background: #FFFFFF; color: #0B1F1A; border-radius: 10px; padding: 6px 8px;
      box-shadow: 0 4px 14px rgba(8,61,48,0.22); border: 1.5px solid #D2DDD8;
      font-family: system-ui, -apple-system, sans-serif; min-width: 84px; text-align: center;
      cursor: pointer; user-select: none;
    }
    .tip.best { border-color: #0B5340; background: #DCEEE7; }
    .tip .mins { font-size: 13px; font-weight: 900; color: #0B5340; line-height: 1.1; }
    .tip .delta { font-size: 10px; font-weight: 800; color: #5C6B67; margin-top: 1px; }
    .tip .traf { font-size: 9px; font-weight: 800; text-transform: uppercase; margin-top: 2px; }
    .tip .traf.ok { color: #0B5340; } .tip .traf.warn { color: #C2410C; } .tip .traf.bad { color: #B42318; }
  </style>
</head>
<body>
  <div id="stage" class="gm-nav-stage"><div id="map"></div></div>
  <div id="compassRose" aria-hidden="true">
    <svg viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="20" fill="#FFFFFF" stroke="#0B5340" stroke-width="2"/>
      <path d="M22 6 L26 24 L22 21 L18 24 Z" fill="#B42318"/>
      <text x="22" y="14" text-anchor="middle" font-size="8" font-weight="800" fill="#0B5340">N</text>
    </svg>
  </div>
  <script>
    var map = null, ready = false, pending = null;
    var meMarker = null, destMarker = null;
    var stopPins = {};
    var lastPinsKey = '';
    var routeLayers = [];
    var traveledLine = null;
    var lastRoutesKey = '';
    var lastSelectedId = null;
    var lastDestKey = '';
    var lastTraveledKey = '';
    var lastIdleFit = '';
    var lastFocusToken = 0;
    var followEnabled = false;
    var cameraHold = false;
    var trackingActive = false;
    var compassOn = false;
    var deviceHeading = null;
    var horizon = null;
    var lockedCourse = 0;
    var courseReady = false;
    var courseAnchor = null;
    var lastPan = null;
    var lastNavZoom = 0;
    var lastSpeedMps = 0;
    var TURN_MIN_DEG = 22;
    var TURN_TRAVEL_M = 10;
    var PAN_MIN_M = 2;
    var CATCH_S = 0.12;
    var pendingCourse = null;
    var animRaf = 0;
    var lastAnimTs = 0;
    var displayPos = null;
    var targetPos = null;
    var displayHeading = 0;
    var targetHeading = 0;
    var accCircle = null;
    var PRIMARY = '#0B5340';
    var ALT = ['#5C8F7E', '#7FA898', '#A3C1B5'];
    var MY_BLUE = '#1A73E8';

    function post(msg) {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        }
        if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*');
      } catch (e) {}
    }

    function emitFollow() {
      post({ type: 'follow', on: !!followEnabled });
    }

    ${NAV_CAMERA_JS}

    function navHeading() {
      if (courseReady) return lockedCourse;
      return displayHeading || targetHeading || 0;
    }

    function followCamera(pos, snap) {
      if (!map || !pos) return;
      if (!trackingActive) {
        if (snap) {
          map.setCenter(pos);
          if (map.getZoom() < 17) map.setZoom(18);
          return;
        }
        if (lastPan && metersApprox(lastPan, pos) < PAN_MIN_M) return;
        lastPan = { lat: pos.lat, lng: pos.lng };
        map.panTo(pos);
        return;
      }
      var aim = applyNavCamera(map, pos, navHeading(), lastSpeedMps, {
        snap: !!snap,
        zoom: snap || lastNavZoom === 0,
        tilt: followEnabled || cameraHold,
      });
      if (!aim) return;
      lastPan = { lat: aim.lat, lng: aim.lng };
      lastNavZoom = navZoomForSpeed(lastSpeedMps);
    }

    function focusCar(snap) {
      followCamera(displayPos || targetPos, snap);
    }

    function setFollow(on, snap) {
      followEnabled = !!on;
      if (followEnabled) cameraHold = true;
      emitFollow();
      if (followEnabled) focusCar(!!snap);
    }

    function paintRose(heading) {
      var rose = document.getElementById('compassRose');
      if (!rose) return;
      rose.classList.toggle('on', compassOn);
      rose.style.transform = 'rotate(' + (-Number(heading || 0)) + 'deg)';
    }

    function shortestDeg(from, to) {
      return ((to - from + 540) % 360) - 180;
    }

    function wrapDeg(n) {
      return ((Number(n) % 360) + 360) % 360;
    }

    function ensureHorizon() {
      if (horizon || typeof createHorizonSmoother !== 'function') return horizon;
      horizon = createHorizonSmoother(function (deg) {
        if (map && map.setHeading) map.setHeading(deg);
        paintRose(deg);
      }, { tau: 0.16, maxDegS: 140, deadzone: 4, holdMs: 50 });
      return horizon;
    }

    function desiredHorizon() {
      if (trackingActive) return wrapDeg(lockedCourse);
      if (compassOn && deviceHeading != null && !isNaN(Number(deviceHeading))) {
        return wrapDeg(deviceHeading);
      }
      return 0;
    }

    function applyHorizon(snap) {
      var api = ensureHorizon();
      var next = desiredHorizon();
      if (!api) {
        if (map && map.setHeading) map.setHeading(next);
        paintRose(next);
        return;
      }
      if (snap) api.snap(next);
      else api.aim(next);
    }

    function bearingFrom(a, b) {
      var dLng = (b.lng - a.lng) * Math.PI / 180;
      var lat1 = a.lat * Math.PI / 180;
      var lat2 = b.lat * Math.PI / 180;
      var y = Math.sin(dLng) * Math.cos(lat2);
      var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
      return wrapDeg(Math.atan2(y, x) * 180 / Math.PI);
    }

    function noteTravel(pos) {
      if (!trackingActive || !pos) return;
      if (!courseAnchor) {
        courseAnchor = { lat: pos.lat, lng: pos.lng };
        return;
      }
      var dist = metersApprox(courseAnchor, pos);
      if (dist < TURN_TRAVEL_M) return;
      var bearing = bearingFrom(courseAnchor, pos);
      if (!courseReady) {
        lockedCourse = bearing;
        courseReady = true;
        courseAnchor = { lat: pos.lat, lng: pos.lng };
        pendingCourse = null;
        applyHorizon(true);
        return;
      }
      var turn = Math.abs(shortestDeg(lockedCourse, bearing));
      if (turn < TURN_MIN_DEG) {
        courseAnchor = { lat: pos.lat, lng: pos.lng };
        pendingCourse = null;
        return;
      }
      if (pendingCourse == null || Math.abs(shortestDeg(pendingCourse, bearing)) > 18) {
        pendingCourse = bearing;
        return;
      }
      lockedCourse = bearing;
      pendingCourse = null;
      courseAnchor = { lat: pos.lat, lng: pos.lng };
      applyHorizon(false);
    }

    function panFollow(pos) {
      if (!map || !pos || (!followEnabled && !cameraHold)) return;
      followCamera(pos, false);
    }

    function setCampoCompass(on, heading) {
      var wasOn = compassOn;
      compassOn = !!on;
      if (heading != null && !isNaN(Number(heading))) deviceHeading = Number(heading);
      if (!compassOn && wasOn) {
        applyHorizon(true);
        return;
      }
      applyHorizon(false);
    }

    function recenterMe() {
      cameraHold = true;
      lastPan = null;
      lastNavZoom = 0;
      setFollow(true, true);
      applyHorizon(true);
    }

    function goToStop(lat, lng) {
      if (!map || !isFinite(Number(lat)) || !isFinite(Number(lng))) return;
      followEnabled = false;
      cameraHold = false;
      emitFollow();
      clearNavCamera(map);
      map.panTo({ lat: Number(lat), lng: Number(lng) });
      if (map.getZoom() < 15) map.setZoom(16);
    }

    function routesKey(routes, selectedId, traveled) {
      var parts = (routes || []).map(function (r) {
        var first = r.coords && r.coords[0] ? r.coords[0].lat + ',' + r.coords[0].lng : '';
        var last = r.coords && r.coords.length ? r.coords[r.coords.length - 1].lat + ',' + r.coords[r.coords.length - 1].lng : '';
        return r.id + ':' + (r.coords ? r.coords.length : 0) + ':' + first + ':' + last + ':' + (r.minsLabel || '');
      });
      var tLen = (traveled || []).length;
      return selectedId + '|t' + tLen + '|' + parts.join('|');
    }

    function clearRoutes() {
      routeLayers.forEach(function (layer) {
        if (layer.line) layer.line.setMap(null);
        if (layer.overlay) layer.overlay.setMap(null);
      });
      routeLayers = [];
      if (traveledLine) { traveledLine.setMap(null); traveledLine = null; }
      lastTraveledKey = '';
    }

    function drawTraveled(traveled) {
      var path = (traveled || []).map(function (p) {
        return { lat: Number(p.lat), lng: Number(p.lng) };
      });
      var key = path.length + ':' + (path[0] ? path[0].lat + ',' + path[0].lng : '') + ':' +
        (path.length ? path[path.length - 1].lat + ',' + path[path.length - 1].lng : '');
      if (key === lastTraveledKey) return;
      lastTraveledKey = key;
      if (traveledLine) { traveledLine.setMap(null); traveledLine = null; }
      if (path.length < 2) return;
      traveledLine = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#8AA399',
        strokeOpacity: 0.55,
        strokeWeight: 5,
        zIndex: 25,
        map: map,
        clickable: false,
      });
    }

    function tipHtml(item, selectedId) {
      var best = item.id === selectedId;
      return '<div class="tip' + (best ? ' best' : '') + '">' +
        '<div class="mins">' + (item.minsLabel || '') + '</div>' +
        (item.delta ? '<div class="delta">' + item.delta + '</div>' : '') +
        '<div class="traf ' + (item.trafficTone || 'ok') + '">' + (item.trafficText || 'Fluido') + '</div>' +
      '</div>';
    }

    function makeTip(mid, item, selectedId) {
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
        this.div_.style.left = (point.x - 46) + 'px';
        this.div_.style.top = (point.y - 44) + 'px';
      };
      overlay.onRemove = function () {
        if (this.div_ && this.div_.parentNode) this.div_.parentNode.removeChild(this.div_);
        this.div_ = null;
      };
      overlay.setMap(map);
      return overlay;
    }

    function meIcon(tracking, heading) {
      if (tracking) {
        var svg =
          '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="58" viewBox="0 0 44 58">' +
          '<ellipse cx="22" cy="52" rx="12" ry="4.4" fill="#000" opacity=".22"/>' +
          '<path d="M12.6 40.5c0 3.4 18.8 3.4 18.8 0l2.2-15.2C34.2 16 29.2 10 22 10s-12.2 6-11.6 15.3z" fill="#F7F8FA" stroke="#C8CDD3" stroke-width="1.3"/>' +
          '<path d="M16.2 23c.2-5.2 11.4-5.2 11.6 0l-.8 6.2c-.4 1.8-10 1.8-10.4 0z" fill="#90A4AE"/>' +
          '<path d="M15.8 32.4h12.4l.8 6.6H15z" fill="#EEF1F4"/>' +
          '<rect x="11.4" y="26.2" width="2.3" height="5.2" rx="1" fill="#1A73E8"/>' +
          '<rect x="30.3" y="26.2" width="2.3" height="5.2" rx="1" fill="#1A73E8"/>' +
          '<rect x="11.6" y="34.6" width="2.5" height="5.6" rx="1" fill="#263238"/>' +
          '<rect x="29.9" y="34.6" width="2.5" height="5.6" rx="1" fill="#263238"/>' +
          '</svg>';
        return {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
          scaledSize: new google.maps.Size(44, 58),
          anchor: new google.maps.Point(22, 40),
          rotation: Number(heading || 0),
        };
      }
      return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8, fillColor: '#1A73E8', fillOpacity: 1,
        strokeColor: '#FFFFFF', strokeWeight: 3,
      };
    }

    function ensureMeMarker(tracking, pos, heading) {
      var kind = tracking ? 'arrow' : 'dot';
      if (meMarker && meMarker.__kind === kind) return;
      var at = pos || displayPos || targetPos;
      if (meMarker) { meMarker.setMap(null); meMarker = null; }
      meMarker = new google.maps.Marker({
        map: map,
        position: at || { lat: -12.0464, lng: -77.0428 },
        title: 'Mi ubicación',
        zIndex: 60,
        icon: meIcon(!!tracking, heading),
        clickable: false,
      });
      meMarker.__kind = kind;
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

    function drawPins(pins, selectedPinId) {
      var list = pins || [];
      var key = selectedPinId + '|' + list.map(function (p) {
        return p.id + ':' + p.orden + ':' + p.lat + ',' + p.lng + ':' + (p.color || '');
      }).join('|');
      if (key === lastPinsKey) return;
      lastPinsKey = key;
      var keep = {};
      list.forEach(function (pin) {
        keep[pin.id] = true;
        var active = selectedPinId === pin.id;
        var icon = pinIcon(pin.color || '#F9A825', pin.orden || 0, active);
        if (stopPins[pin.id]) {
          stopPins[pin.id].setPosition({ lat: pin.lat, lng: pin.lng });
          stopPins[pin.id].setIcon(icon);
          stopPins[pin.id].setZIndex(active ? 80 : (pin.orden || 1));
          return;
        }
        var marker = new google.maps.Marker({
          map: map,
          position: { lat: pin.lat, lng: pin.lng },
          icon: icon,
          title: pin.label || '',
          zIndex: active ? 80 : (pin.orden || 1)
        });
        marker.addListener('click', function () {
          post({ type: 'select-pin', id: pin.id });
        });
        stopPins[pin.id] = marker;
      });
      Object.keys(stopPins).forEach(function (id) {
        if (keep[id]) return;
        stopPins[id].setMap(null);
        delete stopPins[id];
      });
    }

    function ensureDestMarker(dest, color) {
      var fill = color || '#E53935';
      var key = dest ? dest.lat + ',' + dest.lng + ':' + fill : '';
      if (!dest) {
        if (destMarker) { destMarker.setMap(null); destMarker = null; }
        lastDestKey = '';
        return;
      }
      if (key === lastDestKey && destMarker) return;
      lastDestKey = key;
      if (destMarker) destMarker.setMap(null);
      destMarker = new google.maps.Marker({
        position: dest, map: map, title: 'Destino', zIndex: 45,
        icon: {
          path: google.maps.SymbolPath.CIRCLE, scale: 8,
          fillColor: fill, fillOpacity: 1, strokeColor: '#FFFFFF', strokeWeight: 2,
        },
      });
    }

    function drawRoutes(routes, selectedId, traveled) {
      var key = routesKey(routes, selectedId, traveled);
      if (key === lastRoutesKey) {
        drawTraveled(traveled);
        return null;
      }
      lastRoutesKey = key;
      lastSelectedId = selectedId;
      clearRoutes();
      drawTraveled(traveled);

      var bounds = new google.maps.LatLngBounds();
      var hasBounds = false;
      var ordered = (routes || []).slice().sort(function (a, b) {
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
        path.forEach(function (p) { bounds.extend(p); hasBounds = true; });
        var color = isSelected ? PRIMARY : ALT[Math.min(altIndex, ALT.length - 1)];
        if (!isSelected) altIndex += 1;

        var line = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: isSelected ? 0.96 : 0.4,
          strokeWeight: isSelected ? 7 : 4,
          zIndex: isSelected ? 40 : 10 + altIndex,
          map: map,
          clickable: true,
        });
        google.maps.event.addListener(line, 'click', function () {
          post({ type: 'select-route', id: item.id });
        });
        var mid = item.mid || path[Math.floor(path.length / 2)];
        var overlay = makeTip(mid, item, selectedId);
        routeLayers.push({ line: line, overlay: overlay });
      });

      return hasBounds ? bounds : null;
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    function lerpAngle(a, b, t) {
      var diff = ((b - a + 540) % 360) - 180;
      return (a + diff * t + 360) % 360;
    }

    function metersApprox(a, b) {
      var dlat = (a.lat - b.lat) * 111320;
      var dlng = (a.lng - b.lng) * 111320 * Math.cos(a.lat * Math.PI / 180);
      return Math.sqrt(dlat * dlat + dlng * dlng);
    }

    function startAnim() {
      if (animRaf) return;
      lastAnimTs = 0;
      animRaf = requestAnimationFrame(tickAnim);
    }

    function tickAnim(ts) {
      animRaf = 0;
      if (!targetPos || !meMarker) return;
      if (!displayPos) displayPos = { lat: targetPos.lat, lng: targetPos.lng };
      if (!lastAnimTs) lastAnimTs = ts;
      var dt = Math.min(0.05, (ts - lastAnimTs) / 1000);
      lastAnimTs = ts;
      var jump = metersApprox(displayPos, targetPos);
      var t = 1 - Math.exp(-dt / CATCH_S);
      if (jump < 0.35) {
        displayPos = { lat: targetPos.lat, lng: targetPos.lng };
      } else if (jump > 90) {
        displayPos = { lat: targetPos.lat, lng: targetPos.lng };
      } else {
        displayPos = {
          lat: lerp(displayPos.lat, targetPos.lat, t),
          lng: lerp(displayPos.lng, targetPos.lng, t),
        };
      }
      var wantHeading = courseReady ? lockedCourse : targetHeading;
      displayHeading = lerpAngle(displayHeading, wantHeading, t);
      meMarker.setPosition(displayPos);
      if (meMarker.__kind === 'arrow') {
        meMarker.setOptions({ rotation: 0 });
      }
      panFollow(displayPos);
      noteTravel(displayPos);
      var headingGap = Math.abs(shortestDeg(displayHeading, wantHeading));
      if (jump > 0.35 || headingGap > 0.8) {
        animRaf = requestAnimationFrame(tickAnim);
      } else {
        lastAnimTs = 0;
      }
    }

    function setAccuracy(position, accuracy) {
      var radius = Number(accuracy);
      if (!position || !Number.isFinite(radius) || radius < 4) {
        if (accCircle) { accCircle.setMap(null); accCircle = null; }
        return;
      }
      var pos = { lat: Number(position.lat), lng: Number(position.lng) };
      var r = Math.max(8, Math.min(radius, 80));
      if (!accCircle) {
        accCircle = new google.maps.Circle({
          map: map,
          center: pos,
          radius: r,
          strokeColor: MY_BLUE,
          strokeOpacity: 0.28,
          strokeWeight: 1,
          fillColor: MY_BLUE,
          fillOpacity: 0.12,
          clickable: false,
        });
        return;
      }
      accCircle.setCenter(pos);
      accCircle.setRadius(r);
    }

    function setMe(position, heading, tracking, accuracy, speedMps) {
      if (!position) {
        if (animRaf) cancelAnimationFrame(animRaf);
        animRaf = 0;
        lastAnimTs = 0;
        if (meMarker) { meMarker.setMap(null); meMarker = null; }
        if (accCircle) { accCircle.setMap(null); accCircle = null; }
        displayPos = null;
        targetPos = null;
        trackingActive = false;
        lastSpeedMps = 0;
        lastNavZoom = 0;
        clearNavCamera(map);
        return;
      }
      lastSpeedMps = Number(speedMps) || 0;
      var nextPos = { lat: Number(position.lat), lng: Number(position.lng) };
      var nextHeading = Number(heading || 0);
      var starting = tracking && !trackingActive;
      if (trackingActive && !tracking) {
        lastNavZoom = 0;
        clearNavCamera(map);
      }
      targetPos = nextPos;
      targetHeading = nextHeading;
      if (starting) {
        displayPos = { lat: targetPos.lat, lng: targetPos.lng };
        displayHeading = targetHeading;
        followEnabled = true;
        cameraHold = true;
        lastPan = null;
        lastNavZoom = 0;
        lockedCourse = targetHeading;
        courseReady = Number.isFinite(targetHeading);
        pendingCourse = null;
        courseAnchor = { lat: displayPos.lat, lng: displayPos.lng };
        emitFollow();
      }
      ensureMeMarker(!!tracking, targetPos, targetHeading);
      trackingActive = !!tracking;
      setAccuracy(tracking ? null : targetPos, tracking ? null : accuracy);
      if (!displayPos) {
        displayPos = { lat: targetPos.lat, lng: targetPos.lng };
        displayHeading = targetHeading;
      }
      meMarker.setPosition(displayPos);
      if (meMarker.__kind === 'arrow') {
        meMarker.setOptions({ rotation: 0 });
      }
      if (starting) {
        applyHorizon(true);
        followCamera(displayPos, true);
      }
      startAnim();
    }

    function draw(payload) {
      if (!ready || !map) { pending = payload; return; }

      var tracking = !!payload.tracking;
      var position = payload.position;
      var dest = payload.dest;
      var heading = Number(payload.heading || 0);
      var selectedId = payload.selectedId;
      var routes = payload.routes || [];
      var accuracy = payload.accuracy;
      var speedMps = Number(payload.speedMps || 0);

      var pins = payload.pins || [];
      var selectedPinId = payload.selectedPinId || null;
      var routeBounds = drawRoutes(routes, selectedId, payload.traveled || []);
      drawPins(pins, selectedPinId);
      ensureDestMarker(pins.length ? null : dest, payload.destColor);
      setMe(position, heading, tracking, accuracy, speedMps);

      if (tracking) {
        lastIdleFit = '';
        lastFocusToken = 0;
        return;
      }

      var token = Number(payload.focusToken || 0);
      if (token > 0 && token !== lastFocusToken) {
        lastFocusToken = token;
        var focusPin = null;
        for (var i = 0; i < pins.length; i++) {
          if (pins[i].id === selectedPinId) { focusPin = pins[i]; break; }
        }
        var focusAt = focusPin || dest;
        if (focusAt) {
          goToStop(focusAt.lat, focusAt.lng);
          applyHorizon();
          return;
        }
      }

      var locked = cameraHold || followEnabled;
      if (locked) {
        applyHorizon();
        return;
      }

      if (routeBounds) {
        clearNavCamera(map);
        applyHorizon();
        if (dest) routeBounds.extend(dest);
        if (position) routeBounds.extend(position);
        map.fitBounds(routeBounds, { top: 56, right: 40, bottom: 120, left: 40 });
        return;
      }

      clearNavCamera(map);
      applyHorizon();
      var idle = new google.maps.LatLngBounds();
      var has = false;
      pins.forEach(function (pin) { idle.extend({ lat: pin.lat, lng: pin.lng }); has = true; });
      if (dest) { idle.extend(dest); has = true; }
      var idleKey = pins.map(function (p) { return p.id; }).join(',') +
        (dest ? dest.lat + ',' + dest.lng : '');
      if (has && idleKey !== lastIdleFit) {
        lastIdleFit = idleKey;
        if (pins.length + (dest ? 1 : 0) === 1) {
          var only = pins[0] || dest;
          map.setCenter({ lat: only.lat, lng: only.lng });
          map.setZoom(14);
        } else {
          map.fitBounds(idle, 64);
        }
        return;
      }
      if (!has && position && lastIdleFit !== 'me') {
        lastIdleFit = 'me';
        map.setCenter({ lat: position.lat, lng: position.lng });
        map.setZoom(16);
      }
    }

    window.updateCampoMap = function (payload) { draw(payload); };
    window.recenterMe = recenterMe;
    window.setCampoCompass = setCampoCompass;

    window.initCampoMap = function () {
      map = new google.maps.Map(document.getElementById('map'), {
        ${MAPS_RASTER_OPTION},
        center: { lat: -12.0464, lng: -77.0428 },
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
      });
      google.maps.event.addListener(map, 'dragstart', function () {
        if (!followEnabled && !cameraHold) return;
        followEnabled = false;
        cameraHold = false;
        emitFollow();
      });
      ready = true;
      if (pending) { draw(pending); pending = null; }
    };

    window.addEventListener('message', function (event) {
      var data = event.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { return; }
      }
      if (!data || !data.type) return;
      if (data.type === 'recenter') { recenterMe(); return; }
      if (data.type === 'compass') {
        setCampoCompass(!!data.on, data.heading);
        return;
      }
      if (data.type === 'campo' || data.type === 'nav') window.updateCampoMap(data);
    });
  </script>
  ${leafletStart("initCampoMap")}
</body>
</html>`;
}

export function campoMapUpdateScript(payload: unknown) {
  return `window.updateCampoMap && window.updateCampoMap(${JSON.stringify(payload)}); true;`;
}

export function campoMapRecenterScript() {
  return `window.recenterMe && window.recenterMe(); true;`;
}

export function campoMapCompassScript(on: boolean, heading: number | null) {
  const deg = heading == null || !Number.isFinite(heading) ? "null" : String(heading);
  return `window.setCampoCompass && window.setCampoCompass(${on ? "true" : "false"}, ${deg}); true;`;
}
