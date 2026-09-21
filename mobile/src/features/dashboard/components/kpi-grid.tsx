import type { DashboardSummary } from "@/features/dashboard/types";
import { theme } from "@/lib/theme";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

export function KpiGrid({ kpis }: { kpis: DashboardSummary["kpis"] }) {
  return (
    <View style={styles.row}>
      <LinearGradient colors={["#083D30", "#0C5C49"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dark}>
        <Text style={styles.darkKicker}>Red comercial</Text>
        <Text style={styles.darkValue}>{kpis.locales}</Text>
        <Text style={styles.darkLabel}>Locales activos</Text>
        <View style={styles.spark}>
          {[8, 14, 10, 18, 12, 16].map((height, index) => (
            <View key={index} style={[styles.sparkBar, { height }]} />
          ))}
        </View>
      </LinearGradient>
      <View style={styles.card}>
        <Text style={styles.kicker}>Alertas</Text>
        <Text style={styles.value}>{kpis.certificados}</Text>
        <Text style={styles.label}>Certificados pendientes</Text>
        <View style={styles.warnTrack}>
          <View style={styles.warnFill} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 14,
    minHeight: 148,
    shadowColor: "#083D30",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  dark: {
    flex: 1,
    borderRadius: 22,
    padding: 14,
    minHeight: 148,
    overflow: "hidden",
  },
  darkKicker: {
    color: "#C9E8DC",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  darkValue: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -1,
    marginTop: 8,
  },
  darkLabel: {
    color: "#D7EDE5",
    fontSize: 13,
    marginTop: 2,
  },
  spark: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginTop: 16,
    height: 18,
  },
  sparkBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: "rgba(232,201,106,0.85)",
  },
  kicker: {
    color: theme.colors.warn,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  value: {
    color: theme.colors.ink,
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -1,
    marginTop: 8,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  warnTrack: {
    height: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.warnSoft,
    marginTop: 18,
    overflow: "hidden",
  },
  warnFill: {
    width: "28%",
    height: "100%",
    backgroundColor: theme.colors.warn,
    borderRadius: 6,
  },
});
