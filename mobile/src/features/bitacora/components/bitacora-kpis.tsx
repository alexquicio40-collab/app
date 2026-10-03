import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";
import type { BitacoraResumen } from "../types";

type Props = { resumen: BitacoraResumen };

export function BitacoraKpis({ resumen }: Props) {
  const items = [
    { label: "Total", value: resumen.total, tone: theme.colors.ink },
    { label: "Creó", value: resumen.crear, tone: theme.colors.accent },
    { label: "Editó", value: resumen.editar, tone: theme.colors.info },
    { label: "Eliminó", value: resumen.eliminar, tone: theme.colors.danger },
    { label: "Vio", value: resumen.ver, tone: theme.colors.muted },
    { label: "Registró", value: resumen.registrar, tone: theme.colors.gold },
  ];

  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <View key={item.label} style={styles.cell}>
          <Text style={[styles.value, { color: item.tone }]}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 10,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    flexDirection: "row",
  },
  cell: { flex: 1, alignItems: "center", gap: 1 },
  value: { fontSize: 15, fontWeight: "900" },
  label: { color: theme.colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.2 },
});
