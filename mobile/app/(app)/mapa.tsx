import {
  ArrivalPanel,
  CampoMap,
  MisRutasPanel,
  NavHud,
  RouteBriefBanner,
  useCampoNav,
  useMapaCampo,
} from "@/features/mapa-campo";
import { MapaFechaBar } from "@/features/mapa-campo/components/mapa-fecha-bar";
import { RecojosPendientesBar } from "@/features/recojo-offline/components/pendientes-bar";
import { routePagoHint, routeRecogeHint } from "@/features/mapa-campo/lib/route-hints";
import { prioridadMeta } from "@/features/locales/lib/prioridad";
import {
  CompanionsSheet,
  FinalizarRutaSheet,
  useRutaFlujo,
  VehicleTypeSheet,
} from "@/features/routes/flujo";
import { theme } from "@/lib/theme";
import { ScreenHeader } from "@/ui/screen-header";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { RutaDetalleSheet } from "@/features/mapa-campo/components/ruta-detalle-sheet";
import { deleteRoute } from "@/features/routes/api";
import type { RouteItem } from "@/features/routes/types";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";

/**
 * Mapa de campo del operador (Flutter MapaScreen).
 * Navegación IN-APP estilo Waze — no abre Google Maps ni Waze.
 * Sin ruta iniciada se pinta la ubicación real. Con la ruta en curso sigue la navegación.
 */
export default function MapaScreen() {
  const campo = useMapaCampo();
  const nav = useCampoNav();
  const flujo = useRutaFlujo(() => {
    nav.stop();
    void campo.reload();
  });
  const bottomPad = useContentBottomPad(8);
  const [detail, setDetail] = useState<RouteItem | null>(null);

  useEffect(() => {
    setDetail((prev) => {
      if (!prev) return null;
      return campo.routes.find((item) => item.id === prev.id) ?? null;
    });
  }, [campo.routes]);

  const quitarNoRecolectado = (route: RouteItem) => {
    const ask =
      Platform.OS === "web"
        ? Promise.resolve(window.confirm(`¿Eliminar la ruta de ${route.localNombre}?`))
        : new Promise<boolean>((resolve) => {
            Alert.alert("Eliminar ruta", route.localNombre, [
              { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
              { text: "Eliminar", style: "destructive", onPress: () => resolve(true) },
            ]);
          });
    void ask.then(async (ok) => {
      if (!ok) return;
      try {
        await deleteRoute(route.id);
        void campo.reload();
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo eliminar";
        if (Platform.OS === "web") window.alert(message);
        else Alert.alert("Error", message);
      }
    });
  };

  const startRoute = (route: RouteItem) => {
    setDetail(null);
    if (route.estado === "programado") {
      void flujo.openStart(route);
      return;
    }
    void nav.start(route, { originHint: campo.origin });
  };

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title={
          nav.active
            ? nav.arrived
              ? "Llegaste"
              : nav.recalculating
                ? "Recalculando…"
                : "En ruta"
            : "Mapa"
        }
        compact
        showSignOut={!nav.active}
        trailing={
          <Pressable
            onPress={() => (nav.active ? nav.stop() : void campo.reload())}
            style={styles.refresh}
          >
            <Text style={styles.refreshText}>{nav.active ? "Detener" : "↻"}</Text>
          </Pressable>
        }
      />

      <View style={styles.stage}>
        {!nav.active ? (
          <MapaFechaBar fecha={campo.fecha} onChange={campo.setFecha} />
        ) : null}
        {campo.loading && !campo.routes.length && !nav.active ? (
          <View style={styles.boot}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.bootText}>Cargando…</Text>
          </View>
        ) : (
          <CampoMap
            payload={nav.mapPayload}
            idleOrigin={nav.active ? null : campo.origin}
            idleDest={campo.dest}
            idleDestColor={campo.selected ? prioridadMeta(campo.selected.prioridad).color : null}
            pins={campo.pins}
            selectedPinId={nav.active ? nav.routeItem?.id ?? campo.selectedId : campo.selectedId}
            onSelectRoute={nav.selectAlternative}
            onSelectPin={campo.setSelectedId}
            showRecenter={nav.active && !nav.arrived}
            locateBottom={bottomPad + 58}
          />
        )}

        {nav.mockingGps && nav.active && !nav.arrived ? (
          <View style={styles.mockActions}>
            <Pressable onPress={nav.simulateDetour} style={styles.detourBtn}>
              <Text style={styles.detourBtnText}>Simular desvío</Text>
            </Pressable>
            <Pressable onPress={nav.simulateArrive} style={styles.arriveBtn}>
              <Text style={styles.detourBtnText}>Simular llegada</Text>
            </Pressable>
          </View>
        ) : nav.mockingGps && !nav.active ? (
          <View style={styles.mockBadge} pointerEvents="none">
            <Text style={styles.mockBadgeText}>GPS simulado (web)</Text>
          </View>
        ) : null}

        {nav.active && nav.routeItem && !nav.arrived ? (
          <View style={styles.briefTop} pointerEvents="box-none">
            <RouteBriefBanner route={nav.routeItem} />
          </View>
        ) : null}

        {nav.loading ? (
          <View style={styles.navBanner}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.navBannerText}>Calculando tramo…</Text>
          </View>
        ) : null}

        {nav.error ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText} numberOfLines={2}>
              {nav.error}
            </Text>
            <Pressable onPress={nav.stop}>
              <Text style={styles.bannerRetry}>Cerrar</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.bottom, { bottom: bottomPad }]}>
          {nav.active && nav.routeItem ? (
            nav.arrived ? (
              <ArrivalPanel
                route={nav.routeItem}
                onFinalize={() => void flujo.openFinish(nav.routeItem!)}
                onStop={nav.stop}
              />
            ) : (
              <NavHud
                localNombre={nav.routeItem.localNombre}
                remainingMeters={nav.remainingMeters}
                etaSeconds={nav.etaSeconds}
                recalculating={nav.recalculating}
                selected={nav.selected}
                vehicleType={nav.vehicleType}
                onStop={nav.stop}
                recogeHint={routeRecogeHint(nav.routeItem)}
                pagoHint={routePagoHint(nav.routeItem)}
              />
            )
          ) : (
            <View style={styles.panelStack}>
              <RecojosPendientesBar />
              <MisRutasPanel
                routes={campo.routes}
                selectedId={campo.selectedId}
                expanded={campo.panelOpen}
                onToggle={() => campo.setPanelOpen((v) => !v)}
                onSelect={campo.setSelectedId}
                onOpen={(route) => {
                  campo.setSelectedId(route.id);
                  setDetail(route);
                }}
                onDelete={quitarNoRecolectado}
              />
            </View>
          )}
        </View>
      </View>

      <RutaDetalleSheet
        route={detail}
        onClose={() => setDetail(null)}
        onStart={startRoute}
        onComplete={(route) => {
          setDetail(null);
          void flujo.openFinish(route);
        }}
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
        onSkip={() => {
          const item = flujo.startRoute;
          const vehicle = flujo.vehicleType;
          void flujo
            .confirmStart({
              vehicleType: vehicle ?? "ligero",
              companions: [],
            })
            .then(() => {
              if (item) {
                void nav.start(item, { vehicleType: vehicle, originHint: campo.origin });
              }
            });
        }}
        onConfirm={(companions) => {
          const item = flujo.startRoute;
          const vehicle = flujo.vehicleType;
          void flujo
            .confirmStart({
              vehicleType: vehicle ?? "ligero",
              companions,
            })
            .then(() => {
              if (item) {
                void nav.start(item, { vehicleType: vehicle, originHint: campo.origin });
              }
            });
        }}
      />

      <FinalizarRutaSheet
        open={flujo.finishOpen}
        route={flujo.finishRoute}
        config={flujo.finishConfig}
        saving={flujo.mutating}
        upload={flujo.upload}
        onClose={flujo.closeFinish}
        onSubmit={flujo.confirmFinish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.accentDeep },
  stage: { flex: 1 },
  panelStack: { gap: 8 },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: theme.colors.cream,
  },
  bootText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  refresh: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  refreshText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  mockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(184,134,11,0.92)",
  },
  mockBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  mockActions: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 6,
    gap: 6,
    alignItems: "flex-end",
  },
  detourBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(184,134,11,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  arriveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(11,83,64,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  detourBtnText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  briefTop: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    zIndex: 4,
  },
  banner: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    zIndex: 5,
    borderRadius: 10,
    backgroundColor: theme.colors.dangerSoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  bannerText: { flex: 1, color: theme.colors.danger, fontSize: 11, fontWeight: "700" },
  bannerRetry: { color: theme.colors.danger, fontSize: 11, fontWeight: "900" },
  navBanner: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    zIndex: 4,
    borderRadius: 999,
    backgroundColor: "rgba(8,61,48,0.88)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navBannerText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  bottom: {
    position: "absolute",
    left: 8,
    right: 8,
    zIndex: 3,
  },
});
