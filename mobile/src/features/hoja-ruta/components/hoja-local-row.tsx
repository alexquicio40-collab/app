import { filaTotales, sanitizeMoneyInput } from "@/features/hoja-ruta/lib/calc";
import { formatMoney } from "@/features/hoja-ruta/lib/format";
import type { LocalVisitaForm } from "@/features/hoja-ruta/types";
import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type HojaLocalRowProps = {
  index: number;
  item: LocalVisitaForm;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<LocalVisitaForm>) => void;
  onRemove: () => void;
};

export function HojaLocalRow({
  index,
  item,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: HojaLocalRowProps) {
  const totals = filaTotales(item);

  return (
    <View style={[styles.card, expanded ? styles.cardOpen : null]}>
      <View style={styles.head}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={onToggle}
          style={styles.headMain}
        >
          <View style={styles.index}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
          <View style={styles.headCopy}>
            <Text style={styles.title} numberOfLines={1}>
              {item.local.nombre}
            </Text>
            {expanded && item.local.direccion ? (
              <Text style={styles.meta} numberOfLines={1}>
                {item.local.direccion}
              </Text>
            ) : (
              <Text style={styles.meta} numberOfLines={1}>
                {formatMoney(totals.total)}
              </Text>
            )}
          </View>
          <View style={styles.chevron}>
            <Text style={styles.chevronText}>{expanded ? "−" : "+"}</Text>
          </View>
        </Pressable>

        <Pressable accessibilityLabel="Quitar local" onPress={onRemove} style={styles.remove}>
          <Text style={styles.removeText}>×</Text>
        </Pressable>
      </View>

      {expanded ? (
        <>
          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={[styles.colLabel, styles.colConcepto]}>Concepto</Text>
              <Text style={[styles.colLabel, styles.colQty]}>Cant.</Text>
              <Text style={[styles.colLabel, styles.colPrice]}>P. unit.</Text>
              <Text style={[styles.colLabel, styles.colTotal]}>Total</Text>
            </View>

            <EnvaseRow
              label="Galones"
              tone="info"
              qty={item.galones}
              price={item.galonesPrecio}
              total={totals.galones}
              onQty={(galones) => onChange({ galones })}
              onPrice={(galonesPrecio) => onChange({ galonesPrecio })}
            />
            <EnvaseRow
              label="B. vacíos"
              tone="warn"
              qty={item.baldes}
              price={item.baldesPrecio}
              total={totals.baldes}
              onQty={(baldes) => onChange({ baldes })}
              onPrice={(baldesPrecio) => onChange({ baldesPrecio })}
            />
            <EnvaseRow
              label="Litros"
              tone="gold"
              qty={item.litros}
              price={item.litrosPrecio}
              total={totals.litros}
              onQty={(litros) => onChange({ litros })}
              onPrice={(litrosPrecio) => onChange({ litrosPrecio })}
              last
            />
          </View>

          <View style={styles.subtotal}>
            <Text style={styles.subtotalLabel}>Subtotal</Text>
            <Text style={styles.subtotalValue}>{formatMoney(totals.total)}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

function EnvaseRow({
  label,
  tone,
  qty,
  price,
  total,
  onQty,
  onPrice,
  last,
}: {
  label: string;
  tone: "info" | "warn" | "gold";
  qty: string;
  price: string;
  total: number;
  onQty: (v: string) => void;
  onPrice: (v: string) => void;
  last?: boolean;
}) {
  const color =
    tone === "info" ? theme.colors.info : tone === "warn" ? theme.colors.warn : theme.colors.gold;

  return (
    <View style={[styles.row, last ? null : styles.rowBorder]}>
      <Text style={[styles.concepto, { color }]} numberOfLines={1}>
        {label}
      </Text>
      <TextInput
        value={qty}
        onChangeText={(v) => onQty(sanitizeMoneyInput(v))}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={theme.colors.muted}
        style={[styles.input, styles.colQty]}
      />
      <TextInput
        value={price}
        onChangeText={(v) => onPrice(sanitizeMoneyInput(v))}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor={theme.colors.muted}
        style={[styles.input, styles.colPrice]}
      />
      <Text style={[styles.totalCell, { color }]} numberOfLines={1}>
        {formatMoney(total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginTop: 8,
    padding: 10,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    gap: 8,
  },
  cardOpen: {
    borderColor: theme.colors.accent,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  index: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accentSoft,
  },
  indexText: { color: theme.colors.accent, fontSize: 11, fontWeight: "900" },
  headCopy: { flex: 1, minWidth: 0, gap: 1 },
  title: { color: theme.colors.ink, fontSize: 13, fontWeight: "900" },
  meta: { color: theme.colors.muted, fontSize: 10, fontWeight: "600" },
  chevron: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.cream,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  chevronText: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 18,
  },
  remove: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.dangerSoft,
  },
  removeText: { color: theme.colors.danger, fontSize: 17, fontWeight: "700", lineHeight: 18 },
  table: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    overflow: "hidden",
    backgroundColor: theme.colors.cream,
  },
  tableHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  colLabel: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  colConcepto: { flex: 1.15, minWidth: 0 },
  colQty: { width: 58, textAlign: "center" },
  colPrice: { width: 68, textAlign: "center" },
  colTotal: { width: 72, textAlign: "right" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 5,
    gap: 4,
    backgroundColor: theme.colors.surface,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  concepto: {
    flex: 1.15,
    minWidth: 0,
    fontSize: 11,
    fontWeight: "800",
    paddingLeft: 2,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingHorizontal: 4,
    paddingVertical: 6,
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  totalCell: {
    width: 72,
    textAlign: "right",
    fontSize: 11,
    fontWeight: "900",
    paddingRight: 2,
  },
  subtotal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 2,
  },
  subtotalLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  subtotalValue: { color: theme.colors.accent, fontSize: 14, fontWeight: "900" },
});
