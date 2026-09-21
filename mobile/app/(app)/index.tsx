import { ActivityWidget } from "@/features/dashboard/components/activity-widget";
import { DashHeader } from "@/features/dashboard/components/dash-header";
import { KpiGrid } from "@/features/dashboard/components/kpi-grid";
import { LiveWidget } from "@/features/dashboard/components/live-widget";
import { RoutesWidget } from "@/features/dashboard/components/routes-widget";
import { useDashboard } from "@/features/dashboard/hooks";
import { theme } from "@/lib/theme";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

export default function DashboardScreen() {
  const { data, loading, reload } = useDashboard();

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor="#FFFFFF" />}
      >
        <DashHeader kpis={data.kpis} />
        <View style={styles.sheet}>
          <LiveWidget online={data.kpis.enLinea} operadores={data.kpis.operadores} />
          <RoutesWidget rutasHoy={data.rutasHoy} />
          <ActivityWidget actividad={data.actividad} />
          <KpiGrid kpis={data.kpis} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    paddingBottom: 108,
  },
  sheet: {
    marginTop: -22,
    paddingHorizontal: 14,
    gap: 12,
  },
});
