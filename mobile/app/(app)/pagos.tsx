import { PagoComprobanteUploadSheet } from "@/features/pagos/components/pago-comprobante-upload-sheet";
import { PagoComprobanteViewer } from "@/features/pagos/components/pago-comprobante-viewer";
import { PagoHojaCard } from "@/features/pagos/components/pago-hoja-card";
import { PagoHojaDetailSheet } from "@/features/pagos/components/pago-hoja-detail-sheet";
import { PagosStats } from "@/features/pagos/components/pagos-stats";
import { PagosTabs } from "@/features/pagos/components/pagos-tabs";
import { PagosToolbar } from "@/features/pagos/components/pagos-toolbar";
import { usePagosScreen } from "@/features/pagos/hooks";
import { theme } from "@/lib/theme";
import { ScreenHeader } from "@/ui/screen-header";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function PagosScreen() {
  const screen = usePagosScreen();
  const bottomPad = useContentBottomPad(12);
  const data = screen.tab === "pendientes" ? screen.pendientes : screen.historial;
  const tabTotal =
    screen.tab === "pendientes" ? screen.pendientesTotal : screen.historialTotal;

  const renderItem = useCallback(
    ({ item }: { item: (typeof data)[number] }) => (
      <PagoHojaCard item={item} onOpen={() => void screen.openDetail(item)} />
    ),
    [screen],
  );

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Pagos" compact />

      <PagosStats
        rutas={screen.stats.rutas}
        conComp={screen.stats.conComp}
        pendientes={screen.stats.pendientes}
        total={screen.stats.total}
      />

      <PagosTabs
        tab={screen.tab}
        pendientes={screen.pendientesTotal}
        historial={screen.historialTotal}
        onChange={screen.setTab}
      />

      <PagosToolbar
        filters={screen.filters}
        visible={data.length}
        total={tabTotal}
        hasFilters={screen.hasFilters}
        onChange={screen.patchFilters}
        onClear={screen.clearFilters}
      />

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
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 24 }]}
          refreshControl={
            <RefreshControl
              refreshing={screen.refreshing}
              onRefresh={() => void screen.reload()}
              tintColor={theme.colors.accent}
            />
          }
          ListEmptyComponent={
            <Empty
              title={screen.tab === "pendientes" ? "Sin pendientes" : "Sin historial"}
              text={
                screen.hasFilters
                  ? "Prueba limpiar los filtros"
                  : screen.tab === "pendientes"
                    ? "Todas las rutas tienen comprobante"
                    : "Aún no hay rutas con comprobantes"
              }
              onClear={screen.hasFilters ? screen.clearFilters : undefined}
            />
          }
        />
      )}

      <PagoHojaDetailSheet
        item={screen.detail}
        comprobantes={screen.comprobantes}
        loading={screen.compsLoading}
        canMutate={screen.canMutate}
        onClose={screen.closeDetail}
        onUpload={screen.openUpload}
        onView={screen.openViewer}
        onDelete={(comp) => void screen.removeComprobante(comp)}
      />

      <PagoComprobanteUploadSheet
        open={screen.uploadOpen}
        hoja={screen.detail}
        saving={screen.mutating}
        onClose={screen.closeUpload}
        onSubmit={screen.submitUpload}
      />

      <PagoComprobanteViewer
        item={screen.viewer}
        canDelete={screen.canMutate}
        onClose={screen.closeViewer}
        onDelete={
          screen.viewer ? () => void screen.removeComprobante(screen.viewer!) : undefined
        }
      />
    </View>
  );
}

function Empty({
  title,
  text,
  onClear,
}: {
  title: string;
  text: string;
  onClear?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {onClear ? (
        <Pressable onPress={onClear} style={styles.retry}>
          <Text style={styles.retryText}>Limpiar filtros</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  list: { paddingTop: 8, flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
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
    paddingTop: 48,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 18,
  },
});
