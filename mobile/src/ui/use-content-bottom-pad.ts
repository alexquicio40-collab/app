import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Altura aproximada del FloatingTabBar (sin el inset del sistema). */
export const FLOATING_TAB_HEIGHT = 68;

/**
 * Espacio inferior para que el contenido no quede bajo:
 * - la barra flotante de la app
 * - la barra de navegación / gestos del teléfono (Motorola, etc.)
 *
 * En Android forzamos un mínimo por si el inset llega en 0 con edge-to-edge.
 */
export function useContentBottomPad(extra = 16) {
  const insets = useSafeAreaInsets();
  const systemBottom =
    Platform.OS === "android" ? Math.max(insets.bottom, 24) : Math.max(insets.bottom, 0);
  const barLift = Math.max(systemBottom, 10);

  return FLOATING_TAB_HEIGHT + barLift + extra;
}
