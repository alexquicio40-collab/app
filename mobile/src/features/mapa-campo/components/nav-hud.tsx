import {
  formatDistance,
  formatDuration,
  trafficLabel,
} from "@/features/routes/navegacion/lib/format";
import type { SuggestedRoute } from "@/features/routes/navegacion/types";
import { theme } from "@/lib/theme";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type NavHudProps = {
  localNombre: string;
  remainingMeters: number;
  etaSeconds: number;
  recalculating: boolean;
  selected: SuggestedRoute | null;
  vehicleType: string | null;
  onStop: () => void;
  recogeHint?: string | null;
  pagoHint?: string | null;
};

/** HUD en ruta: ETA + distancia. La llegada usa `ArrivalPanel`. */
export function NavHud({
  localNombre,
  remainingMeters,
  etaSeconds,
  recalculating,
  selected,
  vehicleType,
  onStop,
  pagoHint,
  recogeHint,
}: NavHudProps) {
  const traffic = trafficLabel(selected?.trafficRatio ?? null);
  const tip = [recogeHint, pagoHint].filter(Boolean).join(" · ");

  return (
    <View style={styles.bar}>
      <View style={styles.copy}>
        <Text style={styles.kicker} numberOfLines={1}>
          {recalculating ? "Recalculando…" : "En ruta"}
          {vehicleType ? ` · ${vehicleType}` : ""}
          {" · "}
          {traffic.text}
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {localNombre}
        </Text>
        {tip ? (
          <Text style={styles.tip} numberOfLines={1}>
            {tip}
          </Text>
        ) : null}
      </View>

      <View style={styles.metrics}>
        <Text style={styles.eta}>{formatDuration(etaSeconds)}</Text>
        <Text style={styles.dist}>{formatDistance(remainingMeters)}</Text>
      </View>

      {recalculating ? (
        <ActivityIndicator color={theme.colors.accent} style={styles.spin} />
      ) : null}

      <Pressable onPress={onStop} style={styles.stop} hitSlop={6}>
        <Text style={styles.stopText}>Detener</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  copy: { flex: 1, minWidth: 0, gap: 0 },
  kicker: {
    color: theme.colors.muted,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: { color: theme.colors.ink, fontSize: 12, fontWeight: "900" },
  tip: { color: theme.colors.accent, fontSize: 9, fontWeight: "700", marginTop: 1 },
  metrics: { alignItems: "flex-end", gap: 0 },
  eta: { color: theme.colors.accent, fontSize: 13, fontWeight: "900" },
  dist: { color: theme.colors.muted, fontSize: 10, fontWeight: "700" },
  spin: { marginHorizontal: 2 },
  stop: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: "#E8B4B0",
  },
  stopText: { color: theme.colors.danger, fontSize: 10, fontWeight: "800" },
});
