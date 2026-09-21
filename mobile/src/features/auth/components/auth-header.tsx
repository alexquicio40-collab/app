import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.mark}>
        <View style={styles.pin} />
      </View>
      <Text style={styles.brand}>Ubicación</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  pin: {
    width: 12,
    height: 12,
    borderRadius: 12,
    backgroundColor: "#F4F1EA",
  },
  brand: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.ink,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 16,
    lineHeight: 22,
  },
});
