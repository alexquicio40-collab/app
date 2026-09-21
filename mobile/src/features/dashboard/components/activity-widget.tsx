import { buildWeek } from "@/features/dashboard/lib/week";
import type { DashboardSummary } from "@/features/dashboard/types";
import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

export function ActivityWidget({ actividad }: { actividad: DashboardSummary["actividad"] }) {
  const week = buildWeek(actividad);
  const max = Math.max(...week.map((item) => item.puntos), 1);
  const total = week.reduce((sum, item) => sum + item.puntos, 0);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View>
          <Text style={styles.kicker}>Tendencia</Text>
          <Text style={styles.title}>Actividad 7 días</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{total} pts</Text>
        </View>
      </View>

      <View style={styles.chart}>
        <View style={styles.grid}>
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
        </View>
        {week.map((item, index) => {
          const height = 16 + (item.puntos / max) * 92;
          const today = index === week.length - 1;
          return (
            <View key={item.key} style={styles.col}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.bar,
                    { height },
                    today ? styles.barToday : null,
                    item.puntos === 0 ? styles.barEmpty : null,
                  ]}
                />
              </View>
              <Text style={[styles.day, today ? styles.dayToday : null]}>{item.label}</Text>
            </View>
          );
        })}
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
    alignItems: "flex-end",
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
  badge: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 136,
    gap: 7,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-evenly",
    paddingBottom: 22,
  },
  gridLine: {
    height: 1,
    backgroundColor: "#E3EBE7",
  },
  col: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    zIndex: 1,
  },
  track: {
    width: "100%",
    height: 110,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "68%",
    borderRadius: 9,
    backgroundColor: theme.colors.accent,
  },
  barToday: {
    backgroundColor: theme.colors.gold,
  },
  barEmpty: {
    backgroundColor: "#D5E3DD",
  },
  day: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  dayToday: {
    color: theme.colors.ink,
  },
});
