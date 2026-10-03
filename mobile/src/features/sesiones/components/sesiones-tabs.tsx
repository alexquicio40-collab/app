import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SesionesTab } from "../types";

type Props = {
  tab: SesionesTab;
  activas: number;
  dispositivos: number;
  soloActivas: boolean;
  onTab: (tab: SesionesTab) => void;
  onFiltro: () => void;
};

export function SesionesTabs({ tab, activas, dispositivos, soloActivas, onTab, onFiltro }: Props) {
  return (
    <View style={styles.wrap}>
      <Chip label={`Sesiones ${activas}`} on={tab === "sesiones"} onPress={() => onTab("sesiones")} />
      <Chip label={`Disp. ${dispositivos}`} on={tab === "dispositivos"} onPress={() => onTab("dispositivos")} />
      {tab === "sesiones" ? (
        <Chip label={soloActivas ? "Activas" : "Todas"} on={soloActivas} onPress={onFiltro} />
      ) : null}
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on ? styles.chipOn : null]}>
      <Text style={[styles.text, on ? styles.textOn : null]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingTop: 8 },
  chip: {
    flex: 1,
    minHeight: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    paddingHorizontal: 8,
  },
  chipOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  text: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  textOn: { color: "#FFFFFF" },
});
