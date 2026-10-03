import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { horaCorta } from "../lib/format";
import { accionLabel, accionTone, inicial, moduloLabel } from "../lib/labels";
import type { BitacoraEvento } from "../types";

type Props = {
  item: BitacoraEvento;
  onPress: () => void;
};

export function BitacoraRow({ item, onPress }: Props) {
  const tone = accionTone(item.accion);
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={[styles.mark, { backgroundColor: tone.bg }]}>
        <Text style={[styles.inicial, { color: tone.fg }]}>{inicial(item.usuario)}</Text>
      </View>
      <View style={styles.copy}>
        <View style={styles.top}>
          <Text style={styles.user} numberOfLines={1}>
            {item.usuario}
          </Text>
          <Text style={styles.hora}>{horaCorta(item.cuando)}</Text>
        </View>
        <Text style={styles.resumen} numberOfLines={2}>
          {item.resumen}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.badge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.badgeText, { color: tone.fg }]}>{accionLabel(item.accion)}</Text>
          </View>
          <Text style={styles.mod} numberOfLines={1}>
            {moduloLabel(item.modulo)}
            {item.ip ? ` · ${item.ip}` : ""}
          </Text>
        </View>
      </View>
    </Pressable>
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
    gap: 10,
  },
  mark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  inicial: { fontSize: 14, fontWeight: "900" },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  top: { flexDirection: "row", alignItems: "center", gap: 8 },
  user: { flex: 1, color: theme.colors.ink, fontSize: 13, fontWeight: "800" },
  hora: { color: theme.colors.muted, fontSize: 11, fontWeight: "700" },
  resumen: { color: theme.colors.ink, fontSize: 12, fontWeight: "600", lineHeight: 16 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  badge: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: "800" },
  mod: { flex: 1, color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
});
