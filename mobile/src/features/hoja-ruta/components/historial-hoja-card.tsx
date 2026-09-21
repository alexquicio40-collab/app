import { formatFechaHora, formatFechaLabel, formatMoney } from "@/features/hoja-ruta/lib/format";
import type { HojaHistorialItem } from "@/features/hoja-ruta/types";
import { theme } from "@/lib/theme";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type HistorialHojaCardProps = {
  item: HojaHistorialItem;
  busy: boolean;
  onPdf: () => void;
  onDelete: () => void;
};

export function HistorialHojaCard({ item, busy, onPdf, onDelete }: HistorialHojaCardProps) {
  const vueltoOk = item.vuelto >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headCopy}>
          <View style={styles.fechaPill}>
            <Text style={styles.fechaText}>
              {item.fecha ? formatFechaLabel(item.fecha) : "Sin fecha"}
            </Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {item.conductorNombre}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {formatFechaHora(item.createdAt)}
          </Text>
        </View>
        <View style={styles.vueltoBox}>
          <Text style={styles.vueltoLabel}>Vuelto</Text>
          <Text
            style={[styles.vueltoValue, { color: vueltoOk ? theme.colors.accent : theme.colors.danger }]}
            numberOfLines={1}
          >
            {formatMoney(item.vuelto)}
          </Text>
        </View>
      </View>

      <View style={styles.chips}>
        {item.operadorAcompanante ? (
          <Chip label={item.operadorAcompanante} tone="info" />
        ) : null}
        {item.placa ? <Chip label={item.placa} tone="accent" /> : null}
        <Chip label={`Total ${formatMoney(item.totalGeneral)}`} tone="gold" />
      </View>

      <View style={styles.metrics}>
        <Metric label="Galones" value={formatMoney(item.totalGalones)} />
        <Metric label="Baldes" value={formatMoney(item.totalBaldes)} />
        <Metric label="Litros" value={formatMoney(item.totalLitros)} />
        <Metric label="Gastos" value={formatMoney(item.totalGastos)} />
      </View>

      <View style={styles.actions}>
        <Pressable
          disabled={busy}
          onPress={onPdf}
          style={({ pressed }) => [
            styles.pdfBtn,
            pressed || busy ? styles.pdfPressed : null,
          ]}
        >
          {busy ? (
            <ActivityIndicator color={theme.colors.danger} size="small" />
          ) : (
            <Text style={styles.pdfText}>Regenerar PDF</Text>
          )}
        </Pressable>
        <Pressable
          disabled={busy}
          accessibilityLabel="Eliminar hoja"
          onPress={onDelete}
          style={styles.deleteBtn}
        >
          <Text style={styles.deleteText}>×</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Chip({ label, tone }: { label: string; tone: "info" | "accent" | "gold" }) {
  const bg =
    tone === "info"
      ? theme.colors.infoSoft
      : tone === "gold"
        ? theme.colors.goldSoft
        : theme.colors.accentSoft;
  const fg =
    tone === "info"
      ? theme.colors.info
      : tone === "gold"
        ? theme.colors.gold
        : theme.colors.accent;

  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginTop: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    gap: 10,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  headCopy: { flex: 1, minWidth: 0, gap: 4 },
  fechaPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: theme.colors.infoSoft,
  },
  fechaText: { color: theme.colors.info, fontSize: 11, fontWeight: "800" },
  title: { color: theme.colors.ink, fontSize: 15, fontWeight: "900" },
  meta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  vueltoBox: { alignItems: "flex-end", gap: 2, minWidth: 88 },
  vueltoLabel: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  vueltoValue: { fontSize: 14, fontWeight: "900" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    maxWidth: "100%",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: { fontSize: 11, fontWeight: "800" },
  metrics: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: "hidden",
  },
  metric: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 2,
    backgroundColor: theme.colors.cream,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: theme.colors.line,
  },
  metricValue: { color: theme.colors.ink, fontSize: 10, fontWeight: "900" },
  metricLabel: {
    color: theme.colors.muted,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pdfBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.danger,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.dangerSoft,
  },
  pdfPressed: { opacity: 0.75 },
  pdfText: { color: theme.colors.danger, fontSize: 12, fontWeight: "800" },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.dangerSoft,
    borderWidth: 1.5,
    borderColor: "#E8B4B0",
  },
  deleteText: { color: theme.colors.danger, fontSize: 20, fontWeight: "700", lineHeight: 22 },
});
