import type { MapFilter } from "@/features/map/types";
import { theme } from "@/lib/theme";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ActionsPanelProps = {
  online: number;
  onRoute: number;
  live: boolean;
  filter: MapFilter;
  onFilter: (value: MapFilter) => void;
  trafficOn: boolean;
  satelliteOn: boolean;
  onTraffic: () => void;
  onSatellite: () => void;
  onRefresh: () => void;
};

const FILTERS: { key: MapFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "en_linea", label: "Línea" },
  { key: "en_ruta", label: "Ruta" },
];

export function ActionsPanel({
  online,
  onRoute,
  live,
  filter,
  onFilter,
  trafficOn,
  satelliteOn,
  onTraffic,
  onSatellite,
  onRefresh,
}: ActionsPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.panel, open ? styles.panelOpen : null]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Acciones"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={styles.handle}
      >
        <Text style={styles.title}>Acciones</Text>
        <View style={[styles.liveDot, live ? styles.liveDotOn : null]} />
        <View style={[styles.chevron, open ? styles.chevronOpen : null]} />
      </Pressable>

      {open ? (
        <View style={styles.body}>
          <Text style={styles.liveLabel}>{live ? "En vivo" : "Polling"}</Text>
          <View style={styles.stats}>
            <Stat value={online} label="Línea" />
            <Stat value={onRoute} label="Ruta" />
          </View>

          <View style={styles.row}>
            {FILTERS.map((item) => (
              <Chip key={item.key} label={item.label} active={filter === item.key} onPress={() => onFilter(item.key)} />
            ))}
          </View>

          <View style={styles.tools}>
            <Tool label="Tráfico" active={trafficOn} onPress={onTraffic} />
            <Tool label="Satélite" active={satelliteOn} onPress={onSatellite} />
            <Tool label="Actualizar" onPress={onRefresh} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, active ? styles.chipOn : null]}>
      <Text style={[styles.chipText, active ? styles.chipTextOn : null]}>{label}</Text>
    </Pressable>
  );
}

function Tool({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.tool, active ? styles.toolOn : null]}>
      <Text style={[styles.toolText, active ? styles.toolTextOn : null]}>{label}</Text>
      {active === undefined ? null : <View style={[styles.dot, active ? styles.dotOn : null]} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: 108,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    overflow: "hidden",
  },
  panelOpen: {
    width: 168,
  },
  handle: {
    minHeight: 40,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
    textTransform: "uppercase",
    flex: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  liveDotOn: {
    backgroundColor: theme.colors.gold,
  },
  liveLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  chevron: {
    width: 7,
    height: 7,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: theme.colors.gold,
    transform: [{ rotate: "45deg" }],
  },
  chevronOpen: {
    transform: [{ rotate: "-135deg" }],
  },
  body: {
    padding: 8,
    gap: 8,
  },
  stats: {
    flexDirection: "row",
    gap: 6,
  },
  stat: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 18,
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    gap: 4,
  },
  chip: {
    flex: 1,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  chipOn: {
    backgroundColor: theme.colors.accent,
  },
  chipText: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "700",
  },
  chipTextOn: {
    color: "#FFFFFF",
  },
  tools: {
    gap: 4,
  },
  tool: {
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toolOn: {
    backgroundColor: theme.colors.accent,
  },
  toolText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  toolTextOn: {
    color: "#FFFFFF",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.line,
  },
  dotOn: {
    backgroundColor: theme.colors.gold,
  },
});
