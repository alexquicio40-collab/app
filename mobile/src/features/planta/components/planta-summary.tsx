import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

type PlantaSummaryProps = {
  count: number;
  litros: number;
  baldes: number;
  galoneras: number;
};

export function PlantaSummary({ count, litros, baldes, galoneras }: PlantaSummaryProps) {
  return (
    <View style={styles.wrap}>
      <Stat label="Registros" value={String(count)} tone="ink" />
      <Stat label="Litros" value={String(litros)} tone="accent" />
      <Stat label="Baldes" value={String(baldes)} tone="info" />
      <Stat label="Galoneras" value={String(galoneras)} tone="gold" />
    </View>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ink" | "accent" | "info" | "gold";
}) {
  const color =
    tone === "accent"
      ? theme.colors.accent
      : tone === "info"
        ? theme.colors.info
        : tone === "gold"
          ? theme.colors.gold
          : theme.colors.ink;

  return (
    <View style={styles.stat}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    marginHorizontal: 10,
    marginTop: 8,
    marginBottom: 4,
    padding: 10,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    gap: 4,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  value: { fontSize: 16, fontWeight: "900" },
  label: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
