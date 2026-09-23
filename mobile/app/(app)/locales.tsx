import { LocalCard } from "@/features/locales/components/local-card";
import { LocalDetailSheet } from "@/features/locales/components/local-detail-sheet";
import { LocalFormSheet } from "@/features/locales/components/local-form-sheet";
import { LocalesMap } from "@/features/locales/components/locales-map";
import {
  LocalesModeTabs,
  type LocalesViewMode,
} from "@/features/locales/components/locales-mode-tabs";
import { LocalesSummary } from "@/features/locales/components/locales-summary";
import { LocalesToolbar } from "@/features/locales/components/locales-toolbar";
import { MetodosPagoManagerSheet } from "@/features/locales/components/metodos-pago-manager-sheet";
import { useLocalesScreen } from "@/features/locales/hooks";
import { theme } from "@/lib/theme";
import { HeaderAction, IconCard } from "@/ui/header-action";
import { ScreenHeader } from "@/ui/screen-header";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function LocalesScreen() {
  const screen = useLocalesScreen();
  const bottomPad = useContentBottomPad(12);
  const [mode, setMode] = useState<LocalesViewMode>("mapa");

  const mappedCount = useMemo(
    () => screen.filtered.filter((item) => item.latitud != null && item.longitud != null).length,
    [screen.filtered],
  );

  const onSelectPin = useCallback(
    (id: string | null) => {
      if (id) screen.openLocal(id);
      else screen.closeLocal();
    },
    [screen],
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof screen.filtered)[number] }) => (
      <LocalCard
        local={item}
        canManage={screen.canManage}
        onOpen={() => screen.openLocal(item.id)}
        onEdit={screen.canManage ? () => screen.openEdit(item.id) : undefined}
        onDelete={screen.canManage ? () => void screen.removeLocal(item) : undefined}
      />
    ),
    [screen],
  );

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Locales"
        compact
        trailing={
          screen.canManage ? (
            <View style={styles.headerActions}>
              <HeaderAction
                label="Pagos"
                icon={<IconCard color="#FFFFFF" />}
                onPress={screen.openMetodos}
                compact
                accessibilityLabel="Formas de pago"
              />
              <Pressable onPress={screen.openCreate} style={styles.newBtn}>
                <Text style={styles.newBtnText}>+ Nuevo</Text>
              </Pressable>
            </View>
          ) : null
        }
      />

      <LocalesModeTabs value={mode} onChange={setMode} mapCount={mappedCount} />

      <LocalesToolbar
        filters={screen.filters}
        distritos={screen.distritos}
        onChange={screen.patchFilters}
        onClear={screen.clearFilters}
        hasFilters={screen.hasFilters}
      />

      <LocalesSummary
        counts={screen.kpiCounts}
        activeCert={screen.filters.certificacion}
        onSelectCert={screen.setCertFilter}
      />

      {screen.loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : screen.error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{screen.error}</Text>
          <Pressable onPress={screen.reload} style={styles.retry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : mode === "mapa" ? (
        <View style={[styles.mapStage, { paddingBottom: bottomPad }]}>
          {mappedCount === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>Sin ubicaciones</Text>
              <Text style={styles.emptyText}>
                Los locales filtrados no tienen coordenadas para mostrar en el mapa.
              </Text>
            </View>
          ) : (
            <LocalesMap
              locales={screen.filtered}
              selectedId={screen.selected?.id ?? null}
              onSelect={onSelectPin}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={screen.filtered}
          keyExtractor={(item) => item.id}
          initialNumToRender={16}
          maxToRenderPerBatch={16}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
          refreshControl={
            <RefreshControl
              refreshing={screen.refreshing}
              onRefresh={screen.reload}
              tintColor={theme.colors.accent}
              colors={[theme.colors.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No hay locales</Text>
              <Text style={styles.emptyText}>
                {screen.hasFilters
                  ? "Prueba limpiar los filtros o cambia la búsqueda."
                  : "Aún no hay puntos de recojo registrados."}
              </Text>
              {screen.hasFilters ? (
                <Pressable onPress={screen.clearFilters} style={styles.retry}>
                  <Text style={styles.retryText}>Limpiar filtros</Text>
                </Pressable>
              ) : screen.canManage ? (
                <Pressable onPress={screen.openCreate} style={styles.retry}>
                  <Text style={styles.retryText}>Crear local</Text>
                </Pressable>
              ) : null}
            </View>
          }
          renderItem={renderItem}
          ItemSeparatorComponent={Sep}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
        />
      )}

      <LocalDetailSheet
        local={screen.selected}
        canManage={screen.canManage}
        onClose={screen.closeLocal}
        onEdit={
          screen.selected && screen.canManage
            ? () => {
                const id = screen.selected!.id;
                screen.closeLocal();
                screen.openEdit(id);
              }
            : undefined
        }
        onToggleCert={
          screen.selected && screen.canManage
            ? () => void screen.toggleCertEstado(screen.selected!)
            : undefined
        }
      />

      <LocalFormSheet
        open={screen.formOpen}
        local={screen.editing}
        metodosPago={screen.metodosPago}
        saving={screen.mutating}
        onClose={screen.closeForm}
        onSave={screen.saveLocal}
      />

      <MetodosPagoManagerSheet
        open={screen.metodosOpen}
        items={screen.metodosPago}
        saving={screen.metodosSaving}
        onClose={screen.closeMetodos}
        onCreate={screen.addMetodoPago}
        onRename={screen.renameMetodoPago}
        onDelete={screen.removeMetodoPago}
      />
    </View>
  );
}

function Sep() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  newBtn: {
    backgroundColor: theme.colors.gold,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  newBtnText: {
    color: theme.colors.accentDeep,
    fontSize: 12,
    fontWeight: "800",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  list: {
    paddingHorizontal: 8,
    flexGrow: 1,
  },
  mapStage: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  sep: { height: 6 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  retry: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  empty: {
    paddingTop: 48,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 260,
  },
});
