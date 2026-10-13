/** Mínimo de giro (grados) para no reaccionar al temblor del magnetómetro. */
export const HEADING_DEADZONE_DEG = 4.5;
/** Tope de samples hacia React / WebView. */
export const HEADING_SAMPLE_MS = 140;

export function wrapHeading(deg: number) {
  return ((deg % 360) + 360) % 360;
}

export function headingDelta(from: number, to: number) {
  return Math.abs(((to - from + 540) % 360) - 180);
}

/**
 * Interpolador del horizonte (estilo Google Maps).
 * El sensor solo actualiza el objetivo; el mapa gira con inercia, no a cada tick.
 */
export const HORIZON_SMOOTHER_JS = `
function createHorizonSmoother(apply, opts) {
  opts = opts || {};
  var target = 0;
  var shown = 0;
  var raf = 0;
  var lastTs = 0;
  var TAU = opts.tau != null ? opts.tau : 0.62;
  var MAX_DEG_S = opts.maxDegS != null ? opts.maxDegS : 40;
  var DEAD = opts.deadzone != null ? opts.deadzone : 5;
  var SETTLE = opts.settle != null ? opts.settle : 0.4;

  function wrap(n) { return ((Number(n) % 360) + 360) % 360; }
  function shortest(from, to) { return ((to - from + 540) % 360) - 180; }

  function paint(deg) {
    if (typeof apply === "function") apply(wrap(deg));
  }

  function tick(ts) {
    if (!lastTs) lastTs = ts;
    var dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    var delta = shortest(shown, target);
    if (Math.abs(delta) <= SETTLE) {
      shown = target;
      paint(shown);
      raf = 0;
      lastTs = 0;
      return;
    }
    var step = delta * (1 - Math.exp(-dt / TAU));
    var cap = MAX_DEG_S * dt;
    if (step > cap) step = cap;
    if (step < -cap) step = -cap;
    shown = wrap(shown + step);
    paint(shown);
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (raf) return;
    lastTs = 0;
    raf = requestAnimationFrame(tick);
  }

  return {
    aim: function (deg) {
      var next = wrap(deg);
      if (Math.abs(shortest(target, next)) < DEAD && Math.abs(shortest(shown, next)) < DEAD) return;
      target = next;
      start();
    },
    snap: function (deg) {
      target = shown = wrap(deg);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      lastTs = 0;
      paint(shown);
    }
  };
}
`;
