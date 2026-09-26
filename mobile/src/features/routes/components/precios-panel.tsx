import { formatPrecios, hasPrecios, type PreciosLocal } from "@/features/locales/lib/precios";
import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

type PreciosPanelProps = {
  precios: Pick<PreciosLocal, "precioLitro" | "precioBalde" | "precioGalonera">;
  compact?: boolean;
};

export function PreciosPanel({ precios, compact = false }: PreciosPanelProps) {
  if (!hasPrecios(precios)) return null;

  return (
    <View style={[styles.wrap, compact ? styles.wrapCompact : null]}>
      <Text style={styles.title}>Precios</Text>
      <Text style={styles.value}>{formatPrecios(precios)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0C98A",
    backgroundColor: theme.colors.goldSoft,
  },
  wrapCompact: { paddingHorizontal: 10, paddingVertical: 8 },
  title: {
    color: theme.colors.ink,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  value: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
});
