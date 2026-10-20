import { useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  acceptCompassHeading,
  EMPTY_COMPASS_GATE,
  HEADING_SAMPLE_MS,
  wrapHeading,
  type CompassGate,
} from "./heading-smooth";

type OrientationCtor = {
  requestPermission?: () => Promise<"granted" | "denied">;
};

/** Safari / iOS exige el permiso en un gesto del usuario. */
export async function requestCompassPermission() {
  if (Platform.OS !== "web" || typeof window === "undefined") return true;
  const ctor = window.DeviceOrientationEvent as unknown as OrientationCtor | undefined;
  if (!ctor?.requestPermission) return true;
  try {
    return (await ctor.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

function headingFromWebEvent(event: DeviceOrientationEvent) {
  const webkit = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
  if (typeof webkit === "number" && Number.isFinite(webkit)) return wrapHeading(webkit);
  if (typeof event.alpha === "number" && Number.isFinite(event.alpha)) return wrapHeading(360 - event.alpha);
  return null;
}

/**
 * Rumbo del dispositivo (0 = norte).
 * Filtra temblor y limita la cadencia: el mapa interpola el resto.
 */
export function useCompassHeading(enabled: boolean) {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setHeading(null);
      return;
    }

    let cancelled = false;
    let remove: (() => void) | null = null;
    let gate: CompassGate = { ...EMPTY_COMPASS_GATE };
    let preferTrue = false;
    let lastEmit = 0;

    const apply = (value: number) => {
      if (cancelled || !Number.isFinite(value)) return;
      const now = Date.now();
      const step = acceptCompassHeading(gate, value, now);
      gate = step.gate;
      if (step.emit == null) return;
      if (lastEmit && now - lastEmit < HEADING_SAMPLE_MS) return;
      lastEmit = now;
      setHeading(step.emit);
    };

    if (Platform.OS === "web") {
      void requestCompassPermission().then((ok) => {
        if (!ok || cancelled) return;
        const onOrient = (event: DeviceOrientationEvent) => {
          const deg = headingFromWebEvent(event);
          if (deg != null) apply(deg);
        };
        window.addEventListener("deviceorientationabsolute", onOrient, true);
        window.addEventListener("deviceorientation", onOrient, true);
        remove = () => {
          window.removeEventListener("deviceorientationabsolute", onOrient, true);
          window.removeEventListener("deviceorientation", onOrient, true);
        };
      });
    } else {
      void import("expo-location")
        .then((Location) =>
          Location.watchHeadingAsync((data) => {
            const mag = data.magHeading;
            const tru = data.trueHeading;
            if (tru >= 0) preferTrue = true;
            const deg = preferTrue && tru >= 0 ? tru : mag;
            apply(deg);
          }),
        )
        .then((sub) => {
          if (cancelled) {
            sub.remove();
            return;
          }
          remove = () => sub.remove();
        })
        .catch(() => {
          // Sin brújula nativa el mapa sigue en norte arriba.
        });
    }

    return () => {
      cancelled = true;
      remove?.();
    };
  }, [enabled]);

  return heading;
}
