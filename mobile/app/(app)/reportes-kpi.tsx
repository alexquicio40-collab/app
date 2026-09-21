import { ReportContent } from "@/features/reportes-kpi/components/report-content";
import { ReportFiltersBar } from "@/features/reportes-kpi/components/report-filters-bar";
import { ReportPeriodChips } from "@/features/reportes-kpi/components/report-period-chips";
import { useReportesKpiScreen } from "@/features/reportes-kpi/hooks";
import { theme } from "@/lib/theme";
import { ScreenHeader } from "@/ui/screen-header";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ReportesKpiScreen() {
  const screen = useReportesKpiScreen();
  const bottomPad = useContentBottomPad(12);

  const hasData =
    screen.snapshot.rutas.total > 0 || screen.snapshot.plantaDetalle.length > 0;

  if (!screen.canAccess) {
    return (
      <View style={styles.safe}>
        <ScreenHeader title="Stats" compact />
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Sin acceso</Text>
          <Text style={styles.emptyText}>
            Este reporte está disponible para administrador y asesor.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Stats" compact />

      <ReportPeriodChips value={screen.filters.periodo} onChange={screen.setPeriodo} />

      <ReportFiltersBar
        filters={screen.filters}
        rangeLabel={screen.rangeLabel}
        conductores={screen.conductores}
        onPatchDates={screen.patchDates}
        onConductor={screen.setConductorId}
      />

      {screen.hint ? (
        <View style={styles.hintBanner}>
          <Text style={styles.hintText}>{screen.hint}</Text>
        </View>
      ) : null}

      {screen.loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : screen.error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{screen.error}</Text>
          <Pressable onPress={() => void screen.reload()} style={styles.retry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 28 }]}
          refreshControl={
            <RefreshControl
              refreshing={screen.refreshing}
              onRefresh={() => void screen.reload()}
              tintColor={theme.colors.accent}
            />
          }
        >
          {hasData ? (
            <ReportContent snapshot={screen.snapshot} rangeLabel={screen.rangeLabel} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Sin datos en el período</Text>
              <Text style={styles.emptyText}>
                {screen.filters.periodo === "dia"
                  ? "No hay rutas ni ingresos de planta hoy. Prueba Semana o Mes."
                  : "No hay rutas ni registros de planta en este período."}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { paddingTop: 2, flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  hintBanner: {
    marginHorizontal: 10,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.warnSoft,
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  hintText: {
    color: theme.colors.warn,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  retry: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
  },
  retryText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  empty: {
    paddingTop: 56,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18,
  },
});
