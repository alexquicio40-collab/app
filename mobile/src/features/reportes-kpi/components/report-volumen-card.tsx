import { formatQty } from "@/features/reportes-kpi/lib/format";
import type { VolumenResumen } from "@/features/reportes-kpi/types";
import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

type ReportVolumenCardProps = {
  volumen: VolumenResumen;
};

export function ReportVolumenCard({ volumen }: ReportVolumenCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Volumen, frecuencia y anclas</Text>
      <View style={styles.hero}>
        <Metric label="Distrito top" value={volumen.distritoTop} hint={`${formatQty(volumen.distritoLitros)} L`} />
        <Metric label="Anclas" value={String(volumen.anclasTotal)} hint="mayor volumen" />
      </View>
      {volumen.proveedoresTop.length ? (
        <View style={styles.list}>
          {volumen.proveedoresTop.map((item) => (
            <View key={item.nombre} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.distrito}
                  {item.ancla ? " · ancla" : ""}
                </Text>
              </View>
              <Text style={styles.qty}>{formatQty(item.litros)} L</Text>
              <Text style={styles.freq}>{item.recojos}x</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>Sin recojos con litraje en el periodo.</Text>
      )}
    </View>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={2}>
        {value}
      </Text>
      <Text style={styles.metricHint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    gap: 10,
  },
  title: { color: theme.colors.ink, fontSize: 14, fontWeight: "800" },
  hero: { flexDirection: "row", gap: 8 },
  metric: {
    flex: 1,
    minWidth: 0,
    padding: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.cream,
    gap: 2,
  },
  metricLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metricValue: { color: theme.colors.ink, fontSize: 14, fontWeight: "800" },
  metricHint: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  list: { gap: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
  },
  rowText: { flex: 1, minWidth: 0, gap: 1 },
  name: { color: theme.colors.ink, fontSize: 13, fontWeight: "800" },
  meta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  qty: { color: theme.colors.accent, fontSize: 12, fontWeight: "800" },
  freq: { color: theme.colors.gold, fontSize: 12, fontWeight: "800", width: 28, textAlign: "right" },
  empty: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
});
