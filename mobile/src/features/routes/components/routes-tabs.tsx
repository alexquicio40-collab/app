import type { RoutesTabKey } from "@/features/routes/assign/types";
import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

const TABS: { key: RoutesTabKey; label: string }[] = [
  { key: "listado", label: "Listado" },
  { key: "asignacion", label: "Asignar" },
  { key: "programacion", label: "Programa" },
  { key: "orden", label: "Orden" },
  { key: "restriccion", label: "Zonas" },
];

type RoutesTabsProps = {
  value: RoutesTabKey;
  onChange: (value: RoutesTabKey) => void;
};

export function RoutesTabs({ value, onChange }: RoutesTabsProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {TABS.map((tab) => {
          const active = tab.key === value;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(tab.key)}
              style={[styles.tab, active ? styles.tabOn : null]}
            >
              <Text style={[styles.text, active ? styles.textOn : null]} numberOfLines={1}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.accentDeep,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 4,
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
    paddingHorizontal: 2,
  },
  tabOn: {
    backgroundColor: theme.colors.gold,
    borderColor: theme.colors.gold,
  },
  text: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    fontWeight: "700",
  },
  textOn: {
    color: theme.colors.accentDeep,
    fontWeight: "800",
  },
});
