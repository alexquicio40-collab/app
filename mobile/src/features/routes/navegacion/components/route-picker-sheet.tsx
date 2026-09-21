import { RoutesPreviewMap } from "@/features/routes/navegacion/components/routes-preview-map";
import {
  deltaLabel,
  formatDistance,
  formatDuration,
  trafficLabel,
} from "@/features/routes/navegacion/lib/format";
import type {
  DirectionsResult,
  LatLng,
  SuggestedRoute,
} from "@/features/routes/navegacion/types";
import type { RouteItem } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type RoutePickerSheetProps = {
  open: boolean;
  route: RouteItem | null;
  loading: boolean;
  error: string | null;
  result: DirectionsResult | null;
  origin: LatLng | null;
  selectedId: string | null;
  selected: SuggestedRoute | null;
  vehicleType: string | null;
  onClose: () => void;
  onRetry: () => void;
  onSelectAlternative: (id: string) => void;
  onGoToCampo?: () => void;
};

export function RoutePickerSheet({
  open,
  route,
  loading,
  error,
  result,
  origin,
  selectedId,
  selected,
  vehicleType,
  onClose,
  onRetry,
  onSelectAlternative,
  onGoToCampo,
}: RoutePickerSheetProps) {
  const insets = useSafeAreaInsets();
  if (!open || !route) return null;

  const options = result ? [result.best, ...result.alternatives.slice(0, 3)] : [];
  const dest =
    route.localLatitud != null && route.localLongitud != null
      ? { lat: route.localLatitud, lng: route.localLongitud }
      : null;
  const traffic = trafficLabel(selected?.trafficRatio ?? null);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.handle} />

          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={styles.kicker}>Rutas en mapa</Text>
              <Text style={styles.title} numberOfLines={2}>
                {route.localNombre}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {vehicleType
                  ? `Vehículo ${vehicleType} · toca una línea o tip`
                  : "Toca una línea o tip para cambiar ruta"}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text style={styles.loadingText}>Trazando rutas…</Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.error}>{error}</Text>
              <Pressable onPress={onRetry} style={styles.retry}>
                <Text style={styles.retryText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.content}>
              {result?.message ? <Text style={styles.banner}>{result.message}</Text> : null}

              <View style={styles.mapBox}>
                <RoutesPreviewMap
                  origin={origin}
                  dest={dest}
                  result={result}
                  selectedId={selectedId}
                  onSelect={onSelectAlternative}
                />
              </View>

              <View style={styles.chips}>
                {options.map((item) => {
                  const active = item.id === selectedId;
                  const tip = trafficLabel(item.trafficRatio);
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => onSelectAlternative(item.id)}
                      style={[styles.chip, active ? styles.chipActive : null]}
                    >
                      <Text style={[styles.chipTime, active ? styles.chipTimeActive : null]}>
                        {formatDuration(item.durationSeconds)}
                      </Text>
                      <Text style={styles.chipSub} numberOfLines={1}>
                        {active
                          ? tip.text
                          : result
                            ? deltaLabel(result.best.durationSeconds, item.durationSeconds)
                            : tip.text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {selected ? (
                <View style={styles.summary}>
                  <View style={styles.summaryMain}>
                    <Text style={styles.summaryLabel}>{selected.label}</Text>
                    <Text style={styles.summaryValue}>
                      {formatDuration(selected.durationSeconds)} ·{" "}
                      {formatDistance(selected.distMeters)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.trafficPill,
                      tipToneStyle(traffic.tone),
                    ]}
                  >
                    <Text style={styles.trafficPillText}>{traffic.text}</Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  onPress={() => {
                    onClose();
                    onGoToCampo?.();
                  }}
                  style={styles.google}
                >
                  <Text style={styles.googleText}>Abrir en Mapa de campo</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function tipToneStyle(tone: "ok" | "warn" | "bad") {
  if (tone === "warn") return styles.trafficWarn;
  if (tone === "bad") return styles.trafficBad;
  return styles.trafficOk;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  dismiss: { flex: 0.08 },
  sheet: {
    height: "92%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 8,
    ...Platform.select({
      web: { maxWidth: 560, width: "100%", alignSelf: "center" },
      default: {},
    }),
  },
  handle: {
    alignSelf: "center",
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
    marginBottom: 6,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  headCopy: { flex: 1, minWidth: 0, gap: 2 },
  kicker: {
    color: theme.colors.gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: { color: theme.colors.ink, fontSize: 16, fontWeight: "900" },
  meta: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  close: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.cream,
  },
  closeText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  error: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  retry: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
  },
  retryText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  content: { flex: 1, gap: 10 },
  banner: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: theme.colors.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    overflow: "hidden",
  },
  mapBox: { flex: 1, minHeight: 260 },
  chips: { flexDirection: "row", gap: 8 },
  chip: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 2,
  },
  chipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  chipTime: { color: theme.colors.ink, fontSize: 13, fontWeight: "900" },
  chipTimeActive: { color: theme.colors.accent },
  chipSub: { color: theme.colors.muted, fontSize: 10, fontWeight: "700" },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryMain: { flex: 1, minWidth: 0, gap: 2 },
  summaryLabel: { color: theme.colors.ink, fontSize: 13, fontWeight: "900" },
  summaryValue: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  trafficPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  trafficOk: { backgroundColor: theme.colors.accentSoft },
  trafficWarn: { backgroundColor: "#FFF1E6" },
  trafficBad: { backgroundColor: "#FCEBEA" },
  trafficPillText: { fontSize: 11, fontWeight: "800", color: theme.colors.ink },
  actions: { flexDirection: "row", gap: 8 },
  google: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
  },
  googleText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  waze: {
    width: 88,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.goldSoft,
    borderWidth: 1,
    borderColor: "#E0C98A",
  },
  wazeText: { color: theme.colors.gold, fontSize: 13, fontWeight: "800" },
});
