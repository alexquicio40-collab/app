import { sanitizeMoneyInput } from "@/features/hoja-ruta/lib/calc";
import { formatMoney } from "@/features/hoja-ruta/lib/format";
import type { HojaTotales } from "@/features/hoja-ruta/types";
import { theme } from "@/lib/theme";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type HojaCierreSectionProps = {
  caja: string;
  totales: HojaTotales;
  exporting: boolean;
  onCaja: (value: string) => void;
  onExport: () => void;
};

export function HojaCierreSection({
  caja,
  totales,
  exporting,
  onCaja,
  onExport,
}: HojaCierreSectionProps) {
  const vueltoOk = totales.vuelto >= 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Caja y cierre del día</Text>

      <View style={styles.cajaWrap}>
        <Text style={styles.label}>Caja (cuánto hay)</Text>
        <TextInput
          value={caja}
          onChangeText={(v) => onCaja(sanitizeMoneyInput(v))}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={theme.colors.muted}
          style={styles.cajaInput}
        />
      </View>

      <View style={styles.lines}>
        <Line label="Galones" value={formatMoney(totales.sumGalones)} />
        <Line label="Baldes vacíos" value={formatMoney(totales.sumBaldes)} />
        <Line label="Litros" value={formatMoney(totales.sumLitros)} />
        <Line label="Gastos personales" value={formatMoney(totales.sumGastos)} last />
        <Line label="Total general" value={formatMoney(totales.totalGeneral)} strong />
      </View>

      <View style={[styles.vuelto, vueltoOk ? styles.vueltoOk : styles.vueltoBad]}>
        <Text
          style={[styles.vueltoLabel, { color: vueltoOk ? theme.colors.accent : theme.colors.danger }]}
        >
          Vuelto
        </Text>
        <Text
          style={[styles.vueltoValue, { color: vueltoOk ? theme.colors.accent : theme.colors.danger }]}
        >
          {formatMoney(totales.vuelto)}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={exporting}
        onPress={onExport}
        style={({ pressed }) => [
          styles.exportBtn,
          pressed || exporting ? styles.exportPressed : null,
        ]}
      >
        {exporting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.exportText}>Exportar hoja de ruta (PDF)</Text>
        )}
      </Pressable>
    </View>
  );
}

function Line({
  label,
  value,
  strong,
  last,
}: {
  label: string;
  value: string;
  strong?: boolean;
  /** Sin borde inferior (cierra el bloque de detalle). */
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.line,
        strong ? styles.lineTotal : null,
        last ? styles.lineLast : null,
      ]}
    >
      <Text style={[styles.lineLabel, strong ? styles.lineStrong : null]}>{label}</Text>
      <Text style={[styles.lineValue, strong ? styles.lineStrong : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 10,
    marginTop: 12,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    gap: 12,
  },
  title: { color: theme.colors.ink, fontSize: 14, fontWeight: "900" },
  cajaWrap: { gap: 6 },
  label: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  cajaInput: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  lines: {
    gap: 0,
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0,
  },
  lineLast: {
    borderBottomWidth: 0,
    paddingBottom: 10,
  },
  lineTotal: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
    borderBottomWidth: 0,
  },
  lineLabel: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  lineValue: { color: theme.colors.ink, fontSize: 13, fontWeight: "800" },
  lineStrong: { color: theme.colors.ink, fontWeight: "900", fontSize: 14 },
  vuelto: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  vueltoOk: { backgroundColor: theme.colors.accentSoft },
  vueltoBad: { backgroundColor: theme.colors.dangerSoft },
  vueltoLabel: { fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  vueltoValue: { fontSize: 18, fontWeight: "900" },
  exportBtn: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: theme.colors.accent,
  },
  exportPressed: { opacity: 0.85 },
  exportText: { color: "#fff", fontSize: 14, fontWeight: "900" },
});
