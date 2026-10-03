import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatCuando } from "../lib/format";
import type { SesionItem } from "../types";

type Props = {
  item: SesionItem;
  busy?: boolean;
  onCerrar: () => void;
  onCerrarTodas: () => void;
};

export function SesionCard({ item, busy, onCerrar, onCerrarTodas }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {item.usuario}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {[item.dispositivo || "Dispositivo", item.ip || "sin IP", formatCuando(item.inicio)].join(" · ")}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.badge, item.abierta ? styles.ok : styles.off]}>
          {item.mia ? "ESTA" : item.abierta ? "ACTIVA" : "CERRADA"}
        </Text>
        {item.abierta && !item.mia ? (
          <View style={styles.row}>
            <Pressable onPress={onCerrarTodas} disabled={busy} style={styles.soft}>
              <Text style={styles.softText}>Todas</Text>
            </Pressable>
            <Pressable onPress={onCerrar} disabled={busy} style={styles.danger}>
              <Text style={styles.dangerText}>Cerrar</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginBottom: 6,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { color: theme.colors.ink, fontSize: 13, fontWeight: "800" },
  meta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  right: { alignItems: "flex-end", gap: 6 },
  badge: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
  ok: { color: theme.colors.accent },
  off: { color: theme.colors.warn },
  row: { flexDirection: "row", gap: 4 },
  soft: {
    backgroundColor: theme.colors.cream,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  softText: { color: theme.colors.ink, fontSize: 11, fontWeight: "800" },
  danger: {
    backgroundColor: theme.colors.danger,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dangerText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
});
