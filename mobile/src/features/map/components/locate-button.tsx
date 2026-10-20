import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

type LocateButtonProps = {
  loading?: boolean;
  active?: boolean;
  label?: string;
  onPress: () => void;
};

const BLUE = "#1A73E8";
const INK = "#5F6368";

/** FAB circular estilo Google Maps. */
export function LocateButton({
  loading = false,
  active = false,
  label = "Ubicarme",
  onPress,
}: LocateButtonProps) {
  const color = active ? BLUE : INK;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading, selected: active }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed ? styles.pressed : null]}
    >
      <View style={styles.inner}>
        {loading ? <ActivityIndicator size="small" color={BLUE} /> : <LocationGlyph color={color} />}
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#202124",
    shadowOpacity: 0.22,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
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
