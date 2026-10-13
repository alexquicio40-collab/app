import { useEffect, useRef, useState } from "react";
import type { AdminCoords } from "./admin-location";
import { isBetterOrStableFix, watchPreciseFix, type PreciseFix } from "./precise-location";

/** Posición actual en vivo. Sin GPS no inventa un punto. */
export function useMyLocation(enabled = true) {
  const [coords, setCoords] = useState<AdminCoords | null>(null);
  const lastRef = useRef<PreciseFix | null>(null);

  useEffect(() => {
    if (!enabled) {
      lastRef.current = null;
      setCoords(null);
      return;
    }

    let cancel = false;
    let remove: (() => void) | null = null;

    void watchPreciseFix((fix) => {
      if (cancel) return;
      if (!isBetterOrStableFix(lastRef.current, fix)) return;
      lastRef.current = fix;
      setCoords({ lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy });
    })
      .then((handle) => {
        if (cancel) {
          handle.remove();
          return;
        }
        remove = handle.remove;
      })
      .catch(() => {
        // El mapa sigue sin el punto si el permiso o el GPS fallan.
      });

    return () => {
      cancel = true;
      remove?.();
    };
  }, [enabled]);

  return coords;
}
