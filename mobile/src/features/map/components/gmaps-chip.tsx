import { Pressable, StyleSheet, Text, View } from "react-native";

type GmapsChipKind = "locate" | "center";

type GmapsChipProps = {
  kind: GmapsChipKind;
  onPress: () => void;
};

const BLUE = "#1A73E8";
const INK = "#3C4043";

/** Chip flotante tipo Google Maps (Recenter / Mi ubicación). */
export function GmapsChip({ kind, onPress }: GmapsChipProps) {
  const locate = kind === "locate";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={locate ? "Ubicarme" : "Centrar ruta"}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed ? styles.pressed : null]}
    >
      {locate ? <LocateGlyph /> : <CenterGlyph />}
      <Text style={styles.label}>{locate ? "Ubicarme" : "Centrar"}</Text>
    </Pressable>
  );
}

function LocateGlyph() {
  return (
    <View style={styles.glyph}>
      <View style={[styles.tick, styles.tickN]} />
      <View style={[styles.tick, styles.tickS]} />
      <View style={[styles.tick, styles.tickE]} />
      <View style={[styles.tick, styles.tickW]} />
      <View style={styles.ring} />
      <View style={styles.core} />
    </View>
  );
}

function CenterGlyph() {
  return (
    <View style={styles.glyph}>
      <View style={[styles.corner, styles.tl]} />
      <View style={[styles.corner, styles.tr]} />
      <View style={[styles.corner, styles.bl]} />
      <View style={[styles.corner, styles.br]} />
      <View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minWidth: 122,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#202124",
    shadowOpacity: 0.22,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  label: {
    color: INK,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.15,
  },
  glyph: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: BLUE,
  },
  core: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: BLUE,
  },
  tick: {
    position: "absolute",
    backgroundColor: BLUE,
    borderRadius: 1,
  },
  tickN: { top: 0, width: 1.8, height: 3.5 },
  tickS: { bottom: 0, width: 1.8, height: 3.5 },
  tickE: { right: 0, width: 3.5, height: 1.8 },
  tickW: { left: 0, width: 3.5, height: 1.8 },
  corner: {
    position: "absolute",
    width: 6,
    height: 6,
    borderColor: BLUE,
  },
  tl: { top: 1, left: 1, borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: 1, right: 1, borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: 1, left: 1, borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: 1, right: 1, borderBottomWidth: 2, borderRightWidth: 2 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: BLUE,
  },
});
