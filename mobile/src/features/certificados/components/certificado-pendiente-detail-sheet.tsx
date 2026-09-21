import { envaseTexto, formatRutaVinculada } from "@/features/certificados/lib/format";
import type { CertificadoPendiente } from "@/features/certificados/types";
import { GhostButton } from "@/features/routes/assign/components/form-kit";
import { theme } from "@/lib/theme";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CertificadoPendienteDetailSheetProps = {
  item: CertificadoPendiente | null;
  onClose: () => void;
};

export function CertificadoPendienteDetailSheet({
  item,
  onClose,
}: CertificadoPendienteDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const open = Boolean(item);
  const envase = item ? envaseTexto(item) : "";

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {item ? (
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <View style={styles.head}>
              <View style={styles.headCopy}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Pendiente</Text>
                </View>
                <Text style={styles.title} numberOfLines={2}>
                  {item.nombre}
                </Text>
              </View>
              <Pressable accessibilityLabel="Cerrar" onPress={onClose} style={styles.close}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
            >
              <Pair label="Dirección" value={item.direccion || "—"} />
              <Pair label="RUC" value={item.ruc || "—"} />
              <Pair label="Razón social" value={item.razonSocial || "—"} />
              <Pair
                label="Encargado"
                value={
                  [item.encargadoTienda || null, item.telefonoEncargado || null]
                    .filter(Boolean)
                    .join(" · ") || "—"
                }
              />
              <Pair
                label="Asesor"
                value={
                  [item.asesorBioClim || null, item.telefonoAsesor || null]
                    .filter(Boolean)
                    .join(" · ") || "—"
                }
              />
              <Pair label="Envase" value={envase || "—"} />
              <Pair
                label="Última ruta"
                value={
                  formatRutaVinculada(item.ultimaRutaId, item.ultimaRutaCompletada) ??
                  "Sin ruta completada"
                }
              />
            </ScrollView>

            <View style={styles.actions}>
              <GhostButton label="Cerrar" onPress={onClose} />
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pair}>
      <Text style={styles.pairLabel}>{label}</Text>
      <Text style={styles.pairValue}>{value}</Text>
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
    maxHeight: "86%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  headCopy: { flex: 1, minWidth: 0, gap: 8 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: theme.colors.warnSoft,
    borderWidth: 1,
    borderColor: "#E8C89A",
  },
  badgeText: { color: theme.colors.warn, fontSize: 10, fontWeight: "800" },
  title: { color: theme.colors.ink, fontSize: 17, fontWeight: "800" },
  close: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: theme.colors.muted, fontSize: 22, fontWeight: "600", lineHeight: 24 },
  body: { padding: 16, gap: 10 },
  pair: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    gap: 3,
  },
  pairLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  pairValue: { color: theme.colors.ink, fontSize: 13, fontWeight: "700", lineHeight: 18 },
  actions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
  },
});
