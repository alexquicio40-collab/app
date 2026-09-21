import { sanitizeMoneyInput } from "@/features/hoja-ruta/lib/calc";
import { formatMoney } from "@/features/hoja-ruta/lib/format";
import type { GastoForm } from "@/features/hoja-ruta/types";
import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type HojaGastosSectionProps = {
  gastos: GastoForm[];
  total: number;
  onAdd: () => void;
  onChange: (key: string, patch: Partial<GastoForm>) => void;
  onRemove: (key: string) => void;
};

export function HojaGastosSection({
  gastos,
  total,
  onAdd,
  onChange,
  onRemove,
}: HojaGastosSectionProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.headCopy}>
          <Text style={styles.title}>Gastos personales</Text>
          <Text style={styles.meta}>
            {gastos.length} registro{gastos.length === 1 ? "" : "s"}
          </Text>
        </View>
        <Pressable onPress={onAdd} style={styles.add}>
          <Text style={styles.addText}>+ Agregar</Text>
        </Pressable>
      </View>

      {gastos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Sin gastos. Toca Agregar si hubo egresos.</Text>
        </View>
      ) : (
        gastos.map((item) => (
          <View key={item.key} style={styles.row}>
            <TextInput
              value={item.descripcion}
              onChangeText={(descripcion) => onChange(item.key, { descripcion })}
              placeholder="Descripción"
              placeholderTextColor={theme.colors.muted}
              style={[styles.input, styles.desc]}
            />
            <TextInput
              value={item.monto}
              onChangeText={(monto) => onChange(item.key, { monto: sanitizeMoneyInput(monto) })}
              placeholder="0.00"
              placeholderTextColor={theme.colors.muted}
              keyboardType="decimal-pad"
              style={[styles.input, styles.monto]}
            />
            <Pressable onPress={() => onRemove(item.key)} style={styles.remove}>
              <Text style={styles.removeText}>×</Text>
            </Pressable>
          </View>
        ))
      )}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total gastos</Text>
        <Text style={styles.totalValue}>{formatMoney(total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 10,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    gap: 10,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headCopy: { flex: 1, gap: 1 },
  title: { color: theme.colors.ink, fontSize: 14, fontWeight: "900" },
  meta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  add: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: theme.colors.accentSoft,
  },
  addText: { color: theme.colors.accent, fontSize: 12, fontWeight: "800" },
  empty: { paddingVertical: 8 },
  emptyText: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  desc: { flex: 1.4, minWidth: 0 },
  monto: { flex: 0.8, minWidth: 72, textAlign: "right" },
  remove: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.dangerSoft,
  },
  removeText: { color: theme.colors.danger, fontSize: 18, fontWeight: "700", lineHeight: 20 },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
  },
  totalLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  totalValue: { color: theme.colors.warn, fontSize: 15, fontWeight: "900" },
});
