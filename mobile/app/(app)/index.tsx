import { AsesorInicioScreen } from "@/features/asesor-inicio";
import { ActivityWidget } from "@/features/dashboard/components/activity-widget";
import { RoleHeader } from "@/features/dashboard/components/role-header";
import { KpiGrid } from "@/features/dashboard/components/kpi-grid";
import { LiveWidget } from "@/features/dashboard/components/live-widget";
import { RoutesWidget } from "@/features/dashboard/components/routes-widget";
import { useDashboard } from "@/features/dashboard/hooks";
import { GerenciaDiaScreen } from "@/features/gerencia-dia";
import { OperadorInicioScreen } from "@/features/operador-inicio";
import { isAdministrador, isAsesor, usesOperadorInicio } from "@/lib/role-nav";
import { theme } from "@/lib/theme";
import { useAuth } from "@/providers/auth-provider";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

export default function DashboardScreen() {
  const { user } = useAuth();
  if (usesOperadorInicio(user?.rol)) return <OperadorInicioScreen />;
  if (isAdministrador(user?.rol)) return <GerenciaDiaScreen />;
  if (isAsesor(user?.rol)) return <AsesorInicioScreen />;
  return <AdminInicio />;
}

function AdminInicio() {
  const { data, loading, reload } = useDashboard();

  return (
    <View style={styles.safe}>
      <RoleHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor="#FFFFFF" />}
      >
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
    paddingTop: 8,
  },
  sheet: {
    paddingHorizontal: 14,
    gap: 12,
  },
});
