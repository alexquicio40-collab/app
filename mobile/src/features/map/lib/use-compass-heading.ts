import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { HEADING_DEADZONE_DEG, HEADING_SAMPLE_MS, headingDelta, wrapHeading } from "./heading-smooth";

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
    let lastEmit = 0;
    let lastValue: number | null = null;
    let preferTrue = false;

    const apply = (value: number) => {
      if (cancelled || !Number.isFinite(value)) return;
      const next = wrapHeading(value);
      const now = Date.now();
      if (lastValue != null) {
        const delta = headingDelta(lastValue, next);
        if (delta < HEADING_DEADZONE_DEG) return;
        if (delta < 14 && now - lastEmit < HEADING_SAMPLE_MS) return;
      }
      lastEmit = now;
      lastValue = next;
      setHeading(next);
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
