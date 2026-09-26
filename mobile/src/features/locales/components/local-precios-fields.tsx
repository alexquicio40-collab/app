import { FieldLabel, FieldRow, TextField } from "@/features/routes/assign/components/form-kit";
import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type PreciosFormValues = {
  precioLitroText: string;
  precioBaldeText: string;
  precioGaloneraText: string;
  operadoresVenPrecio: boolean;
};

type LocalPreciosFieldsProps = {
  value: PreciosFormValues;
  onChange: (next: Partial<PreciosFormValues>) => void;
};

export function LocalPreciosFields({ value, onChange }: LocalPreciosFieldsProps) {
  return (
    <View style={styles.box}>
      <View style={styles.head}>
        <Text style={styles.title}>Precios</Text>
        <Text style={styles.unit}>S/</Text>
      </View>

      <FieldRow>
        <MoneyField
          label="Litro"
          value={value.precioLitroText}
          onChange={(precioLitroText) => onChange({ precioLitroText })}
        />
        <MoneyField
          label="Balde"
          value={value.precioBaldeText}
          onChange={(precioBaldeText) => onChange({ precioBaldeText })}
        />
        <MoneyField
          label="Galonera"
          value={value.precioGaloneraText}
          onChange={(precioGaloneraText) => onChange({ precioGaloneraText })}
        />
      </FieldRow>

      <Pressable
        onPress={() => onChange({ operadoresVenPrecio: !value.operadoresVenPrecio })}
        style={[styles.toggle, value.operadoresVenPrecio ? styles.toggleOn : null]}
      >
        <View style={[styles.dot, value.operadoresVenPrecio ? styles.dotOn : null]} />
        <Text style={[styles.toggleText, value.operadoresVenPrecio ? styles.toggleTextOn : null]}>
          {value.operadoresVenPrecio ? "Operadores ven precios" : "Operadores no ven precios"}
        </Text>
      </Pressable>
    </View>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>
      <TextField
        value={value}
        onChangeText={onChange}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "800",
  },
  unit: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
  },
  field: { flex: 1, minWidth: 0, gap: 3 },
  toggle: {
    minHeight: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  toggleOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.line,
  },
  dotOn: { backgroundColor: theme.colors.accent },
  toggleText: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  toggleTextOn: { color: theme.colors.accent },
});
