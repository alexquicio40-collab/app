import { BIOCLIM_LOGO_DATA_URL } from "./logo-data";

/**
 * Furgoneta 3D sólida (runtime WebView).
 *
 * Regla de oro:
 * - El vehículo es un SÓLIDO RÍGIDO: un PNG isométrico fijo por color.
 * - El rumbo NO regenera ni deforma la malla.
 * - Solo rota el marker en el plano del mapa (`flat` + `setRotation`),
 *   igual que `car_marker.png` en la app Flutter.
 * - Resultado: en una curva nunca aparecen llantas en el techo.
 */
export const CAR_3D_SCRIPT = `
var Car3D = (function () {
  // ——— Cámara fija (isométrica). No depende del rumbo. ———
  var SIZE = 180;
  var SCALE = 6.2;
  var ISO_X = Math.cos(Math.PI / 6);
  var ISO_Y = Math.sin(Math.PI / 6);
  var VIEW_YAW = -0.55; // vista ¾ fija del sólido

  var cache = {};
  var canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  var ctx = canvas.getContext("2d");

  var logoReady = false;
  var logoImg = new Image();
  logoImg.onload = function () {
    logoReady = true;
    cache = {};
    if (typeof window.__onVanArtReady === "function") window.__onVanArtReady();
  };
  logoImg.src = ${JSON.stringify(BIOCLIM_LOGO_DATA_URL)};

  function shade(hex, n) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var v = parseInt(h, 16);
    var r = Math.max(0, Math.min(255, (v >> 16) + n));
    var g = Math.max(0, Math.min(255, ((v >> 8) & 255) + n));
    var b = Math.max(0, Math.min(255, (v & 255) + n));
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  /** Mundo: X ancho, Y adelante, Z arriba. Z↑ siempre sube en pantalla. */
  function project(x, y, z) {
    var c = Math.cos(VIEW_YAW);
    var s = Math.sin(VIEW_YAW);
    var xr = x * c - y * s;
    var yr = x * s + y * c;
    return {
      x: SIZE / 2 + (xr - yr) * ISO_X * SCALE,
      y: SIZE / 2 + 44 + (xr + yr) * ISO_Y * SCALE - z * SCALE,
      d: (xr + yr) * ISO_Y + z * 0.35
    };
  }

  function depthOf(pts) {
    var d = 0;
    for (var i = 0; i < pts.length; i++) d += pts[i].d;
    return d / pts.length;
  }

  function fillPoly(pts, fill, stroke, width) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width || 1;
      ctx.stroke();
    }
  }

  function fillOval(x, y, rx, ry, rot, fill, stroke) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.scale(rx, ry);
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.restore();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 0.9; ctx.stroke(); }
  }

  function makeBox(x0, x1, y0, y1, z0, z1, pal, isCargoRoof) {
    var p = [
      project(x0, y0, z0), project(x1, y0, z0),
      project(x1, y1, z0), project(x0, y1, z0),
      project(x0, y0, z1), project(x1, y0, z1),
      project(x1, y1, z1), project(x0, y1, z1)
    ];
    return [
      { type: "face", pts: [p[0], p[1], p[2], p[3]], fill: pal.bottom },
      { type: "face", pts: [p[4], p[5], p[6], p[7]], fill: pal.top, roof: !!isCargoRoof },
      { type: "face", pts: [p[0], p[1], p[5], p[4]], fill: pal.sideA },
      { type: "face", pts: [p[3], p[2], p[6], p[7]], fill: pal.sideB },
      { type: "face", pts: [p[1], p[2], p[6], p[5]], fill: pal.front },
      { type: "face", pts: [p[0], p[3], p[7], p[4]], fill: pal.back }
    ];
  }

  function makePalette(color) {
    return {
      cargo: {
        top: shade(color, 40), bottom: shade(color, -68),
        sideA: shade(color, -26), sideB: shade(color, 16),
        front: shade(color, 24), back: shade(color, -38)
      },
      cabin: {
        top: shade(color, 48), bottom: shade(color, -56),
        sideA: shade(color, -14), sideB: shade(color, 22),
        front: shade(color, 28), back: shade(color, -20)
      }
    };
  }

  function drawRoofLogo(pts) {
    if (!logoReady || !pts) return;
    var cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
    var cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4;
    var dx = (pts[1].x - pts[0].x + pts[2].x - pts[3].x) / 2;
    var dy = (pts[1].y - pts[0].y + pts[2].y - pts[3].y) / 2;
    var ang = Math.atan2(dy, dx);
    var w = Math.sqrt(dx * dx + dy * dy) * 0.7;
    var h = w * 0.7;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.strokeStyle = "rgba(10,40,32,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 3, -h / 2);
    ctx.arcTo(w / 2, -h / 2, w / 2, h / 2, 3);
    ctx.arcTo(w / 2, h / 2, -w / 2, h / 2, 3);
    ctx.arcTo(-w / 2, h / 2, -w / 2, -h / 2, 3);
    ctx.arcTo(-w / 2, -h / 2, w / 2, -h / 2, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.drawImage(logoImg, -w * 0.4, -h * 0.4, w * 0.8, h * 0.8);
    ctx.restore();
  }

  function drawShadow() {
    ctx.save();
    ctx.translate(SIZE / 2, SIZE / 2 + 58);
    ctx.scale(1, 0.36);
    var g = ctx.createRadialGradient(0, 0, 2, 0, 0, 42);
    g.addColorStop(0, "rgba(8,30,24,0.4)");
    g.addColorStop(1, "rgba(8,30,24,0)");
    fillOval(0, 0, 42, 24, 0, g, null);
    ctx.restore();
  }

  function drawWheel(p) {
    fillOval(p.x, p.y, 4.3, 2.6, 0.12, "#101820", "rgba(255,255,255,0.25)");
    fillOval(p.x, p.y, 2.2, 1.35, 0.12, "#F5C518", null);
    fillOval(p.x, p.y, 0.85, 0.55, 0.12, "#1A2430", null);
  }

  /** Render único del sólido (independiente del rumbo). */
  function renderSolid(color) {
    var key = color + (logoReady ? "|L" : "|0");
    if (cache[key]) return cache[key];

    ctx.clearRect(0, 0, SIZE, SIZE);
    var pal = makePalette(color);
    drawShadow();

    var parts = []
      .concat(makeBox(-2.7, 2.7, -5.8, 2.3, 1.15, 5.35, pal.cargo, true))
      .concat(makeBox(-2.5, 2.5, 1.9, 5.55, 1.15, 4.0, pal.cabin, false));

    parts.push({
      type: "face", glass: true,
      pts: [project(-2, 5.3, 2.05), project(2, 5.3, 2.05), project(2, 5.3, 3.65), project(-2, 5.3, 3.65)],
      fill: "rgba(198,232,255,0.92)"
    });
    parts.push({
      type: "face", glass: true,
      pts: [project(-2.52, 2.35, 2.2), project(-2.52, 5.05, 2.2), project(-2.52, 5.05, 3.55), project(-2.52, 2.35, 3.55)],
      fill: "rgba(168,214,240,0.5)"
    });
    parts.push({
      type: "face", glass: true,
      pts: [project(2.52, 2.35, 2.2), project(2.52, 5.05, 2.2), project(2.52, 5.05, 3.55), project(2.52, 2.35, 3.55)],
      fill: "rgba(168,214,240,0.5)"
    });
    parts.push({
      type: "face",
      pts: [project(-2.72, -5.3, 1.75), project(-2.72, 2.0, 1.75), project(-2.72, 2.0, 2.4), project(-2.72, -5.3, 2.4)],
      fill: "#E8A317"
    });
    parts.push({
      type: "face",
      pts: [project(2.72, -5.3, 1.75), project(2.72, 2.0, 1.75), project(2.72, 2.0, 2.4), project(2.72, -5.3, 2.4)],
      fill: "#E8A317"
    });

    // Ruedas en el suelo (z bajo), dentro del mismo sort → nunca “en el techo”.
    var wheelXYZ = [[-2.95, -3.5, 0.55], [2.95, -3.5, 0.55], [-2.95, 2.7, 0.55], [2.95, 2.7, 0.55]];
    for (var w = 0; w < wheelXYZ.length; w++) {
      var wp = project(wheelXYZ[w][0], wheelXYZ[w][1], wheelXYZ[w][2]);
      parts.push({ type: "wheel", p: wp, d: wp.d });
    }

    parts.push({ type: "light", p: project(-1.4, 5.6, 1.7), fill: "#FFE566", d: project(-1.4, 5.6, 1.7).d });
    parts.push({ type: "light", p: project(1.4, 5.6, 1.7), fill: "#FFE566", d: project(1.4, 5.6, 1.7).d });
    parts.push({ type: "light", p: project(-1.65, -5.85, 2.25), fill: "#FF5A4A", d: project(-1.65, -5.85, 2.25).d });
    parts.push({ type: "light", p: project(1.65, -5.85, 2.25), fill: "#FF5A4A", d: project(1.65, -5.85, 2.25).d });

    parts.sort(function (a, b) {
      var da = a.d != null ? a.d : depthOf(a.pts);
      var db = b.d != null ? b.d : depthOf(b.pts);
      return da - db;
    });

    for (var i = 0; i < parts.length; i++) {
      var item = parts[i];
      if (item.type === "wheel") {
        drawWheel(item.p);
        continue;
      }
      if (item.type === "light") {
        fillOval(item.p.x, item.p.y, 2.5, 1.85, 0, item.fill, null);
        continue;
      }
      fillPoly(
        item.pts,
        item.fill,
        item.glass ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
        item.glass ? 1 : 0.65
      );
      if (item.roof) drawRoofLogo(item.pts);
    }

    var url = canvas.toDataURL("image/png");
    cache[key] = url;
    return url;
  }

  /** Icono sólido. El rumbo NO entra aquí. */
  function icon(color) {
    return {
      url: renderSolid(color),
      scaledSize: new google.maps.Size(76, 76),
      anchor: new google.maps.Point(38, 48)
    };
  }

  /** Rumbo geográfico → rotación del marker (arte mira ~este). */
  function mapRotation(headingDeg) {
    return ((headingDeg - 90) + 360) % 360;
  }

  return { icon: icon, mapRotation: mapRotation };
})();
`;
