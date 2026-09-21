import { estadoLabel, estadoTone } from "@/features/routes/lib/format";
import type { RouteEstado } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

const TONE = {
  warn: { fg: theme.colors.warn, bg: theme.colors.warnSoft },
  info: { fg: theme.colors.info, bg: theme.colors.infoSoft },
  ok: { fg: theme.colors.accent, bg: theme.colors.accentSoft },
  danger: { fg: theme.colors.danger, bg: theme.colors.dangerSoft },
  muted: { fg: theme.colors.muted, bg: theme.colors.cream },
} as const;

export function StatusBadge({ estado, compact = false }: { estado: RouteEstado; compact?: boolean }) {
  const tone = TONE[estadoTone(estado)];
  return (
    <View style={[styles.badge, compact ? styles.compact : null, { backgroundColor: tone.bg }]}>
      <View style={[styles.dot, { backgroundColor: tone.fg }]} />
      <Text style={[styles.text, compact ? styles.textCompact : null, { color: tone.fg }]}>
        {estadoLabel(estado)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  compact: {
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
  },
  textCompact: {
    fontSize: 10,
  },
});
