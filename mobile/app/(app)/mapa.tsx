import { CampoMap, MisRutasPanel, NavHud, useCampoNav, useMapaCampo } from "@/features/mapa-campo";
import {
  CompanionsSheet,
  FinalizarRutaSheet,
  useRutaFlujo,
  VehicleTypeSheet,
} from "@/features/routes/flujo";
import { theme } from "@/lib/theme";
import { ScreenHeader } from "@/ui/screen-header";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Mapa de campo del operador (Flutter MapaScreen).
 * Navegación IN-APP estilo Waze — no abre Google Maps ni Waze.
 */
export default function MapaScreen() {
  const campo = useMapaCampo();
  const nav = useCampoNav();
  const flujo = useRutaFlujo(() => void campo.reload());
  const bottomPad = useContentBottomPad(8);

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title={
          nav.active
            ? nav.recalculating
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
        {campo.loading && !campo.routes.length && !nav.active ? (
          <View style={styles.boot}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.bootText}>Cargando…</Text>
          </View>
        ) : (
          <CampoMap
            payload={nav.mapPayload}
            idleOrigin={campo.origin}
            idleDest={campo.dest}
            onSelectRoute={nav.selectAlternative}
          />
        )}

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
            <NavHud
              localNombre={nav.routeItem.localNombre}
              remainingMeters={nav.remainingMeters}
              etaSeconds={nav.etaSeconds}
              recalculating={nav.recalculating}
              arrived={nav.arrived}
              selected={nav.selected}
              vehicleType={nav.vehicleType}
              onStop={nav.stop}
            />
          ) : (
            <MisRutasPanel
              routes={campo.routes}
              selectedId={campo.selectedId}
              expanded={campo.panelOpen}
              onToggle={() => campo.setPanelOpen((v) => !v)}
              onSelect={campo.setSelectedId}
              onNavigate={(route) => void nav.start(route, { originHint: campo.origin })}
              onStart={(route) => void flujo.openStart(route)}
              onFinalize={(route) => void flujo.openFinish(route)}
            />
          )}
        </View>
      </View>

      <VehicleTypeSheet
        open={flujo.vehicleOpen}
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
        onClose={flujo.closeFinish}
        onSubmit={flujo.confirmFinish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.accentDeep },
  stage: { flex: 1 },
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
  banner: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    zIndex: 4,
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
