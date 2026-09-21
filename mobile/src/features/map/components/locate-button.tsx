import { theme } from "@/lib/theme";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

type LocateButtonProps = {
  loading?: boolean;
  active?: boolean;
  onPress: () => void;
};

/**
 * FAB estilo Google Maps: centra el mapa en la ubicación del administrador.
 * Icono dibujado con Views (sin dependencia de vector-icons).
 */
export function LocateButton({ loading = false, active = false, onPress }: LocateButtonProps) {
  const color = active ? "#1A73E8" : theme.colors.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Mi ubicación"
      accessibilityState={{ busy: loading, selected: active }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed ? styles.pressed : null, active ? styles.active : null]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.info} />
        ) : (
          <LocationGlyph color={color} />
        )}
      </View>
    </Pressable>
  );
}

function LocationGlyph({ color }: { color: string }) {
  return (
    <View style={styles.glyph}>
      <View style={[styles.tick, styles.tickN, { backgroundColor: color }]} />
      <View style={[styles.tick, styles.tickS, { backgroundColor: color }]} />
      <View style={[styles.tick, styles.tickE, { backgroundColor: color }]} />
      <View style={[styles.tick, styles.tickW, { backgroundColor: color }]} />
      <View style={[styles.ring, { borderColor: color }]} />
      <View style={[styles.core, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B1F1A",
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  active: {
    borderColor: "#1A73E8",
  },
  inner: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.2,
  },
  core: {
    width: 4.5,
    height: 4.5,
    borderRadius: 3,
  },
  tick: {
    position: "absolute",
    borderRadius: 1,
  },
  tickN: { top: 0, width: 2, height: 4 },
  tickS: { bottom: 0, width: 2, height: 4 },
  tickE: { right: 0, width: 4, height: 2 },
  tickW: { left: 0, width: 4, height: 2 },
});
