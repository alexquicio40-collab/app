import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

type CertificadosStatsProps = {
  pendientes: number;
  emitidos: number;
  esteMes: number;
};

export function CertificadosStats({ pendientes, emitidos, esteMes }: CertificadosStatsProps) {
  return (
    <View style={styles.wrap}>
      <Stat label="Pendientes" value={String(pendientes)} tone="warn" />
      <Stat label="Emitidos" value={String(emitidos)} tone="accent" />
      <Stat label="Este mes" value={String(esteMes)} tone="gold" />
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
  tone: "warn" | "accent" | "gold";
}) {
  const color =
    tone === "warn"
      ? theme.colors.warn
      : tone === "gold"
        ? theme.colors.gold
        : theme.colors.accent;

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
    marginBottom: 2,
    padding: 10,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    gap: 4,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  value: { fontSize: 18, fontWeight: "900" },
  label: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
