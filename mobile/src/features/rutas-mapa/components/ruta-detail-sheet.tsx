import { estadoColor, estadoLabel } from "@/features/rutas-mapa/lib/format";
import type { RouteItem } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type RutaDetailSheetProps = {
  ruta: RouteItem | null;
  accentColor: string;
  onClose: () => void;
};

export function RutaDetailSheet({ ruta, accentColor, onClose }: RutaDetailSheetProps) {
  const insets = useSafeAreaInsets();
  if (!ruta) return null;

  const estadoTone = estadoColor(ruta.estado);
  const canCall = Boolean(ruta.encargadoTelefono.trim());
  const canNavigate = ruta.localLatitud != null && ruta.localLongitud != null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.handle} />

          <View style={styles.head}>
            {ruta.orden != null && ruta.orden > 0 ? (
              <View style={[styles.orden, { backgroundColor: accentColor }]}>
                <Text style={styles.ordenText}>{ruta.orden}</Text>
              </View>
            ) : (
              <View style={[styles.orden, { backgroundColor: accentColor }]}>
                <Text style={styles.ordenText}>•</Text>
              </View>
            )}
            <View style={styles.headCopy}>
              <Text style={styles.title} numberOfLines={2}>
                {ruta.localNombre}
              </Text>
              {ruta.localDireccion ? (
                <Text style={styles.subtitle} numberOfLines={2}>
                  {ruta.localDireccion}
                </Text>
              ) : null}
            </View>
            <View style={[styles.badge, { backgroundColor: `${estadoTone}18`, borderColor: `${estadoTone}55` }]}>
              <Text style={[styles.badgeText, { color: estadoTone }]}>
                {estadoLabel(ruta.estado)}
              </Text>
            </View>
          </View>

          <View style={styles.rows}>
            <Row label="Operador" value={ruta.conductorNombre} color={accentColor} />
            {ruta.encargadoNombre ? <Row label="Encargado" value={ruta.encargadoNombre} /> : null}
            {ruta.encargadoTelefono ? <Row label="Teléfono" value={ruta.encargadoTelefono} /> : null}
            {ruta.fechaCompletada ? <Row label="Completada" value={ruta.fechaCompletada} /> : null}
            {ruta.observaciones ? <Row label="Observaciones" value={ruta.observaciones} /> : null}
          </View>

          <View style={styles.actions}>
            {canNavigate ? (
              <Pressable
                style={[styles.action, styles.actionPrimary]}
                onPress={() => {
                  void Linking.openURL(
                    `https://www.google.com/maps/dir/?api=1&destination=${ruta.localLatitud},${ruta.localLongitud}`,
                  );
                }}
              >
                <Text style={styles.actionPrimaryText}>Cómo llegar</Text>
              </Pressable>
            ) : null}
            {canCall ? (
              <Pressable
                style={styles.action}
                onPress={() => {
                  void Linking.openURL(`tel:${ruta.encargadoTelefono.replace(/\s+/g, "")}`);
                }}
              >
                <Text style={styles.actionText}>Llamar</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.action} onPress={onClose}>
              <Text style={styles.actionText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 12,
    ...Platform.select({
      web: { maxWidth: 520, width: "100%", alignSelf: "center" },
      default: {},
    }),
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
  },
  head: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  orden: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  ordenText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  headCopy: { flex: 1, minWidth: 0, gap: 2 },
  title: { color: theme.colors.ink, fontSize: 16, fontWeight: "800" },
  subtitle: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: "800" },
  rows: { gap: 8 },
  row: { gap: 2 },
  rowLabel: { color: theme.colors.muted, fontSize: 10, fontWeight: "700" },
  rowValue: { color: theme.colors.ink, fontSize: 13, fontWeight: "700" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surface,
  },
  actionPrimary: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  actionText: { color: theme.colors.accent, fontSize: 12, fontWeight: "800" },
  actionPrimaryText: { color: "#fff", fontSize: 12, fontWeight: "800" },
});
