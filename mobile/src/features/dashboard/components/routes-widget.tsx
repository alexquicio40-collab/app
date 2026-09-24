import type { DashboardSummary } from "@/features/dashboard/types";
import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

const PARTS = [
  { key: "recolectadas", label: "Recolectadas", color: theme.colors.accent },
  { key: "enCurso", label: "En curso", color: theme.colors.info },
  { key: "programadas", label: "Programadas", color: theme.colors.warn },
] as const;

export function RoutesWidget({ rutasHoy }: { rutasHoy: DashboardSummary["rutasHoy"] }) {
  const total = rutasHoy.programadas + rutasHoy.enCurso + rutasHoy.recolectadas;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View>
          <Text style={styles.kicker}>Operación del día</Text>
          <Text style={styles.title}>Rutas de hoy</Text>
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.total}>{total}</Text>
          <Text style={styles.totalLabel}>asignadas</Text>
        </View>
      </View>

      <View style={styles.stack}>
        {PARTS.map((part) => {
          const value = rutasHoy[part.key];
          return (
            <View
              key={part.key}
              style={[
                styles.seg,
                {
                  flex: total === 0 ? 1 : Math.max(value, 0.18),
                  backgroundColor: part.color,
                  opacity: total === 0 ? 0.28 : 1,
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.pills}>
        {PARTS.map((part) => (
          <View key={part.key} style={styles.pill}>
            <View style={[styles.dot, { backgroundColor: part.color }]} />
            <Text style={styles.pillValue}>{rutasHoy[part.key]}</Text>
            <Text style={styles.pillLabel}>{part.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 16,
    gap: 14,
    shadowColor: "#083D30",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kicker: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  totalBox: {
    alignItems: "flex-end",
  },
  total: {
    color: theme.colors.ink,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  totalLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  stack: {
    flexDirection: "row",
    height: 18,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: theme.colors.cream,
    gap: 3,
  },
  seg: {
    borderRadius: 10,
    minWidth: 10,
  },
  pills: {
    flexDirection: "row",
    gap: 8,
  },
  pill: {
    flex: 1,
    backgroundColor: theme.colors.cream,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
  },
  pillValue: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  pillLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
});
