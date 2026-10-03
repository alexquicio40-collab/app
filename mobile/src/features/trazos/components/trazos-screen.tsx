import { TrazosBar } from "@/features/trazos/components/trazos-bar";
import { TrazosMap } from "@/features/trazos/components/trazos-map";
import { TrazosTimeline } from "@/features/trazos/components/trazos-timeline";
import { useTrazosScreen } from "@/features/trazos/hooks";
import { theme } from "@/lib/theme";
import { HeaderAction, IconRefresh } from "@/ui/header-action";
import { ScreenHeader } from "@/ui/screen-header";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export function TrazosScreen() {
  const screen = useTrazosScreen();
  const bottom = useContentBottomPad(6);

  const focusItem = (id: string | null) => {
    screen.setSelectedId(id);
    if (!id || !screen.trazo?.inicio || !screen.trazo.fin) return;
    const ev = screen.eventos.find((item) => item.id === id);
    if (!ev || ev.at >= Number.MAX_SAFE_INTEGER) return;
    const span = screen.trazo.fin - screen.trazo.inicio;
    if (span <= 0) return;
    screen.setCursor(Math.min(1, Math.max(0, (ev.at - screen.trazo.inicio) / span)));
  };

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Trazos"
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

      <TrazosBar
        fecha={screen.fecha}
        onFecha={screen.setFechaDate}
        puedeElegir={screen.puedeElegir}
        operador={screen.operadorNombre}
        operadores={screen.operadores}
        resumenes={screen.resumenes}
        selectedId={screen.selectedConductorId}
        onOperador={screen.selectConductor}
      />

      <View style={styles.stage}>
        <TrazosMap payload={screen.mapPayload} onSelect={focusItem} />

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

        {!screen.loading && !screen.capas.length ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sin recorrido este día</Text>
            <Text style={styles.emptyText}>No hay GPS guardado para esa fecha.</Text>
          </View>
        ) : null}
      </View>

      {screen.capas.length ? (
        <View style={{ paddingBottom: Math.max(bottom - 10, 8) }}>
          <TrazosTimeline
            kpis={screen.kpis}
            eventos={screen.eventos}
            selectedId={screen.selectedId}
            onSelect={focusItem}
            cursorPunto={screen.cursorPunto}
            cursor={screen.cursor}
            onCursor={screen.setCursor}
            verTodos={screen.verTodos}
            capas={screen.capas}
            onOperador={screen.selectConductor}
          />
        </View>
      ) : (
        <View style={{ height: bottom }} />
      )}
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
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  errorBox: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.dangerSoft,
    gap: 6,
  },
  errorText: { color: theme.colors.danger, fontSize: 12, fontWeight: "700" },
  retry: { color: theme.colors.accent, fontSize: 12, fontWeight: "800" },
  empty: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 24,
  },
  emptyTitle: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  emptyText: { color: theme.colors.muted, fontSize: 12, textAlign: "center" },
});
