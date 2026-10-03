type Listener = () => void;

let listener: Listener | null = null;
let fired = false;

export function setSessionClosedHandler(fn: Listener | null) {
  listener = fn;
}

export function emitSessionClosed() {
  if (fired) return;
  fired = true;
  listener?.();
}

export function resetSessionClosed() {
  fired = false;
}
