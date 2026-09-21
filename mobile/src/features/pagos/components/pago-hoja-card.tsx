import { formatFecha, formatMoney, localesLabel } from "@/features/pagos/lib/format";
import { PagoMetricsGrid } from "@/features/pagos/components/pago-metrics-grid";
import type { HojaPago } from "@/features/pagos/types";
import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

type PagoHojaCardProps = {
  item: HojaPago;
  onOpen: () => void;
};

export function PagoHojaCard({ item, onOpen }: PagoHojaCardProps) {
  const pendiente = item.comprobantesCount === 0;

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View style={styles.head}>
        <View style={[styles.dot, pendiente ? styles.dotWarn : styles.dotOk]} />
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>
            {localesLabel(item.localesNombres)}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {[
              item.conductorNombre,
              item.operadorAcompanante ? `+ ${item.operadorAcompanante}` : null,
              formatFecha(item.fecha),
              item.placa || null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.total} numberOfLines={1}>
            {formatMoney(item.totalGeneral)}
          </Text>
          <View style={[styles.badge, pendiente ? styles.badgeWarn : styles.badgeOk]}>
            <Text style={[styles.badgeText, pendiente ? styles.badgeTextWarn : styles.badgeTextOk]}>
              {pendiente ? "Sin compr." : `${item.comprobantesCount} compr.`}
            </Text>
          </View>
        </View>
      </View>

      <PagoMetricsGrid item={item} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    gap: 10,
  },
  pressed: { backgroundColor: theme.colors.cream },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  dotWarn: { backgroundColor: theme.colors.warn },
  dotOk: { backgroundColor: theme.colors.accent },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { color: theme.colors.ink, fontSize: 14, fontWeight: "800" },
  meta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  right: { alignItems: "flex-end", gap: 4, flexShrink: 0 },
  total: { color: theme.colors.gold, fontSize: 13, fontWeight: "900" },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  badgeWarn: { backgroundColor: theme.colors.warnSoft, borderColor: "#E8C89A" },
  badgeOk: { backgroundColor: theme.colors.accentSoft, borderColor: "#B7D4C8" },
  badgeText: { fontSize: 9, fontWeight: "800" },
  badgeTextWarn: { color: theme.colors.warn },
  badgeTextOk: { color: theme.colors.accent },
});
