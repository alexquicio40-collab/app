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
  arrived: boolean;
  selected: SuggestedRoute | null;
  vehicleType: string | null;
  onStop: () => void;
};

/** HUD mínimo: ETA + distancia + detener. El mapa queda libre. */
export function NavHud({
  localNombre,
  remainingMeters,
  etaSeconds,
  recalculating,
  arrived,
  selected,
  vehicleType,
  onStop,
}: NavHudProps) {
  const traffic = trafficLabel(selected?.trafficRatio ?? null);

  return (
    <View style={styles.bar}>
      <View style={styles.copy}>
        <Text style={styles.kicker} numberOfLines={1}>
          {arrived ? "Llegaste" : recalculating ? "Recalculando…" : "En ruta"}
          {vehicleType ? ` · ${vehicleType}` : ""}
          {" · "}
          {traffic.text}
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {localNombre}
        </Text>
      </View>

      <View style={styles.metrics}>
        <Text style={styles.eta}>{arrived ? "—" : formatDuration(etaSeconds)}</Text>
        <Text style={styles.dist}>
          {arrived ? "0 m" : formatDistance(remainingMeters)}
        </Text>
      </View>

      {recalculating ? (
        <ActivityIndicator color={theme.colors.accent} style={styles.spin} />
      ) : null}

      <Pressable onPress={onStop} style={styles.stop} hitSlop={6}>
        <Text style={styles.stopText}>{arrived ? "OK" : "Detener"}</Text>
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
