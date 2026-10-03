import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatCuando } from "../lib/format";
import type { DispositivoItem } from "../types";

type Props = {
  item: DispositivoItem;
  mio?: boolean;
  busy?: boolean;
  onBloquear: () => void;
  onAutorizar: () => void;
  onEliminar: () => void;
};

export function DispositivoCard({ item, mio, busy, onBloquear, onAutorizar, onEliminar }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {item.codigo || item.nombre}
          {mio ? " · este" : ""}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {[item.nombre, item.plataforma || "—", item.usuario || "sin usuario", formatCuando(item.ultimo)].join(
            " · ",
          )}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.badge, item.autorizado ? styles.ok : styles.off]}>
          {item.autorizado ? "OK" : "PENDIENTE"}
        </Text>
        {item.autorizado ? (
          <Pressable onPress={onBloquear} disabled={busy} style={styles.soft}>
            <Text style={styles.softText}>Bloquear</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onAutorizar} disabled={busy} style={styles.okBtn}>
            <Text style={styles.okText}>Autorizar</Text>
          </Pressable>
        )}
        <Pressable onPress={onEliminar} disabled={busy} style={styles.danger}>
          <Text style={styles.dangerText}>Quitar</Text>
        </Pressable>
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
  badge: { fontSize: 10, fontWeight: "800" },
  ok: { color: theme.colors.accent },
  off: { color: theme.colors.warn },
  soft: {
    backgroundColor: theme.colors.cream,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  softText: { color: theme.colors.ink, fontSize: 11, fontWeight: "800" },
  okBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  okText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  danger: {
    backgroundColor: theme.colors.danger,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dangerText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
});
