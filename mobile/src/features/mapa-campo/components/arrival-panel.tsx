import { RouteBriefBar } from "@/features/routes/components/route-brief-bar";
import type { RouteItem } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ArrivalPanelProps = {
  route: RouteItem;
  onFinalize: () => void;
  onStop: () => void;
};

/**
 * Panel de llegada (paridad Flutter `_buildNavPanel` + acciones Finalizar/Detener).
 */
export function ArrivalPanel({ route, onFinalize, onStop }: ArrivalPanelProps) {
  const address = route.localDireccion?.trim() || route.localNombre;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.pin}>
          <View style={styles.pinDot} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.kicker}>Llegaste a</Text>
          <Text style={styles.title} numberOfLines={2}>
            {route.localNombre}
          </Text>
          {address && address !== route.localNombre ? (
            <Text style={styles.address} numberOfLines={2}>
              {address}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.brief}>
        <RouteBriefBar route={route} />
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onStop} style={styles.ghost}>
          <Text style={styles.ghostText}>Detener</Text>
        </Pressable>
        <Pressable onPress={onFinalize} style={styles.primary}>
          <Text style={styles.primaryText}>Finalizar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#7CB342",
    backgroundColor: "rgba(255,255,255,0.97)",
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1.5,
    borderColor: "#B7D4C8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.accent,
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  kicker: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "800",
  },
  title: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  address: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  brief: { marginTop: 2 },
  actions: { flexDirection: "row", gap: 8, marginTop: 2 },
  ghost: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.cream,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  ghostText: { color: theme.colors.muted, fontSize: 13, fontWeight: "800" },
  primary: {
    flex: 1.35,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
  },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
