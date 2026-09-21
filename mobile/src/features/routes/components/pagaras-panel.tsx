import type { RouteMetodoPago } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

type PagarasPanelProps = {
  metodos: RouteMetodoPago[];
  compact?: boolean;
};

export function hasPagarasInfo(metodos: RouteMetodoPago[]) {
  return metodos.length > 0;
}

/** Panel "Pagarás en:" — métodos de pago del local. */
export function PagarasPanel({ metodos, compact = false }: PagarasPanelProps) {
  if (!metodos.length) return null;

  return (
    <View style={[styles.wrap, compact ? styles.wrapCompact : null]}>
      <Text style={styles.title}>Pagarás en</Text>
      <View style={styles.chips}>
        {metodos.map((item) => (
          <View key={`${item.id}-${item.nombre}`} style={styles.chip}>
            <View style={styles.mark} />
            <Text style={styles.chipText}>{item.nombre}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#C5D9C8",
    backgroundColor: "#EAF5EC",
  },
  wrapCompact: { padding: 10 },
  title: {
    color: "#1B5E20",
    fontSize: 13,
    fontWeight: "900",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#A5D6A7",
    backgroundColor: "#FFFFFF",
  },
  mark: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#2E7D32",
  },
  chipText: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "800",
  },
});
