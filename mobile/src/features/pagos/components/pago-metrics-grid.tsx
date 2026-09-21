import { formatMoney, formatQty } from "@/features/pagos/lib/format";
import type { HojaPago } from "@/features/pagos/types";
import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

type PagoMetricsGridProps = {
  item: HojaPago;
  /** Muestra el total general debajo de la grilla. */
  showTotal?: boolean;
};

/** Grilla 3×2 libre (solo divisores internos) + total opcional abajo. */
export function PagoMetricsGrid({ item, showTotal = false }: PagoMetricsGridProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        <Cell label="Caja" value={formatMoney(item.caja)} edge="tr" />
        <Cell label="Galones" value={formatQty(item.totalGalones)} edge="tr" />
        <Cell label="Litros" value={formatQty(item.totalLitros)} edge="t" />
        <Cell label="Baldes" value={formatQty(item.totalBaldes)} edge="r" />
        <Cell label="Gastos" value={formatMoney(item.totalGastos)} edge="r" />
        <Cell label="Vuelto" value={formatMoney(item.vuelto)} edge="none" />
      </View>

      {showTotal ? (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatMoney(item.totalGeneral)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Cell({
  label,
  value,
  edge,
}: {
  label: string;
  value: string;
  edge: "tr" | "t" | "r" | "none";
}) {
  return (
    <View
      style={[
        styles.cell,
        edge === "tr" || edge === "t" ? styles.borderBottom : null,
        edge === "tr" || edge === "r" ? styles.borderRight : null,
      ]}
    >
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "33.333%",
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 2,
    alignItems: "flex-start",
  },
  borderRight: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: theme.colors.line,
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  value: { color: theme.colors.ink, fontSize: 13, fontWeight: "900" },
  label: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingHorizontal: 4,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
  },
  totalLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  totalValue: {
    color: theme.colors.gold,
    fontSize: 18,
    fontWeight: "900",
  },
});
