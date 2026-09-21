import { formatQty } from "@/features/reportes-kpi/lib/format";
import { formatIngresoShort } from "@/features/reportes-kpi/lib/period";
import type { PlantaDetalleItem } from "@/features/reportes-kpi/types";
import { theme } from "@/lib/theme";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReportPlantaDetailSheetProps = {
  open: boolean;
  items: PlantaDetalleItem[];
  rangeLabel: string;
  onClose: () => void;
};

export function ReportPlantaDetailSheet({
  open,
  items,
  rangeLabel,
  onClose,
}: ReportPlantaDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const totals = items.reduce(
    (acc, item) => {
      acc.litros += item.litros;
      acc.baldes += item.baldes;
      acc.galoneras += item.galoneras;
      return acc;
    },
    { litros: 0, baldes: 0, galoneras: 0 },
  );

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.handle} />

          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={styles.kicker}>Planta</Text>
              <Text style={styles.title}>Ingresos del período</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {rangeLabel} · {items.length} registro{items.length === 1 ? "" : "s"}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={onClose}
              style={styles.close}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.summary}>
            <SummaryStat label="Litros" value={formatQty(totals.litros)} tone="accent" />
            <SummaryStat label="Baldes" value={formatQty(totals.baldes)} tone="info" />
            <SummaryStat label="Galoneras" value={formatQty(totals.galoneras)} tone="gold" />
          </View>

          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Sin registros</Text>
                <Text style={styles.emptyText}>No hay ingresos de planta en este período.</Text>
              </View>
            }
            renderItem={({ item }) => <DetalleCard item={item} />}
          />
        </View>
      </View>
    </Modal>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "accent" | "info" | "gold";
}) {
  const color =
    tone === "info" ? theme.colors.info : tone === "gold" ? theme.colors.gold : theme.colors.accent;

  return (
    <View style={styles.summaryStat}>
      <Text style={[styles.summaryValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function DetalleCard({ item }: { item: PlantaDetalleItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.idPill}>
          <Text style={styles.idText}>#{item.id}</Text>
        </View>
        <Text style={styles.cardDate} numberOfLines={1}>
          {formatIngresoShort(item.ingreso)}
        </Text>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.proveedor || "Sin proveedor"}
      </Text>

      <Text style={styles.cardMeta} numberOfLines={1}>
        {[item.asesor || null, item.guia ? `Guía ${item.guia}` : null]
          .filter(Boolean)
          .join(" · ") || "Sin asesor / guía"}
      </Text>

      <View style={styles.metrics}>
        <Metric label="Litros" value={formatQty(item.litros)} tone="accent" />
        <Metric label="Baldes" value={formatQty(item.baldes)} tone="info" />
        <Metric label="Galoneras" value={formatQty(item.galoneras)} tone="gold" />
      </View>

      {item.notas?.trim() ? (
        <Text style={styles.notes} numberOfLines={3}>
          {item.notas.trim()}
        </Text>
      ) : null}
    </View>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "accent" | "info" | "gold";
}) {
  const color =
    tone === "info" ? theme.colors.info : tone === "gold" ? theme.colors.gold : theme.colors.accent;

  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "88%",
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
    marginTop: 10,
    marginBottom: 6,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  kicker: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
  },
  closeText: {
    color: theme.colors.muted,
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 24,
  },
  summary: {
    flexDirection: "row",
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    gap: 4,
  },
  summaryStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    minWidth: 0,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "900",
  },
  summaryLabel: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 8,
  },
  empty: {
    paddingTop: 40,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: "center",
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    padding: 12,
    gap: 8,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  idPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: theme.colors.accentSoft,
  },
  idText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "800",
  },
  cardDate: {
    flex: 1,
    textAlign: "right",
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  cardTitle: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  cardMeta: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  metrics: {
    flexDirection: "row",
    gap: 6,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 2,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.cream,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "900",
  },
  metricLabel: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  notes: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    paddingTop: 2,
  },
});
