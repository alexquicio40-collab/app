import { useEffect, useState } from "react";
import { getAdminCoords, type AdminCoords } from "./admin-location";

/** Posición actual del usuario. Sin GPS no inventa un punto. */
export function useMyLocation(enabled = true) {
  const [coords, setCoords] = useState<AdminCoords | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCoords(null);
      return;
    }

    let cancel = false;
    const read = async () => {
      try {
        const next = await getAdminCoords();
        if (!cancel) setCoords(next);
      } catch {
        // El mapa sigue sin el punto si el permiso o el GPS fallan.
      }
    };

    void read();
    const timer = setInterval(() => void read(), 20000);
    return () => {
      cancel = true;
      clearInterval(timer);
    };
  }, [enabled]);

  return coords;
}
