import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { HojaRutaTab } from "../types";

type HojaRutaTabsProps = {
  tab: HojaRutaTab;
  historialCount: number;
  onChange: (tab: HojaRutaTab) => void;
};

export function HojaRutaTabs({ tab, historialCount, onChange }: HojaRutaTabsProps) {
  return (
    <View style={styles.wrap}>
      <Tab
        label="Nueva"
        active={tab === "nueva"}
        onPress={() => onChange("nueva")}
      />
      <Tab
        label={`Historial (${historialCount})`}
        active={tab === "historial"}
        onPress={() => onChange("historial")}
      />
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
      onPress={onPress}
      style={[styles.tab, active ? styles.tabOn : null]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.tabText, active ? styles.tabTextOn : null]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    marginHorizontal: 10,
    marginTop: 8,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  tabOn: {
    backgroundColor: theme.colors.goldSoft,
    borderWidth: 1,
    borderColor: "#E0C98A",
  },
  tabText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  tabTextOn: { color: theme.colors.gold, fontWeight: "800" },
});
