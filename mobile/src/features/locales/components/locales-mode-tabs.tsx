import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type LocalesViewMode = "lista" | "mapa";

type LocalesModeTabsProps = {
  value: LocalesViewMode;
  onChange: (value: LocalesViewMode) => void;
  mapCount: number;
};

export function LocalesModeTabs({ value, onChange, mapCount }: LocalesModeTabsProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Tab
          label="Lista"
          active={value === "lista"}
          onPress={() => onChange("lista")}
        />
        <Tab
          label={mapCount > 0 ? `Mapa · ${mapCount}` : "Mapa"}
          active={value === "mapa"}
          onPress={() => onChange("mapa")}
        />
      </View>
      {value === "mapa" ? (
        <View style={styles.legend}>
          <LegendDot color={theme.colors.gold} label="Necesita cert." />
          <LegendDot color={theme.colors.danger} label="No necesita" />
        </View>
      ) : null}
    </View>
  );
}

function Tab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.tab, active ? styles.tabOn : null]}
    >
      <Text style={[styles.tabText, active ? styles.tabTextOn : null]}>{label}</Text>
    </Pressable>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 2,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: theme.colors.accentDeep,
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  tabOn: {
    backgroundColor: theme.colors.gold,
    borderColor: theme.colors.gold,
  },
  tabText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "700",
  },
  tabTextOn: {
    color: theme.colors.accentDeep,
    fontWeight: "800",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "700",
  },
});
