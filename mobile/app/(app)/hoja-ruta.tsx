import { HistorialFiltersBar } from "@/features/hoja-ruta/components/historial-filters-bar";
import { HistorialHojaCard } from "@/features/hoja-ruta/components/historial-hoja-card";
import { HojaCierreSection } from "@/features/hoja-ruta/components/hoja-cierre-section";
import { HojaGastosSection } from "@/features/hoja-ruta/components/hoja-gastos-section";
import { HojaHeaderCard } from "@/features/hoja-ruta/components/hoja-header-card";
import { HojaLocalPicker } from "@/features/hoja-ruta/components/hoja-local-picker";
import { HojaLocalRow } from "@/features/hoja-ruta/components/hoja-local-row";
import { HojaRutaTabs } from "@/features/hoja-ruta/components/hoja-ruta-tabs";
import { useHistorialHr } from "@/features/hoja-ruta/hooks-historial";
import { useHojaRutaScreen } from "@/features/hoja-ruta/hooks";
import type { HojaRutaTab } from "@/features/hoja-ruta/types";
import { theme } from "@/lib/theme";
import { HeaderAction, IconClear } from "@/ui/header-action";
import { ScreenHeader } from "@/ui/screen-header";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { useCallback, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function HojaRutaScreen() {
  const [tab, setTab] = useState<HojaRutaTab>("nueva");
  const screen = useHojaRutaScreen();
  const historial = useHistorialHr(tab === "historial");
  const bottomPad = useContentBottomPad(12);

  const renderHistorial = useCallback(
    ({ item }: { item: (typeof historial.items)[number] }) => (
      <HistorialHojaCard
        item={item}
        busy={historial.busyId === item.id}
        onPdf={() => void historial.regenerarPdf(item)}
        onDelete={() => historial.remove(item)}
      />
    ),
    [historial],
  );

  if (!screen.canAccess) {
    return (
      <View style={styles.safe}>
        <ScreenHeader title="Hoja ruta" compact />
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Sin acceso</Text>
          <Text style={styles.emptyText}>Este módulo está pensado para el operador.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Hoja ruta"
        compact
        trailing={
          tab === "nueva" ? (
            <HeaderAction
              label="Limpiar"
              icon={<IconClear color="#FFFFFF" />}
              onPress={screen.clearAll}
              compact
            />
          ) : null
        }
      />

      <HojaRutaTabs
        tab={tab}
        historialCount={historial.items.length}
        onChange={setTab}
      />

      {tab === "nueva" ? (
        <NuevaPanel screen={screen} bottomPad={bottomPad} />
      ) : (
        <HistorialPanel historial={historial} bottomPad={bottomPad} renderItem={renderHistorial} />
      )}
    </View>
  );
}

function NuevaPanel({
  screen,
  bottomPad,
}: {
  screen: ReturnType<typeof useHojaRutaScreen>;
  bottomPad: number;
}) {
  if (screen.loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: bottomPad + 28 }}
        refreshControl={
          <RefreshControl
            refreshing={screen.refreshing}
            onRefresh={() => void screen.reload()}
            tintColor={theme.colors.accent}
          />
        }
      >
        <HojaHeaderCard
          chofer={screen.chofer}
          placa={screen.placa}
          fecha={screen.fecha}
          acompanante={screen.acompanante}
          onFecha={(iso) => void screen.changeFecha(iso)}
          onAcompanante={screen.setAcompanante}
        />

        <View style={styles.sectionHead}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>Locales visitados</Text>
            <Text style={styles.sectionMeta}>
              {screen.filas.length} local{screen.filas.length === 1 ? "" : "es"}
            </Text>
          </View>
          <Pressable onPress={screen.openPicker} style={styles.addLocal}>
            <Text style={styles.addLocalText}>
              {screen.localesLoading && !screen.locales.length ? "…" : "+ Local"}
            </Text>
          </Pressable>
        </View>

        {screen.filas.length === 0 ? (
          <View style={styles.emptyLocales}>
            <Text style={styles.emptyLocalesText}>
              Agrega los locales visitados en la jornada
            </Text>
          </View>
        ) : (
          screen.filas.map((item, index) => (
            <HojaLocalRow
              key={item.key}
              index={index}
              item={item}
              expanded={screen.expandedKey === item.key}
              onToggle={() => screen.toggleFila(item.key)}
              onChange={(patch) => screen.patchFila(item.key, patch)}
              onRemove={() => screen.removeFila(item.key)}
            />
          ))
        )}

        <HojaGastosSection
          gastos={screen.gastos}
          total={screen.totales.sumGastos}
          onAdd={screen.addGasto}
          onChange={screen.patchGasto}
          onRemove={screen.removeGasto}
        />

        <HojaCierreSection
          caja={screen.caja}
          totales={screen.totales}
          exporting={screen.exporting}
          onCaja={screen.setCaja}
          onExport={() => void screen.exportar()}
        />

        {screen.error ? <Text style={styles.inlineError}>{screen.error}</Text> : null}
      </ScrollView>

      <HojaLocalPicker
        open={screen.pickerOpen}
        locales={screen.locales}
        loading={screen.localesLoading}
        selectedIds={screen.selectedIds}
        onClose={() => screen.setPickerOpen(false)}
        onSelect={screen.addLocal}
      />
    </>
  );
}

function HistorialPanel({
  historial,
  bottomPad,
  renderItem,
}: {
  historial: ReturnType<typeof useHistorialHr>;
  bottomPad: number;
  renderItem: (info: { item: (typeof historial.items)[number] }) => ReactElement;
}) {
  return (
    <View style={styles.flex}>
      <HistorialFiltersBar
        filters={historial.filters}
        conductores={historial.conductores}
        puedeVerTodas={historial.puedeVerTodas}
        hasFilters={historial.hasFilters}
        total={historial.items.length}
        onChange={historial.patchFilters}
        onClear={historial.clearFilters}
      />

      {historial.loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : historial.error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{historial.error}</Text>
          <Pressable onPress={() => void historial.reload()} style={styles.retry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={historial.items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 24 }]}
          refreshControl={
            <RefreshControl
              refreshing={historial.refreshing}
              onRefresh={() => void historial.reload()}
              tintColor={theme.colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Aún no hay hojas de ruta</Text>
              <Text style={styles.emptyText}>
                {historial.hasFilters
                  ? "Prueba limpiar los filtros"
                  : 'Cuando generes una hoja desde la pestaña "Nueva" aparecerá aquí.'}
              </Text>
              {historial.hasFilters ? (
                <Pressable onPress={historial.clearFilters} style={styles.retry}>
                  <Text style={styles.retryText}>Limpiar filtros</Text>
                </Pressable>
              ) : null}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  flex: { flex: 1 },
  list: { paddingTop: 4, flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  sectionHead: {
    marginHorizontal: 10,
    marginTop: 14,
    marginBottom: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionCopy: { flex: 1, gap: 1 },
  sectionTitle: { color: theme.colors.ink, fontSize: 14, fontWeight: "900" },
  sectionMeta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  addLocal: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: theme.colors.accent,
  },
  addLocalText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  emptyLocales: {
    marginHorizontal: 10,
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    borderStyle: "dashed",
    backgroundColor: theme.colors.surface,
  },
  emptyLocalesText: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  empty: {
    paddingTop: 48,
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
  error: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  inlineError: {
    marginHorizontal: 14,
    marginTop: 4,
    color: theme.colors.danger,
    fontSize: 12,
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
});
