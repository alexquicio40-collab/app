/** Giro mínimo (grados) para no reaccionar al temblor del magnetómetro. */
export const HEADING_DEADZONE_DEG = 6;
/** Un pico de vibración no gira el mapa; un giro real se confirma en milésimas. */
export const HEADING_HOLD_MS = 80;
/** Tope de samples hacia React / WebView (cadencia en milésimas). */
export const HEADING_SAMPLE_MS = 50;

export type CompassGate = {
  last: number | null;
  pending: number | null;
  pendingAt: number;
};

export const EMPTY_COMPASS_GATE: CompassGate = { last: null, pending: null, pendingAt: 0 };

/**
 * Publica un rumbo nuevo si se sostiene unos milisegundos.
 * Un pico que vuelve atrás no sale.
 */
export function acceptCompassHeading(gate: CompassGate, raw: number, now: number) {
  const value = wrapHeading(raw);
  if (gate.last == null) {
    return { gate: { last: value, pending: null, pendingAt: 0 }, emit: value as number | null };
  }
  if (headingDelta(gate.last, value) < HEADING_DEADZONE_DEG) {
    return { gate: { ...gate, pending: null, pendingAt: 0 }, emit: null as number | null };
  }
  if (gate.pending == null || headingDelta(gate.pending, value) > 10) {
    return { gate: { ...gate, pending: value, pendingAt: now }, emit: null as number | null };
  }
  if (now - gate.pendingAt < HEADING_HOLD_MS) {
    return { gate, emit: null as number | null };
  }
  return { gate: { last: value, pending: null, pendingAt: 0 }, emit: value as number | null };
}

export function wrapHeading(deg: number) {
  return ((deg % 360) + 360) % 360;
}

export function headingDelta(from: number, to: number) {
  return Math.abs(((to - from + 540) % 360) - 180);
}

/**
 * Interpolador del horizonte (estilo Google Maps).
 * El sensor solo actualiza el objetivo; el mapa gira en el frame.
 */
export const HORIZON_SMOOTHER_JS = `
function createHorizonSmoother(apply, opts) {
  opts = opts || {};
  var target = 0;
  var shown = 0;
  var raf = 0;
  var lastTs = 0;
  var TAU = opts.tau != null ? opts.tau : 0.16;
  var MAX_DEG_S = opts.maxDegS != null ? opts.maxDegS : 140;
  var DEAD = opts.deadzone != null ? opts.deadzone : 4;
  var SETTLE = opts.settle != null ? opts.settle : 0.35;
  var HOLD_MS = opts.holdMs != null ? opts.holdMs : 50;
  var pending = null;
  var pendingAt = 0;

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
    aim: function (deg, nowMs) {
      var next = wrap(deg);
      var now = nowMs != null ? nowMs : (typeof performance !== "undefined" ? performance.now() : Date.now());
      if (Math.abs(shortest(shown, next)) < DEAD) {
        pending = null;
        return;
      }
      if (pending == null || Math.abs(shortest(pending, next)) > 8) {
        pending = next;
        pendingAt = now;
        return;
      }
      if (now - pendingAt < HOLD_MS) return;
      pending = null;
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
