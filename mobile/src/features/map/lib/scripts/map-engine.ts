/**
 * Runtime JS del mapa.
 * - Furgoneta 3D sólida (Car3D) + rotación plana
 * - Badge de nombre (no rota) para identificar operadores
 * - Ruta por operador activo: inicio + destino + polyline
 * - Mi ubicación del administrador (punto azul + precisión)
 */
export function buildMapEngineScript(limaLat: number, limaLng: number) {
  return `
    var LIMA = { lat: ${limaLat}, lng: ${limaLng} };
    var map, traffic, directions;
    var pending = null;
    var lastFittedKey = "";
    var didFit = false;

    var operatorMarkers = {};
    var badgeMarkers = {};
    var routeLayers = {};
    var routeOrigins = {};
    var motion = {};
    var rafId = 0;

    var myMarker = null;
    var myCircle = null;
    var MY_BLUE = "#1A73E8";
    var compassOn = false;
    var lastMapHeading = 0;
    var deviceHeading = null;
    var compassBound = false;

    var STYLE = [
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "poi.business", stylers: [{ visibility: "off" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] },
      { featureType: "transit.station", stylers: [{ visibility: "off" }] },
      { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { elementType: "geometry", stylers: [{ saturation: -18 }] },
      { featureType: "water", stylers: [{ color: "#0B5340" }, { lightness: 62 }] },
      { featureType: "road.highway", stylers: [{ color: "#C9A227" }, { lightness: 42 }] }
    ];

    var COLORS = { line: "#0B5340", route: "#C9A227" };
    var ROUTE_PALETTE = ["#0B5340", "#C9A227", "#1D4ED8", "#B42318", "#7C3AED", "#0E7490", "#C2410C", "#15803D"];
    var MOVE_EPS = 0.00000003;
    var ANIM_MS = 1800;

    function bearing(from, to) {
      var dLng = (to.lng - from.lng) * Math.PI / 180;
      var lat1 = from.lat * Math.PI / 180;
      var lat2 = to.lat * Math.PI / 180;
      var y = Math.sin(dLng) * Math.cos(lat2);
      var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
      return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    }

    function lerp(a, b, t) { return a + (b - a) * t; }
    function lerpAngle(a, b, t) {
      var d = ((b - a + 540) % 360) - 180;
      return (a + d * t + 360) % 360;
    }
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function shortName(name) {
      var parts = String(name || "Operador").trim().split(/\\s+/).filter(Boolean);
      if (!parts.length) return "Operador";
      if (parts.length === 1) return parts[0].slice(0, 16);
      var text = parts[0] + " " + parts[parts.length - 1].charAt(0).toUpperCase() + ".";
      return text.slice(0, 18);
    }

    function routeColor(opId) {
      var n = Number(opId) || 0;
      return ROUTE_PALETTE[Math.abs(n) % ROUTE_PALETTE.length];
    }

    function prune(store, keep, onRemove) {
      Object.keys(store).forEach(function (id) {
        if (keep[id]) return;
        if (onRemove) onRemove(id, store[id]);
        else if (store[id] && store[id].setMap) store[id].setMap(null);
        delete store[id];
      });
    }

    // ——— Badges de nombre (no rotan con la furgoneta) ———

    function badgeIcon(name, onRoute) {
      var label = shortName(name);
      var padX = 10;
      var h = 26;
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      ctx.font = "800 12px system-ui,Segoe UI,sans-serif";
      var tw = Math.ceil(ctx.measureText(label).width);
      var w = Math.max(44, tw + padX * 2);
      canvas.width = w * 2;
      canvas.height = (h + 8) * 2;
      ctx.scale(2, 2);

      var border = onRoute ? "#C9A227" : "#0B5340";
      var fill = onRoute ? "#FFF8E8" : "#FFFFFF";
      var r = 13;
      ctx.beginPath();
      ctx.moveTo(r, 1);
      ctx.arcTo(w - 1, 1, w - 1, h - 1, r);
      ctx.arcTo(w - 1, h - 1, 1, h - 1, r);
      ctx.arcTo(1, h - 1, 1, 1, r);
      ctx.arcTo(1, 1, w - 1, 1, r);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = border;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // tip
      ctx.beginPath();
      ctx.moveTo(w / 2 - 5, h - 1);
      ctx.lineTo(w / 2, h + 6);
      ctx.lineTo(w / 2 + 5, h - 1);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#0B1F1A";
      ctx.font = "800 12px system-ui,Segoe UI,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, w / 2, h / 2);

      return {
        url: canvas.toDataURL("image/png"),
        scaledSize: new google.maps.Size(w, h + 8),
        anchor: new google.maps.Point(w / 2, h + 8)
      };
    }

    function paintBadge(opId, state) {
      var on = state.estado === "activo";
      var pos = { lat: state.lat, lng: state.lng };
      var key = shortName(state.name) + "|" + (on ? "1" : "0");
      var badge = badgeMarkers[opId];

      if (!badge) {
        badge = new google.maps.Marker({
          map: map,
          position: pos,
          icon: badgeIcon(state.name, on),
          clickable: false,
          zIndex: 45,
          optimized: false
        });
        badge._badgeKey = key;
        badgeMarkers[opId] = badge;
        return;
      }

      badge.setPosition(pos);
      if (badge._badgeKey !== key) {
        badge.setIcon(badgeIcon(state.name, on));
        badge._badgeKey = key;
      }
    }

    // ——— Pins inicio / destino ———

    function pinIcon(fill, label) {
      var c = document.createElement("canvas");
      c.width = 64; c.height = 80;
      var ctx = c.getContext("2d");
      ctx.translate(32, 28);
      ctx.beginPath();
      ctx.moveTo(0, 28);
      ctx.bezierCurveTo(-18, 10, -18, -8, 0, -18);
      ctx.bezierCurveTo(18, -8, 18, 10, 0, 28);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -2, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      if (label) {
        ctx.font = "800 11px system-ui,sans-serif";
        ctx.fillStyle = "#0B1F1A";
        ctx.textAlign = "center";
        ctx.fillText(label, 0, 42);
      }
      return {
        url: c.toDataURL("image/png"),
        scaledSize: new google.maps.Size(32, 40),
        anchor: new google.maps.Point(16, 36)
      };
    }

    // ——— Rutas por operador activo ———

    function clearRouteLayer(opId) {
      var layer = routeLayers[opId];
      if (!layer) return;
      if (layer.renderer) layer.renderer.setMap(null);
      if (layer.startMarker) layer.startMarker.setMap(null);
      if (layer.destMarker) layer.destMarker.setMap(null);
      delete routeLayers[opId];
    }

    function upsertRoute(opId, origin, dest, localName) {
      var color = routeColor(opId);
      var key = origin.lat.toFixed(5) + "," + origin.lng.toFixed(5) + ">" + dest.lat.toFixed(5) + "," + dest.lng.toFixed(5);
      var layer = routeLayers[opId];

      if (!layer) {
        layer = {
          key: "",
          renderer: new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true,
            preserveViewport: true,
            polylineOptions: {
              strokeColor: color,
              strokeWeight: 5,
              strokeOpacity: 0.88,
              zIndex: 4
            }
          }),
          startMarker: new google.maps.Marker({
            map: map,
            position: origin,
            icon: pinIcon("#0B5340"),
            title: "Inicio",
            zIndex: 8
          }),
          destMarker: new google.maps.Marker({
            map: map,
            position: dest,
            icon: pinIcon("#B42318"),
            title: localName || "Destino",
            zIndex: 9
          })
        };
        var startInfo = new google.maps.InfoWindow({ content: "<b>Inicio</b><br/>Punto de partida" });
        var destInfo = new google.maps.InfoWindow({
          content: "<b>Destino</b><br/>" + (localName || "Local")
        });
        layer.startMarker.addListener("click", function () {
          startInfo.open({ map: map, anchor: layer.startMarker });
        });
        layer.destMarker.addListener("click", function () {
          destInfo.open({ map: map, anchor: layer.destMarker });
        });
        routeLayers[opId] = layer;
      }

      layer.startMarker.setPosition(origin);
      layer.destMarker.setPosition(dest);
      layer.destMarker.setTitle(localName || "Destino");

      if (layer.key === key) return;
      layer.key = key;

      directions.route({
        origin: origin,
        destination: dest,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        }
      }, function (result, status) {
        if (status === "OK" && routeLayers[opId] === layer) {
          layer.renderer.setDirections(result);
        }
      });
    }

    function syncRoutes(ops, stops) {
      var keep = {};
      ops.forEach(function (op) {
        if (op.estado !== "activo") {
          delete routeOrigins[op.id];
          return;
        }
        var stop = stops.find(function (s) { return s.operatorId === op.id; });
        if (!stop) {
          delete routeOrigins[op.id];
          return;
        }
        keep[op.id] = true;
        if (!routeOrigins[op.id]) {
          routeOrigins[op.id] = { lat: op.lat, lng: op.lng };
        }
        upsertRoute(
          op.id,
          routeOrigins[op.id],
          { lat: stop.lat, lng: stop.lng },
          stop.name
        );
      });

      Object.keys(routeLayers).forEach(function (id) {
        if (!keep[id]) {
          clearRouteLayer(id);
          delete routeOrigins[id];
        }
      });
    }

    // ——— Mi ubicación (admin) ———

    function myLocationIcon() {
      var c = document.createElement("canvas");
      c.width = 56;
      c.height = 56;
      var ctx = c.getContext("2d");

      ctx.beginPath();
      ctx.arc(28, 28, 16, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(26,115,232,0.18)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(28, 28, 11, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "rgba(0,0,0,0.28)";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 1;
      ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.beginPath();
      ctx.arc(28, 28, 7, 0, Math.PI * 2);
      ctx.fillStyle = MY_BLUE;
      ctx.fill();

      return {
        url: c.toDataURL("image/png"),
        scaledSize: new google.maps.Size(28, 28),
        anchor: new google.maps.Point(14, 14)
      };
    }

    window.showMyLocation = function (lat, lng, accuracy, pan) {
      if (!map) return;
      var pos = { lat: Number(lat), lng: Number(lng) };
      if (!isFinite(pos.lat) || !isFinite(pos.lng)) return;
      var radius = Math.max(8, Number(accuracy) || 12);

      if (!myCircle) {
        myCircle = new google.maps.Circle({
          map: map,
          center: pos,
          radius: radius,
          strokeColor: MY_BLUE,
          strokeOpacity: 0.32,
          strokeWeight: 1,
          fillColor: MY_BLUE,
          fillOpacity: 0.14,
          clickable: false,
          zIndex: 2
        });
      } else {
        myCircle.setCenter(pos);
        myCircle.setRadius(radius);
      }

      if (!myMarker) {
        myMarker = new google.maps.Marker({
          map: map,
          position: pos,
          icon: myLocationIcon(),
          clickable: false,
          zIndex: 95,
          optimized: false,
          title: "Mi ubicación"
        });
      } else {
        myMarker.setPosition(pos);
      }

      if (pan !== false) {
        map.panTo(pos);
        if (map.getZoom() < 15) map.setZoom(16);
      }
    };

    // ——— Operadores / animación ———

    function paintOperator(marker, state) {
      var on = state.estado === "activo";
      var color = on ? COLORS.route : COLORS.line;
      if (marker._vanColor !== color) {
        marker.setIcon(Car3D.icon(color));
        marker._vanColor = color;
      }
      marker.setPosition({ lat: state.lat, lng: state.lng });
      marker.setOptions({ rotation: Car3D.mapRotation(state.heading || 0) });
      marker.setTitle(state.name);
      marker.infoHtml = "<b>" + (state.name || "Operador") + "</b><br/>"
        + (on ? "En ruta" : "En línea") + " · " + Math.round(state.speed || 0) + " km/h";
      paintBadge(state.id != null ? state.id : marker._opId, state);
    }

    window.__onVanArtReady = function () {
      Object.keys(operatorMarkers).forEach(function (id) {
        var marker = operatorMarkers[id];
        var mot = motion[id];
        var on = mot && mot.estado === "activo";
        var color = on ? COLORS.route : COLORS.line;
        marker.setIcon(Car3D.icon(color));
        marker._vanColor = color;
      });
    };

    function tickMotion(now) {
      var active = false;
      Object.keys(motion).forEach(function (id) {
        var m = motion[id];
        var marker = operatorMarkers[id];
        if (!m || !marker) return;
        var t = Math.min(1, (now - m.startedAt) / m.duration);
        var e = easeOutCubic(t);
        var state = {
          id: Number(id),
          lat: lerp(m.from.lat, m.to.lat, e),
          lng: lerp(m.from.lng, m.to.lng, e),
          heading: lerpAngle(m.fromHeading, m.toHeading, e),
          name: m.name,
          speed: m.speed,
          estado: m.estado
        };
        paintOperator(marker, state);
        if (t < 1) active = true;
        else {
          m.from = { lat: m.to.lat, lng: m.to.lng };
          m.fromHeading = m.toHeading;
        }
      });
      rafId = active ? requestAnimationFrame(tickMotion) : 0;
    }

    function ensureAnim() {
      if (!rafId) rafId = requestAnimationFrame(tickMotion);
    }

    function upsertOperator(op) {
      var target = { lat: op.lat, lng: op.lng };
      var on = op.estado === "activo";
      var existing = motion[op.id];
      var heading = existing ? existing.toHeading : 0;

      if (existing) {
        var dLat = target.lat - existing.to.lat;
        var dLng = target.lng - existing.to.lng;
        if ((dLat * dLat + dLng * dLng) > MOVE_EPS) heading = bearing(existing.to, target);
      } else if (operatorMarkers[op.id]) {
        var cur = operatorMarkers[op.id].getPosition();
        if (cur) {
          var prev = { lat: cur.lat(), lng: cur.lng() };
          var dLat2 = target.lat - prev.lat;
          var dLng2 = target.lng - prev.lng;
          if ((dLat2 * dLat2 + dLng2 * dLng2) > MOVE_EPS) heading = bearing(prev, target);
        }
      }

      if (!operatorMarkers[op.id]) {
        var color0 = on ? COLORS.route : COLORS.line;
        var marker = new google.maps.Marker({
          map: map,
          position: target,
          icon: Car3D.icon(color0),
          title: op.name,
          flat: true,
          rotation: Car3D.mapRotation(heading),
          zIndex: 30,
          optimized: false
        });
        marker._vanColor = color0;
        marker._opId = op.id;
        marker.infoHtml = "";
        var info = new google.maps.InfoWindow();
        marker.addListener("click", function () {
          info.setContent(marker.infoHtml);
          info.open({ map: map, anchor: marker });
        });
        operatorMarkers[op.id] = marker;
        motion[op.id] = {
          from: target, to: target,
          fromHeading: heading, toHeading: heading,
          startedAt: performance.now(), duration: 1,
          name: op.name, speed: op.speed, estado: op.estado
        };
        paintOperator(marker, {
          id: op.id, lat: target.lat, lng: target.lng,
          heading: heading, name: op.name, speed: op.speed, estado: op.estado
        });
        return;
      }

      var m = motion[op.id];
      var markerPos = operatorMarkers[op.id].getPosition();
      var from = markerPos ? { lat: markerPos.lat(), lng: markerPos.lng() } : target;
      var fromHeading = heading;
      if (m) {
        var elapsed = performance.now() - m.startedAt;
        var tLive = Math.min(1, elapsed / Math.max(1, m.duration));
        fromHeading = lerpAngle(m.fromHeading, m.toHeading, easeOutCubic(tLive));
      }

      motion[op.id] = {
        from: from, to: target,
        fromHeading: fromHeading, toHeading: heading,
        startedAt: performance.now(), duration: ANIM_MS,
        name: op.name, speed: op.speed, estado: op.estado
      };
      ensureAnim();
    }

    function headingFromEvent(event) {
      if (!event) return null;
      if (typeof event.webkitCompassHeading === "number") return event.webkitCompassHeading;
      if (typeof event.alpha !== "number") return null;
      return (360 - event.alpha + 360) % 360;
    }

    function paintCompassRose(heading) {
      var rose = document.getElementById("compassRose");
      if (!rose) return;
      rose.classList.toggle("on", compassOn);
      rose.style.transform = "rotate(" + (-Number(heading || 0)) + "deg)";
    }

    function applyMapHeading(heading) {
      if (!map || !compassOn || heading == null || isNaN(heading)) return;
      var next = (Number(heading) + 360) % 360;
      if (Math.abs(next - lastMapHeading) < 2) return;
      lastMapHeading = next;
      if (map.setHeading) map.setHeading(next);
      if (map.setTilt) map.setTilt(35);
      paintCompassRose(next);
    }

    function bindDeviceCompass() {
      if (compassBound) return;
      compassBound = true;
      var onOrient = function (event) {
        var heading = headingFromEvent(event);
        if (heading == null) return;
        deviceHeading = heading;
        applyMapHeading(heading);
      };
      window.addEventListener("deviceorientationabsolute", onOrient, true);
      window.addEventListener("deviceorientation", onOrient, true);
    }

    function setCompass(on) {
      compassOn = Boolean(on);
      bindDeviceCompass();
      paintCompassRose(lastMapHeading);
      if (!compassOn) {
        lastMapHeading = 0;
        if (map && map.setHeading) map.setHeading(0);
        if (map && map.setTilt) map.setTilt(0);
        return;
      }
      if (deviceHeading != null) applyMapHeading(deviceHeading);
    }

    function maybeFit(ops) {
      var key = ops.map(function (op) { return String(op.id); }).sort().join(",");
      if (!ops.length) {
        lastFittedKey = "";
        if (!didFit) map.setCenter(LIMA);
        return;
      }
      if (didFit && key === lastFittedKey) return;
      lastFittedKey = key;
      didFit = true;
      if (ops.length === 1) {
        map.panTo({ lat: ops[0].lat, lng: ops[0].lng });
        map.setZoom(15);
        return;
      }
      var bounds = new google.maps.LatLngBounds();
      ops.forEach(function (op) { bounds.extend({ lat: op.lat, lng: op.lng }); });
      Object.keys(routeLayers).forEach(function (id) {
        var layer = routeLayers[id];
        if (layer.startMarker) bounds.extend(layer.startMarker.getPosition());
        if (layer.destMarker) bounds.extend(layer.destMarker.getPosition());
      });
      map.fitBounds(bounds, 56);
    }

    window.updateLiveMap = function (data) {
      if (!map) {
        pending = data;
        return;
      }

      var ops = data.operators || [];
      var stops = data.stops || [];
      var focus = ops.find(function (op) { return op.id === data.selectedId; }) || null;
      var keepOps = {};

      ops.forEach(function (op) {
        keepOps[op.id] = true;
        upsertOperator(op);
      });

      prune(operatorMarkers, keepOps, function (id) {
        delete motion[id];
      });
      prune(badgeMarkers, keepOps);
      syncRoutes(ops, stops);

      if (focus) {
        map.panTo({ lat: focus.lat, lng: focus.lng });
        if (!compassOn) map.setZoom(15);
        var mot = motion[focus.id];
        if (compassOn && deviceHeading == null && mot) applyMapHeading(mot.toHeading);
      } else {
        maybeFit(ops);
      }
    };

    window.initBioclimMap = function () {
      map = new google.maps.Map(document.getElementById("map"), {
        center: LIMA,
        zoom: 12,
        disableDefaultUI: true,
        gestureHandling: "greedy",
        heading: 0,
        tilt: 0,
        rotateControl: false,
        styles: STYLE,
        clickableIcons: false
      });
      traffic = new google.maps.TrafficLayer();
      directions = new google.maps.DirectionsService();

      window.runMapCmd = function (action) {
        if (action === "traffic") traffic.setMap(traffic.getMap() ? null : map);
        if (action === "satellite") map.setMapTypeId(map.getMapTypeId() === "hybrid" ? "roadmap" : "hybrid");
        if (action === "compass") setCompass(!compassOn);
        if (action === "compassOn") setCompass(true);
        if (action === "compassOff") setCompass(false);
      };

      window.addEventListener("message", function (event) {
        if (!event.data) return;
        if (event.data.type === "live") window.updateLiveMap(event.data);
        if (event.data.type === "cmd") window.runMapCmd(event.data.action);
        if (event.data.type === "locate") {
          window.showMyLocation(event.data.lat, event.data.lng, event.data.accuracy, event.data.pan);
        }
      });

      if (pending) {
        window.updateLiveMap(pending);
        pending = null;
      }
    };
  `;
}
