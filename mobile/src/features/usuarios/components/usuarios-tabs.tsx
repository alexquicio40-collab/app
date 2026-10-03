import type { UsuariosTab } from "../ubicacion/types";
import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  tab: UsuariosTab;
  onTab: (tab: UsuariosTab) => void;
};

export function UsuariosTabs({ tab, onTab }: Props) {
  return (
    <View style={styles.wrap}>
      <Chip label="Lista" on={tab === "lista"} onPress={() => onTab("lista")} />
      <Chip label="Ubicación" on={tab === "ubicacion"} onPress={() => onTab("ubicacion")} />
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
  wrap: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 2,
    backgroundColor: theme.colors.surface,
  },
  chip: {
    flex: 1,
    minHeight: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.cream,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  chipOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  text: { color: theme.colors.muted, fontSize: 12, fontWeight: "800" },
  textOn: { color: "#FFFFFF" },
});
