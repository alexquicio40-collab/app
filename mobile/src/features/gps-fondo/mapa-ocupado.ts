type Listener = (ocupado: boolean) => void;

let count = 0;
const listeners = new Set<Listener>();

export function mapaOcupado() {
  return count > 0;
}

/** Un mapa visible. El GPS de fondo se pausa hasta que salgan todos. */
export function entrarMapa() {
  count += 1;
  if (count === 1) listeners.forEach((fn) => fn(true));
}

export function salirMapa() {
  count = Math.max(0, count - 1);
  if (count === 0) listeners.forEach((fn) => fn(false));
}

export function onMapaOcupado(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
