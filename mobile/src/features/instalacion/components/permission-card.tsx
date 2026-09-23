import { theme } from "@/lib/theme";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { PermissionGrant, PermissionRow } from "../types";
import { PermissionGlyph } from "./permission-glyph";

type PermissionCardProps = {
  row: PermissionRow;
  active?: boolean;
  onPress?: () => void;
};

function statusLabel(status: PermissionGrant) {
  switch (status) {
    case "granted":
      return "Listo";
    case "denied":
      return "Denegado";
    case "unavailable":
      return "N/A";
    default:
      return "Tocar";
  }
}

function statusTone(status: PermissionGrant) {
  switch (status) {
    case "granted":
      return { fg: theme.colors.accent, bg: theme.colors.accentSoft };
    case "denied":
      return { fg: theme.colors.danger, bg: theme.colors.dangerSoft };
    case "unavailable":
      return { fg: theme.colors.muted, bg: theme.colors.cream };
    default:
      return { fg: theme.colors.info, bg: theme.colors.infoSoft };
  }
}

export function PermissionCard({ row, active, onPress }: PermissionCardProps) {
  const tone = statusTone(row.status);
  const interactive = Boolean(onPress) && row.status !== "granted";

  return (
    <Pressable
      accessibilityRole={interactive ? "button" : "summary"}
      accessibilityState={{ disabled: !interactive, busy: active }}
      disabled={!interactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        row.status === "granted" ? styles.cardGranted : null,
        active ? styles.cardActive : null,
        pressed && interactive ? styles.cardPressed : null,
      ]}
    >
      <PermissionGlyph accent={row.accent} />
      <View style={styles.copy}>
        <Text style={styles.title}>{row.title}</Text>
        <Text style={styles.body}>{row.body}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: tone.bg }]}>
        {active ? (
          <ActivityIndicator size="small" color={tone.fg} />
        ) : (
          <Text style={[styles.badgeText, { color: tone.fg }]}>{statusLabel(row.status)}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1.5,
    borderColor: "rgba(210,221,216,0.85)",
  },
  cardGranted: {
    borderColor: "rgba(11,83,64,0.28)",
  },
  cardActive: {
    borderColor: theme.colors.gold,
    backgroundColor: "#FFFFFF",
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  copy: { flex: 1, gap: 3 },
  title: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  body: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  badge: {
    minWidth: 64,
    minHeight: 28,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
