import { formatMoney } from "@/features/pagos/lib/format";
import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

type PagosStatsProps = {
  rutas: number;
  conComp: number;
  pendientes: number;
  total: number;
};

export function PagosStats({ rutas, conComp, pendientes, total }: PagosStatsProps) {
  return (
    <View style={styles.wrap}>
      <Stat label="Rutas" value={String(rutas)} tone="ink" />
      <Stat label="Con comp." value={String(conComp)} tone="accent" />
      <Stat label="Pendientes" value={String(pendientes)} tone="warn" />
      <Stat label="Total" value={formatMoney(total)} tone="gold" compact />
    </View>
  );
}

function Stat({
  label,
  value,
  tone,
  compact,
}: {
  label: string;
  value: string;
  tone: "ink" | "accent" | "warn" | "gold";
  compact?: boolean;
}) {
  const color =
    tone === "accent"
      ? theme.colors.accent
      : tone === "warn"
        ? theme.colors.warn
        : tone === "gold"
          ? theme.colors.gold
          : theme.colors.ink;

  return (
    <View style={styles.stat}>
      <Text style={[styles.value, { color, fontSize: compact ? 11 : 16 }]} numberOfLines={1}>
        {value}
      </Text>
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
  stat: { flex: 1, alignItems: "center", gap: 2, minWidth: 0 },
  value: { fontWeight: "900" },
  label: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
