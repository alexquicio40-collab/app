import { ConductoresBar } from "@/features/rutas-mapa/components/conductores-bar";
import { FechaBar } from "@/features/rutas-mapa/components/fecha-bar";
import { ResumenFooter } from "@/features/rutas-mapa/components/resumen-footer";
import { RutaDetailSheet } from "@/features/rutas-mapa/components/ruta-detail-sheet";
import { RutasMapaMap } from "@/features/rutas-mapa/components/rutas-mapa-map";
import { useRutasMapaScreen } from "@/features/rutas-mapa/hooks";
import { theme } from "@/lib/theme";
import { HeaderAction, IconRefresh } from "@/ui/header-action";
import { ScreenHeader } from "@/ui/screen-header";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function RutasMapaScreen() {
  const screen = useRutasMapaScreen();
  const bottomPad = useContentBottomPad(12);

  const conductorLabel = useMemo(() => {
    if (!screen.selectedConductorId) return null;
    return (
      screen.conductores.find((item) => item.id === screen.selectedConductorId)?.nombre ?? null
    );
  }, [screen.conductores, screen.selectedConductorId]);

  const accent =
    (screen.selectedRuta && screen.colorByConductor.get(screen.selectedRuta.conductorId)) ||
    theme.colors.accent;

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Rutas en mapa"
        compact
        trailing={
          <HeaderAction
            label="Actualizar"
            icon={<IconRefresh color="#FFFFFF" />}
            onPress={() => void screen.reload()}
            compact
          />
        }
      />

      <FechaBar fecha={screen.fecha} onChange={screen.setFechaDate} />

      <ConductoresBar
        conductores={screen.conductores}
        countByConductor={screen.countByConductor}
        colorByConductor={screen.colorByConductor}
        totalRutas={screen.totalRutas}
        selectedId={screen.selectedConductorId}
        onSelect={screen.selectConductor}
      />

      <View style={styles.stage}>
        <RutasMapaMap payload={screen.mapPayload} onSelect={screen.setSelectedRutaId} />

        {screen.loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.accent} />
          </View>
        ) : null}

        {screen.error && !screen.loading ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{screen.error}</Text>
            <Pressable onPress={() => void screen.reload()}>
              <Text style={styles.retry}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.footer, { bottom: bottomPad }]}>
          <ResumenFooter
            visibles={screen.filteredCount}
            total={screen.totalRutas}
            conductorLabel={conductorLabel}
          />
        </View>
      </View>

      <RutaDetailSheet
        ruta={screen.selectedRuta}
        accentColor={accent}
        onClose={() => screen.setSelectedRutaId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  stage: { flex: 1, position: "relative" },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  errorBox: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 72,
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    gap: 6,
  },
  errorText: { color: theme.colors.danger, fontSize: 12, fontWeight: "700" },
  retry: { color: theme.colors.accent, fontSize: 12, fontWeight: "800" },
  footer: {
    position: "absolute",
    left: 12,
    right: 12,
  },
});
