import { theme } from "@/lib/theme";
import { StyleSheet, Text, TextInput, View } from "react-native";

type OperadoresSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onlineLabel: string;
  live: boolean;
};

export function OperadoresSearchBar({
  value,
  onChange,
  onlineLabel,
  live,
}: OperadoresSearchBarProps) {
  return (
    <View style={styles.wrap}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Buscar operador…"
        placeholderTextColor={theme.colors.muted}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <View style={styles.badge}>
        <View style={[styles.dot, live ? styles.dotLive : styles.dotOff]} />
        <Text style={styles.badgeText}>{onlineLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: theme.colors.accentDeep,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  dot: { width: 8, height: 8, borderRadius: 8 },
  dotLive: { backgroundColor: "#6FCF97" },
  dotOff: { backgroundColor: "#E0C98A" },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
});
