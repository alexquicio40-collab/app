import { HORIZON_SMOOTHER_JS } from "./heading-smooth";

/**
 * Leaflet 1.9 + teselas ráster. Google Maps JS en WebView Android
 * parte las teselas (software) o mata el proceso (WebGL) a ~1 min.
 * MAPS_RASTER_OPTION debe ser una propiedad JS válida (un comentario solo
 * dejaba una coma suelta y el mapa no arrancaba).
 */
export const MAPS_RASTER_OPTION = "renderingType: google.maps.RenderingType.RASTER";

export const MAP_WEBVIEW_BASE = "https://unpkg.com";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_JS_FB = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_ROTATE_JS = "https://unpkg.com/leaflet-rotate@0.2.8/dist/leaflet-rotate.js";
const LEAFLET_ROTATE_FB = "https://cdn.jsdelivr.net/npm/leaflet-rotate@0.2.8/dist/leaflet-rotate.js";

const MAPS_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "AIzaSyCj1xJNYLv2E45yrRRNPAi-BBTfp_L01z0";

/** Directions en web (no WebView). */
export function mapsJsSrc(key: string, callback?: string, libraries?: string) {
  const q = new URLSearchParams({ key, v: "3.63" });
  if (libraries) q.set("libraries", libraries);
  if (callback) q.set("callback", callback);
  return `https://maps.googleapis.com/maps/api/js?${q.toString()}`;
}

export function leafletHead() {
  return `<link rel="stylesheet" href="${LEAFLET_CSS}"/>
<style>
  html, body, #map, .leaflet-container { height: 100%; width: 100%; margin: 0; background: #E7EEEB; }
  .gm-label { background: #fff; border: 1px solid #D2DDD8; border-radius: 6px; padding: 1px 6px; font: 700 11px system-ui, sans-serif; color: #14261F; box-shadow: 0 1px 3px rgba(0,0,0,.12); }
  #boot {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    color: #5C6B67; font: 700 13px system-ui, sans-serif; z-index: 2; pointer-events: none;
  }
  #boot.hide { display: none; }
</style>`;
}

const SHIM = `
window.google = window.google || {};
google.maps = google.maps || {};
google.maps.RenderingType = { RASTER: "RASTER", VECTOR: "VECTOR" };
google.maps.MapTypeId = { ROADMAP: "roadmap", SATELLITE: "satellite", HYBRID: "hybrid", TERRAIN: "terrain" };
google.maps.SymbolPath = { CIRCLE: "CIRCLE", FORWARD_CLOSED_ARROW: "FORWARD_CLOSED_ARROW" };
google.maps.TravelMode = { DRIVING: "DRIVING" };
google.maps.TrafficModel = { BEST_GUESS: "bestguess" };

function gmLL(p) {
  if (!p) return null;
  if (typeof p.lat === "function") return L.latLng(p.lat(), p.lng());
  if (p.lat != null && p.lng != null) return L.latLng(Number(p.lat), Number(p.lng));
  return null;
}

google.maps.LatLng = function (lat, lng) {
  this._lat = Number(lat);
  this._lng = Number(lng);
};
google.maps.LatLng.prototype.lat = function () { return this._lat; };
google.maps.LatLng.prototype.lng = function () { return this._lng; };

google.maps.Size = function (w, h) { this.width = w; this.height = h; };
google.maps.Point = function (x, y) { this.x = x; this.y = y; };

google.maps.LatLngBounds = function () { this._pts = []; };
google.maps.LatLngBounds.prototype.extend = function (p) {
  var ll = gmLL(p);
  if (ll) this._pts.push(ll);
};
google.maps.LatLngBounds.prototype.isEmpty = function () { return this._pts.length === 0; };
google.maps.LatLngBounds.prototype._box = function () {
  return this._pts.length ? L.latLngBounds(this._pts) : null;
};

function gmIcon(icon, rotation) {
  if (!icon) return undefined;
  if (icon.url) {
    var w = icon.scaledSize ? icon.scaledSize.width : 36;
    var h = icon.scaledSize ? icon.scaledSize.height : 45;
    var ax = icon.anchor ? icon.anchor.x : w / 2;
    var ay = icon.anchor ? icon.anchor.y : h;
    return L.icon({ iconUrl: icon.url, iconSize: [w, h], iconAnchor: [ax, ay] });
  }
  if (icon.path === google.maps.SymbolPath.FORWARD_CLOSED_ARROW || icon.path === "FORWARD_CLOSED_ARROW") {
    var fillA = icon.fillColor || "#0B5340";
    return L.divIcon({
      className: "",
      html: '<div data-spin style="width:28px;height:28px;display:flex;align-items:center;justify-content:center">' +
        '<svg width="22" height="22" viewBox="0 0 22 22">' +
        '<path d="M11 2.2 L18.2 19.4 L11 15.6 L3.8 19.4 Z" fill="' + fillA + '" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>' +
        '</svg></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  }
  if (icon.path === google.maps.SymbolPath.CIRCLE || icon.path === "CIRCLE") {
    var r = Number(icon.scale || 8);
    var sw = Number(icon.strokeWeight || 3);
    var size = Math.round(r * 2 + sw * 2);
    var fill = icon.fillColor || "#1A73E8";
    var stroke = icon.strokeColor || "#fff";
    return L.divIcon({
      className: "",
      html: '<div style="width:' + size + "px;height:" + size + "px;border-radius:50%;background:" + fill + ";border:" + sw + "px solid " + stroke + ';"></div>',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }
  return undefined;
}

google.maps.Marker = function (opts) {
  opts = opts || {};
  this._icon = opts.icon;
  this._rotation = opts.rotation || (opts.icon && opts.icon.rotation) || 0;
  this._spinable = opts.rotation != null || (opts.icon && opts.icon.rotation != null);
  this._listeners = {};
  var self = this;
  this._marker = L.marker(gmLL(opts.position) || [0, 0], {
    icon: gmIcon(opts.icon, this._rotation) || new L.Icon.Default(),
    draggable: !!opts.draggable,
    title: opts.title || "",
    zIndexOffset: opts.zIndex || 0,
    interactive: opts.clickable !== false
  });
  this._marker.on("click", function () {
    (self._listeners.click || []).forEach(function (fn) { fn(); });
  });
  this._marker.on("dragend", function () {
    (self._listeners.dragend || []).forEach(function (fn) { fn(); });
  });
  this._marker.on("add", function () { self._spin(); });
  if (opts.label) this.setLabel(opts.label);
  if (opts.map) this.setMap(opts.map);
};
google.maps.Marker.prototype._spin = function () {
  if (!this._spinable) return;
  var el = this._marker.getElement && this._marker.getElement();
  if (!el) return;
  var spin = el.querySelector("[data-spin]") || el.querySelector("img");
  if (!spin || spin === el) return;
  spin.style.transform = "rotate(" + (this._rotation || 0) + "deg)";
  spin.style.transformOrigin = "center center";
};
google.maps.Marker.prototype.setMap = function (map) {
  if (this._map && this._map._L) this._map._L.removeLayer(this._marker);
  this._map = map;
  if (map && map._L) {
    this._marker.addTo(map._L);
    this._spin();
  }
};
google.maps.Marker.prototype.setPosition = function (p) {
  var ll = gmLL(p);
  if (ll) this._marker.setLatLng(ll);
};
google.maps.Marker.prototype.getPosition = function () {
  var ll = this._marker.getLatLng();
  return new google.maps.LatLng(ll.lat, ll.lng);
};
google.maps.Marker.prototype.setIcon = function (icon) {
  this._icon = icon;
  if (icon && icon.rotation != null) this._rotation = icon.rotation;
  var next = gmIcon(icon, this._rotation);
  if (next) this._marker.setIcon(next);
  this._spin();
};
google.maps.Marker.prototype.getIcon = function () { return this._icon || {}; };
google.maps.Marker.prototype.setTitle = function (t) { this._marker.options.title = t || ""; };
google.maps.Marker.prototype.setZIndex = function (z) { this._marker.setZIndexOffset(z || 0); };
google.maps.Marker.prototype.setOptions = function (opts) {
  if (!opts) return;
  if (opts.rotation != null) { this._spinable = true; this._rotation = opts.rotation; this._spin(); }
  if (opts.zIndex != null) this.setZIndex(opts.zIndex);
  if (opts.icon) this.setIcon(opts.icon);
};
google.maps.Marker.prototype.setLabel = function (label) {
  var text = typeof label === "string" ? label : (label && label.text) || "";
  if (this._marker.getTooltip()) this._marker.unbindTooltip();
  if (text) {
    this._marker.bindTooltip(text, { permanent: true, direction: "bottom", offset: [0, 14], className: "gm-label" });
  }
};
google.maps.Marker.prototype.addListener = function (ev, fn) {
  this._listeners[ev] = this._listeners[ev] || [];
  this._listeners[ev].push(fn);
};

google.maps.Circle = function (opts) {
  opts = opts || {};
  this._circle = L.circle(gmLL(opts.center) || [0, 0], {
    radius: opts.radius || 12,
    color: opts.strokeColor || "#1A73E8",
    opacity: opts.strokeOpacity == null ? 0.3 : opts.strokeOpacity,
    weight: opts.strokeWeight || 1,
    fillColor: opts.fillColor || "#1A73E8",
    fillOpacity: opts.fillOpacity == null ? 0.12 : opts.fillOpacity,
    interactive: false
  });
  if (opts.map) this.setMap(opts.map);
};
google.maps.Circle.prototype.setMap = function (map) {
  if (this._map && this._map._L) this._map._L.removeLayer(this._circle);
  this._map = map;
  if (map && map._L) this._circle.addTo(map._L);
};
google.maps.Circle.prototype.setCenter = function (p) {
  var ll = gmLL(p);
  if (ll) this._circle.setLatLng(ll);
};
google.maps.Circle.prototype.setRadius = function (r) { this._circle.setRadius(r); };

google.maps.Polyline = function (opts) {
  opts = opts || {};
  this._listeners = {};
  this._line = L.polyline((opts.path || []).map(gmLL).filter(Boolean), {
    color: opts.strokeColor || "#1976D2",
    weight: opts.strokeWeight || 4,
    opacity: opts.strokeOpacity == null ? 1 : opts.strokeOpacity,
    interactive: opts.clickable !== false
  });
  var self = this;
  this._line.on("click", function () {
    (self._listeners.click || []).forEach(function (fn) { fn(); });
  });
  if (opts.map) this.setMap(opts.map);
};
google.maps.Polyline.prototype.setMap = function (map) {
  if (this._map && this._map._L) this._map._L.removeLayer(this._line);
  this._map = map;
  if (map && map._L) this._line.addTo(map._L);
};
google.maps.Polyline.prototype.setPath = function (path) {
  this._line.setLatLngs((path || []).map(gmLL).filter(Boolean));
};
google.maps.Polyline.prototype.addListener = function (ev, fn) {
  this._listeners[ev] = this._listeners[ev] || [];
  this._listeners[ev].push(fn);
};

google.maps.InfoWindow = function (opts) {
  this._html = (opts && opts.content) || "";
  this._popup = L.popup();
};
google.maps.InfoWindow.prototype.setContent = function (html) { this._html = html; };
google.maps.InfoWindow.prototype.open = function (opts) {
  opts = opts || {};
  var anchor = opts.anchor;
  if (!anchor || !anchor._marker) return;
  this._popup.setContent(this._html || "");
  anchor._marker.bindPopup(this._popup).openPopup();
};
google.maps.InfoWindow.prototype.close = function () {
  if (this._popup) this._popup.remove();
};

google.maps.TrafficLayer = function () { this._on = null; };
google.maps.TrafficLayer.prototype.setMap = function (map) { this._on = map || null; };
google.maps.TrafficLayer.prototype.getMap = function () { return this._on; };

google.maps.DirectionsRenderer = function (opts) {
  this._opts = opts || {};
  this._map = opts && opts.map;
  this._line = null;
};
google.maps.DirectionsRenderer.prototype.setMap = function (map) {
  this._map = map;
  if (!map && this._line) this._line.setMap(null);
};
google.maps.DirectionsRenderer.prototype.setDirections = function (result) {
  var path = (result && result.routes && result.routes[0] && result.routes[0].overview_path) || [];
  if (this._line) this._line.setMap(null);
  var po = this._opts.polylineOptions || {};
  this._line = new google.maps.Polyline({
    path: path,
    strokeColor: po.strokeColor || "#0B5340",
    strokeWeight: po.strokeWeight || 5,
    strokeOpacity: po.strokeOpacity == null ? 0.88 : po.strokeOpacity,
    map: this._map
  });
};

function gmDecodePoly(encoded) {
  var coords = [];
  if (!encoded) return coords;
  var index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    var result = 0, shift = 0, b;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    result = 0; shift = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return coords;
}
function gmJoinPath(out, part) {
  if (!part || !part.length) return;
  if (out.length && part[0] && Math.abs(out[out.length - 1].lat - part[0].lat) < 1e-6 &&
      Math.abs(out[out.length - 1].lng - part[0].lng) < 1e-6) {
    for (var i = 1; i < part.length; i++) out.push(part[i]);
    return;
  }
  for (var j = 0; j < part.length; j++) out.push(part[j]);
}
google.maps.DirectionsService = function () {};
google.maps.DirectionsService.prototype.route = function (req, cb) {
  var o = gmLL(req.origin);
  var d = gmLL(req.destination);
  if (!o || !d) { cb(null, "NOT_FOUND"); return; }
  var url = "https://maps.googleapis.com/maps/api/directions/json" +
    "?origin=" + encodeURIComponent(o.lat + "," + o.lng) +
    "&destination=" + encodeURIComponent(d.lat + "," + d.lng) +
    "&mode=driving&region=pe&overview=full&avoid=ferries&alternatives=false" +
    "&key=" + encodeURIComponent(${JSON.stringify(MAPS_KEY)});
  fetch(url).then(function (r) { return r.json(); }).then(function (data) {
    if (!data || data.status !== "OK" || !data.routes || !data.routes[0]) {
      cb(null, (data && data.status) || "ZERO_RESULTS");
      return;
    }
    var path = [];
    var route = data.routes[0];
    (route.legs || []).forEach(function (leg) {
      (leg.steps || []).forEach(function (step) {
        gmJoinPath(path, gmDecodePoly(step.polyline && step.polyline.points));
      });
    });
    if (path.length < 2) path = gmDecodePoly(route.overview_polyline && route.overview_polyline.points);
    if (path.length < 2) { cb(null, "ZERO_RESULTS"); return; }
    cb({ routes: [{ overview_path: path }] }, "OK");
  }).catch(function () { cb(null, "UNKNOWN_ERROR"); });
};

google.maps.OverlayView = function () {};
google.maps.OverlayView.prototype.setMap = function (map) {
  var self = this;
  if (this._move) {
    try { this._map && this._map._L && this._map._L.off("move zoom", this._move); } catch (e) {}
    this._move = null;
  }
  if (this.onRemove && this._map) this.onRemove();
  this._map = map;
  if (!map || !map._L) return;
  this.getPanes = function () {
    return { overlayMouseTarget: map._L.getContainer() };
  };
  this.getProjection = function () {
    return {
      fromLatLngToDivPixel: function (latLng) {
        var p = map._L.latLngToContainerPoint(gmLL(latLng));
        return { x: p.x, y: p.y };
      }
    };
  };
  if (this.onAdd) this.onAdd();
  if (this.draw) this.draw();
  this._move = function () { if (self.draw) self.draw(); };
  map._L.on("move zoom", this._move);
};

google.maps.Map = function (el, opts) {
  opts = opts || {};
  var center = gmLL(opts.center) || L.latLng(-12.0464, -77.0428);
  this._road = L.tileLayer("https://mt{s}.google.com/vt/lyrs=m&hl=es&x={x}&y={y}&z={z}", {
    maxZoom: 20,
    subdomains: "0123"
  });
  this._sat = L.tileLayer("https://mt{s}.google.com/vt/lyrs=y&hl=es&x={x}&y={y}&z={z}", {
    maxZoom: 20,
    subdomains: "0123"
  });
  var mapOpts = {
    center: center,
    zoom: opts.zoom || 12,
    zoomControl: !opts.disableDefaultUI && opts.zoomControl !== false,
    attributionControl: false
  };
  this._L = L.map(el, mapOpts);
  this._heading = 0;
  this._tilt = 0;
  this._road.addTo(this._L);
  var self = this;
  var boot = document.getElementById("boot");
  if (boot) boot.className = "hide";
  this._type = "roadmap";
  this._listeners = {};
  this._L.on("click", function (e) {
    var ev = { latLng: new google.maps.LatLng(e.latlng.lat, e.latlng.lng) };
    (self._listeners.click || []).forEach(function (fn) { fn(ev); });
  });
  this._L.on("dragstart", function () {
    (self._listeners.dragstart || []).forEach(function (fn) { fn(); });
  });
  setTimeout(function () { self._L.invalidateSize(); }, 60);
  setTimeout(function () { self._L.invalidateSize(); }, 400);
};
google.maps.Map.prototype.setCenter = function (p) {
  var ll = gmLL(p);
  if (ll) this._L.setView(ll, this._L.getZoom());
};
google.maps.Map.prototype.panTo = function (p) {
  var ll = gmLL(p);
  if (ll) this._L.panTo(ll);
};
google.maps.Map.prototype.setZoom = function (z) { this._L.setZoom(z); };
google.maps.Map.prototype.getZoom = function () { return this._L.getZoom(); };
google.maps.Map.prototype.fitBounds = function (bounds, pad) {
  var box = bounds && bounds._box ? bounds._box() : null;
  if (!box || !box.isValid()) return;
  if (pad && typeof pad === "object") {
    this._L.fitBounds(box, {
      paddingTopLeft: [pad.left || 24, pad.top || 24],
      paddingBottomRight: [pad.right || 24, pad.bottom || 24]
    });
    return;
  }
  var n = Number(pad) || 48;
  this._L.fitBounds(box, { padding: [n, n] });
};
google.maps.Map.prototype.addListener = function (ev, fn) {
  this._listeners[ev] = this._listeners[ev] || [];
  this._listeners[ev].push(fn);
};
google.maps.Map.prototype.setMapTypeId = function (id) {
  this._type = id;
  if (id === "hybrid" || id === "satellite") {
    if (this._L.hasLayer(this._road)) this._L.removeLayer(this._road);
    this._sat.addTo(this._L);
  } else {
    if (this._L.hasLayer(this._sat)) this._L.removeLayer(this._sat);
    this._road.addTo(this._L);
  }
};
google.maps.Map.prototype.getMapTypeId = function () { return this._type; };
google.maps.Map.prototype.setHeading = function (deg) {
  // No rotar teselas en el WebView: CSS rotate las deja en blanco en Android.
  this._heading = ((Number(deg) || 0) + 360) % 360;
};
google.maps.Map.prototype.getHeading = function () { return this._heading || 0; };
google.maps.Map.prototype.setTilt = function (deg) {
  // Sin rotateX en el contenedor: en WebView Android las teselas quedan en verde.
  this._tilt = Math.max(0, Math.min(67, Number(deg) || 0));
};
google.maps.Map.prototype.getTilt = function () { return this._tilt || 0; };
google.maps.Map.prototype.moveCamera = function (cam) {
  cam = cam || {};
  if (cam.tilt != null) this.setTilt(cam.tilt);
  if (cam.heading != null) this.setHeading(cam.heading);
  if (cam.center && cam.zoom != null) {
    var ll = gmLL(cam.center);
    if (ll) this._L.setView(ll, cam.zoom, { animate: !cam.snap });
    return;
  }
  if (cam.center) {
    if (cam.snap) this.setCenter(cam.center);
    else this.panTo(cam.center);
  }
  if (cam.zoom != null) this.setZoom(cam.zoom);
};

google.maps.event = {
  addListener: function (target, ev, fn) {
    if (target && target.addListener) return target.addListener(ev, fn);
    if (target && target._listeners) {
      target._listeners[ev] = target._listeners[ev] || [];
      target._listeners[ev].push(fn);
    }
  }
};
`;

export function leafletStart(callback: string) {
  return `<script>
(function () {
  function fail(msg) {
    var boot = document.getElementById("boot");
    if (boot) { boot.className = ""; boot.textContent = msg || "Error al cargar el mapa"; }
  }
  function addScript(src, onDone) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = function () { onDone(false); };
    s.onerror = function () { onDone(true); };
    document.head.appendChild(s);
  }
  function start() {
    if (!window.L) { fail("Error al cargar el mapa"); return; }
    if (L.Icon && L.Icon.Default) {
      L.Icon.Default.imagePath = "https://unpkg.com/leaflet@1.9.4/dist/images/";
    }
    ${SHIM}
    ${HORIZON_SMOOTHER_JS}
    try { ${callback}(); } catch (err) {
      fail("Error al iniciar el mapa");
      console.error(err);
    }
  }
  function loadRotate() {
    addScript("${LEAFLET_ROTATE_JS}", function (err) {
      if (err) addScript("${LEAFLET_ROTATE_FB}", function () { start(); });
      else start();
    });
  }
  addScript("${LEAFLET_JS}", function (err) {
    if (err || !window.L) addScript("${LEAFLET_JS_FB}", function (err2) {
      if (err2 || !window.L) { fail("Error al cargar el mapa"); return; }
      loadRotate();
    });
    else loadRotate();
  });
})();
</script>`;
}

export function leafletDynamicBoot(bootFn: string) {
  return `function __bootLeaflet(cb) {
      if (window.L && window.google && window.google.maps && window.google.maps.Map) { cb(); return; }
      if (!document.querySelector('link[data-leaflet]')) {
        var l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = '${LEAFLET_CSS}';
        l.setAttribute('data-leaflet', '1');
        document.head.appendChild(l);
      }
      var s = document.createElement('script');
      s.src = '${LEAFLET_JS}';
      s.onload = function () {
        var r = document.createElement('script');
        r.src = '${LEAFLET_ROTATE_JS}';
        r.onload = r.onerror = function () {
          if (!window.google || !window.google.maps || !window.google.maps.Map) {
            ${SHIM}
            ${HORIZON_SMOOTHER_JS}
          }
          cb();
        };
        document.head.appendChild(r);
      };
      s.onerror = function () {
        var boot = document.getElementById('boot');
        if (boot) boot.textContent = 'Error al cargar el mapa';
      };
      document.head.appendChild(s);
    }
    __bootLeaflet(${bootFn});`;
}
