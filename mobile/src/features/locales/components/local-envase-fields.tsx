import { ENVASE_OPTIONS, isBidonEnvase } from "@/features/locales/lib/format";
import {
  FieldLabel,
  FieldRow,
  SelectField,
  TextField,
} from "@/features/routes/assign/components/form-kit";
import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

export type EnvaseFormValues = {
  tipoEnvase: string | null;
  qtyEnvases: string;
  qtyAzules: string;
  qtyBlancos: string;
  bidonRealText: string;
  bidonPasadoText: string;
};

type LocalEnvaseFieldsProps = {
  value: EnvaseFormValues;
  onChange: (next: Partial<EnvaseFormValues>) => void;
};

/**
 * Cascada de envases (misma lógica que Flutter):
 * 1. Tipo + cantidad siempre
 * 2. Si tipo = bidón → azules / blancos
 * 3. Bidón personalizado opcional (independiente del tipo)
 */
export function LocalEnvaseFields({ value, onChange }: LocalEnvaseFieldsProps) {
  const isBidon = isBidonEnvase(value.tipoEnvase);

  const onTipoChange = (tipoEnvase: string | null) => {
    if (!isBidonEnvase(tipoEnvase)) {
      onChange({ tipoEnvase, qtyAzules: "", qtyBlancos: "" });
      return;
    }
    onChange({ tipoEnvase });
  };

  return (
    <View style={styles.wrap}>
      <FieldRow>
        <SelectField
          flex
          label="Tipo de envase"
          value={value.tipoEnvase}
          placeholder="Seleccionar…"
          options={ENVASE_OPTIONS.map((item) => ({
            value: item.value,
            label: item.label,
          }))}
          onChange={onTipoChange}
        />
        <View style={styles.half}>
          <FieldLabel>Cantidad envases</FieldLabel>
          <TextField
            value={value.qtyEnvases}
            onChangeText={(qtyEnvases) => onChange({ qtyEnvases })}
            placeholder="Ej: 10"
            keyboardType="number-pad"
          />
        </View>
      </FieldRow>

      {isBidon ? (
        <FieldRow>
          <View style={styles.half}>
            <FieldLabel>Bidones azules</FieldLabel>
            <TextField
              value={value.qtyAzules}
              onChangeText={(qtyAzules) => onChange({ qtyAzules })}
              placeholder="Ej: 5"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.half}>
            <FieldLabel>Bidones blancos</FieldLabel>
            <TextField
              value={value.qtyBlancos}
              onChangeText={(qtyBlancos) => onChange({ qtyBlancos })}
              placeholder="Ej: 5"
              keyboardType="number-pad"
            />
          </View>
        </FieldRow>
      ) : null}

      <View style={styles.customBox}>
        <Text style={styles.customTitle}>Bidón personalizado (opcional)</Text>
        <Text style={styles.customHint}>
          Equivalencia: real → pasado por (ej. 40 → 20)
        </Text>
        <FieldRow>
          <View style={styles.half}>
            <FieldLabel>Real</FieldLabel>
            <TextField
              value={value.bidonRealText}
              onChangeText={(bidonRealText) => onChange({ bidonRealText })}
              placeholder="Ej: 40"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.half}>
            <FieldLabel>Pasado por</FieldLabel>
            <TextField
              value={value.bidonPasadoText}
              onChangeText={(bidonPasadoText) => onChange({ bidonPasadoText })}
              placeholder="Ej: 20"
              keyboardType="number-pad"
            />
          </View>
        </FieldRow>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  half: { flex: 1, minWidth: 0, gap: 3 },
  customBox: {
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
  },
  customTitle: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "800",
  },
  customHint: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
  },
});
