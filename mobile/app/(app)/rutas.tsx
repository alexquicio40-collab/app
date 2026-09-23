import { AssignPanel } from "@/features/routes/assign/components/assign-panel";
import { OrderPanel } from "@/features/routes/assign/components/order-panel";
import { RestrictionPanel } from "@/features/routes/assign/components/restriction-panel";
import { SchedulePanel } from "@/features/routes/assign/components/schedule-panel";
import { useAssignWorkspace } from "@/features/routes/assign/hooks";
import type { RoutesTabKey } from "@/features/routes/assign/types";
import { RouteCard } from "@/features/routes/components/route-card";
import { RouteDetailSheet } from "@/features/routes/components/route-detail-sheet";
import { RouteEditSheet } from "@/features/routes/components/route-edit-sheet";
import { RouteStatusSheet } from "@/features/routes/components/route-status-sheet";
import { RoutesSummary } from "@/features/routes/components/routes-summary";
import { RoutesTabs } from "@/features/routes/components/routes-tabs";
import { RoutesToolbar } from "@/features/routes/components/routes-toolbar";
import {
  CompanionsSheet,
  FinalizarRutaSheet,
  useRutaFlujo,
  VehicleTypeSheet,
} from "@/features/routes/flujo";
import { useRoutesScreen } from "@/features/routes/hooks";
import { isActionableRoute } from "@/features/routes/lib/permissions";
import { theme } from "@/lib/theme";
import { ScreenHeader } from "@/ui/screen-header";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

const VALID_TABS: RoutesTabKey[] = [
  "listado",
  "asignacion",
  "programacion",
  "orden",
  "restriccion",
];

function parseTab(value: string | string[] | undefined): RoutesTabKey | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  return VALID_TABS.includes(raw as RoutesTabKey) ? (raw as RoutesTabKey) : null;
}

export default function RutasScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<RoutesTabKey>(() => parseTab(params.tab) ?? "listado");
  const routes = useRoutesScreen();
  const assign = useAssignWorkspace({ enabled: tab !== "listado" });
  const bottomPad = useContentBottomPad(12);

  useEffect(() => {
    const next = parseTab(params.tab);
    if (next) setTab(next);
  }, [params.tab]);

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Rutas" compact />
      <RoutesTabs value={tab} onChange={setTab} />

      {tab === "listado" ? <ListadoPanel routes={routes} bottomPad={bottomPad} /> : null}

      {tab === "asignacion" ? (
        assign.loading && !assign.booted ? (
          <Boot />
        ) : (
          <AssignPanel
            conductores={routes.conductores}
            locales={assign.locales}
            localesLoading={assign.localesLoading}
            bottomPad={bottomPad}
            onAssign={async (input) => {
              await assign.assignRoute(input);
              await routes.reload();
            }}
            onDone={() => setTab("listado")}
          />
        )
      ) : null}

      {tab === "programacion" ? (
        assign.loading && !assign.booted ? (
          <Boot />
        ) : (
          <SchedulePanel
            conductores={routes.conductores}
            locales={assign.locales}
            localesLoading={assign.localesLoading}
            schedules={assign.schedules}
            bottomPad={bottomPad}
            onSave={assign.saveSchedule}
            onGenerate={assign.generateRoutes}
            onDelete={assign.removeSchedule}
            onReload={async () => {
              await Promise.all([assign.reload(), routes.reload()]);
            }}
          />
        )
      ) : null}

      {tab === "orden" ? (
        <OrderPanel
          conductores={routes.conductores}
          bottomPad={bottomPad}
          onSaveOrder={async (ids) => {
            await assign.setRouteOrder(ids);
            await routes.reload();
          }}
        />
      ) : null}

      {tab === "restriccion" ? (
        assign.loading && !assign.booted ? (
          <Boot />
        ) : (
          <RestrictionPanel
            items={assign.restrictions}
            bottomPad={bottomPad}
            onSave={assign.saveRestriction}
            onToggle={assign.toggleRestriction}
            onDelete={assign.removeRestriction}
          />
        )
      ) : null}
    </View>
  );
}

function Boot() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.colors.accent} />
    </View>
  );
}

function ListadoPanel({
  routes,
  bottomPad,
}: {
  routes: ReturnType<typeof useRoutesScreen>;
  bottomPad: number;
}) {
  const {
    openRoute,
    openEdit,
    openStatus,
    removeRoute,
    closeEdit,
    closeStatus,
    saveEdit,
    changeStatus,
    editing,
    statusRoute,
    conductores,
    locales,
    mutating,
    isOperador,
    reload,
  } = routes;

  const flujo = useRutaFlujo(() => void reload());
  const router = useRouter();

  const renderItem = useCallback(
    ({ item }: { item: (typeof routes.filtered)[number] }) => {
      const actionable = isActionableRoute(item);
      return (
        <RouteCard
          route={item}
          actions={{
            onOpen: () => openRoute(item.id),
            onEdit: !isOperador && actionable ? () => void openEdit(item.id) : undefined,
            onChangeStatus: !isOperador && actionable ? () => openStatus(item.id) : undefined,
            onDelete: !isOperador && actionable ? () => void removeRoute(item) : undefined,
            onStart: isOperador ? () => void flujo.openStart(item) : undefined,
            onFinalize: isOperador ? () => void flujo.openFinish(item) : undefined,
          }}
        />
      );
    },
    [openRoute, openEdit, openStatus, removeRoute, isOperador, flujo],
  );

  return (
    <View style={styles.flex}>
      <RoutesToolbar
        filters={routes.filters}
        distritos={routes.distritos}
        conductores={routes.conductores}
        onChange={routes.patchFilters}
      />

      <RoutesSummary total={routes.filtered.length} counts={routes.counts} />

      {routes.loading ? (
        <Boot />
      ) : routes.error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{routes.error}</Text>
          <Pressable onPress={routes.reload} style={styles.retry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={routes.filtered}
          keyExtractor={keyExtractor}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
          refreshControl={
            <RefreshControl
              refreshing={routes.refreshing}
              onRefresh={routes.reload}
              tintColor={theme.colors.accent}
              colors={[theme.colors.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No hay rutas</Text>
              <Text style={styles.emptyText}>
                {routes.hasFilters
                  ? "Prueba limpiar los filtros o cambia la búsqueda."
                  : "Aún no hay asignaciones para mostrar."}
              </Text>
              {routes.hasFilters ? (
                <Pressable onPress={routes.clearFilters} style={styles.retry}>
                  <Text style={styles.retryText}>Limpiar filtros</Text>
                </Pressable>
              ) : null}
            </View>
          }
          renderItem={renderItem}
          ItemSeparatorComponent={Sep}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={7}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews
        />
      )}

      <RouteDetailSheet
        route={routes.selected}
        onClose={routes.closeRoute}
        onStart={
          isOperador && routes.selected
            ? () => {
                const item = routes.selected!;
                routes.closeRoute();
                void flujo.openStart(item);
              }
            : undefined
        }
        onFinalize={
          isOperador && routes.selected
            ? () => {
                const item = routes.selected!;
                routes.closeRoute();
                void flujo.openFinish(item);
              }
            : undefined
        }
        onSuggestRoutes={
          routes.selected
            ? () => {
                routes.closeRoute();
                router.push("/mapa");
              }
            : undefined
        }
      />

      <RouteEditSheet
        route={editing}
        conductores={conductores}
        locales={locales}
        saving={mutating}
        onClose={closeEdit}
        onSave={async (payload) => {
          await saveEdit(payload);
        }}
      />

      <RouteStatusSheet
        route={statusRoute}
        saving={mutating}
        onClose={closeStatus}
        onSelect={changeStatus}
      />

      <VehicleTypeSheet
        open={flujo.vehicleOpen}
        route={flujo.startRoute}
        localNombre={flujo.startRoute?.localNombre}
        initial={flujo.savedVehicle}
        saving={flujo.mutating}
        onClose={flujo.closeStart}
        onContinue={flujo.confirmVehicle}
      />

      <CompanionsSheet
        open={flujo.companionsOpen}
        vehicleType={flujo.vehicleType}
        saving={flujo.mutating}
        onBack={flujo.backToVehicle}
        onClose={flujo.closeStart}
        onSkip={() =>
          void flujo.confirmStart({
            vehicleType: flujo.vehicleType ?? "ligero",
            companions: [],
          })
        }
        onConfirm={(companions) =>
          void flujo.confirmStart({
            vehicleType: flujo.vehicleType ?? "ligero",
            companions,
          })
        }
      />

      <FinalizarRutaSheet
        open={flujo.finishOpen}
        route={flujo.finishRoute}
        config={flujo.finishConfig}
        saving={flujo.mutating}
        onClose={flujo.closeFinish}
        onSubmit={flujo.confirmFinish}
      />
    </View>
  );
}

function keyExtractor(item: { id: string }) {
  return item.id;
}

function Sep() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  flex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 8,
    flexGrow: 1,
  },
  sep: {
    height: 5,
  },
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
