import { Pressable, StyleSheet, Text, View } from "react-native";

type CompassButtonProps = {
  active?: boolean;
  heading?: number;
  onPress: () => void;
};

const RED = "#D93025";
const INK = "#5F6368";

/** Brújula estilo Google Maps: la aguja apunta al norte según la cámara. */
export function CompassButton({ active = false, heading = 0, onPress }: CompassButtonProps) {
  const deg = Number.isFinite(heading) ? heading : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Norte arriba"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed ? styles.pressed : null]}
    >
      <View style={[styles.glyph, { transform: [{ rotate: `${-deg}deg` }] }]}>
        <Text style={[styles.n, active ? styles.nOn : null]}>N</Text>
        <View style={[styles.needle, active ? styles.needleOn : null]} />
      </View>
    </Pressable>
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
  glyph: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  n: {
    position: "absolute",
    top: -1,
    color: INK,
    fontSize: 8,
    fontWeight: "800",
  },
  nOn: { color: RED },
  needle: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: INK,
    marginTop: 4,
  },
  needleOn: {
    borderBottomColor: RED,
  },
});
