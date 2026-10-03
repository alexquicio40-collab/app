import { theme } from "@/lib/theme";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { horaCorta } from "../lib/format";
import { accionLabel, accionTone, moduloLabel } from "../lib/labels";
import type { BitacoraEvento } from "../types";

type Props = {
  item: BitacoraEvento | null;
  onClose: () => void;
};

export function BitacoraDetalleSheet({ item, onClose }: Props) {
  const insets = useSafeAreaInsets();
  if (!item) return null;
  const tone = accionTone(item.accion);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={[styles.badge, { backgroundColor: tone.bg }]}>
              <Text style={[styles.badgeText, { color: tone.fg }]}>{accionLabel(item.accion)}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>{item.resumen}</Text>
          <Text style={styles.when}>{item.cuando.replace("T", " ").slice(0, 19)}</Text>

          <Pair left="Quién" leftValue={item.usuario} right="Rol" rightValue={item.rol || "—"} />
          <Pair left="Módulo" leftValue={moduloLabel(item.modulo)} right="Hora" rightValue={horaCorta(item.cuando)} />
          <Field label="IP" value={item.ip || "—"} />
        </View>
      </View>
    </Modal>
  );
}

function Pair({
  left,
  leftValue,
  right,
  rightValue,
}: {
  left: string;
  leftValue: string;
  right: string;
  rightValue: string;
}) {
  return (
    <View style={styles.pair}>
      <Field label={left} value={leftValue} />
      <Field label={right} value={rightValue} />
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(8,61,48,0.45)", justifyContent: "flex-end" },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 8,
  },
  handle: {
    alignSelf: "center",
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
    marginBottom: 4,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "800" },
  close: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.cream,
  },
  closeText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  title: { color: theme.colors.ink, fontSize: 16, fontWeight: "900" },
  when: { color: theme.colors.muted, fontSize: 12, fontWeight: "600", marginTop: -4 },
  pair: { flexDirection: "row", gap: 8 },
  field: {
    flex: 1,
    backgroundColor: theme.colors.cream,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  fieldLabel: { color: theme.colors.muted, fontSize: 10, fontWeight: "800" },
  fieldValue: { color: theme.colors.ink, fontSize: 13, fontWeight: "700" },
});
