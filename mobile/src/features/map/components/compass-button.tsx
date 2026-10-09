import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

type CompassButtonProps = {
  active?: boolean;
  onPress: () => void;
};

export function CompassButton({ active = false, onPress }: CompassButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Brújula del mapa"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        pressed ? styles.pressed : null,
        active ? styles.active : null,
      ]}
    >
      <View style={styles.glyph}>
        <Text style={[styles.n, active ? styles.nOn : null]}>N</Text>
        <View style={[styles.needle, active ? styles.needleOn : null]} />
      </View>
    </Pressable>
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
    borderColor: "#B42318",
    backgroundColor: "#FFF6F5",
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
    color: theme.colors.accent,
    fontSize: 8,
    fontWeight: "800",
  },
  nOn: { color: "#B42318" },
  needle: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: theme.colors.accent,
    marginTop: 4,
  },
  needleOn: {
    borderBottomColor: "#B42318",
  },
});
