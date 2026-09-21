import { formatIngreso } from "@/features/planta/lib/format";
import type { PlantaRegistro } from "@/features/planta/types";
import { theme } from "@/lib/theme";
import { useState, type ReactNode } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PlantaDetailSheetProps = {
  item: PlantaRegistro | null;
  canManage: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function PlantaDetailSheet({
  item,
  canManage,
  onClose,
  onEdit,
  onDelete,
}: PlantaDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const [preview, setPreview] = useState<string | null>(null);
  if (!item) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={styles.kicker}>Registro #{item.id}</Text>
              <Text style={styles.title} numberOfLines={2}>
                {item.nombreProveedor}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          {canManage ? (
            <View style={styles.actions}>
              {onEdit ? (
                <Pressable onPress={onEdit} style={[styles.action, styles.actionPrimary]}>
                  <Text style={styles.actionPrimaryText}>Editar</Text>
                </Pressable>
              ) : null}
              {onDelete ? (
                <Pressable onPress={onDelete} style={[styles.action, styles.actionDanger]}>
                  <Text style={styles.actionDangerText}>Eliminar</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Section title="Ingreso">
              <Pair label="Fecha" value={formatIngreso(item.ingresoMercaderia)} />
              <Pair label="Asesor" value={item.asesorComercial || "—"} />
              <Pair label="Guía de retiro" value={item.guiaRetiro || "—"} />
            </Section>

            <Section title="Cantidades">
              <View style={styles.metrics}>
                <Metric label="Litros" value={item.cantidadLitraje} color={theme.colors.accent} />
                <Metric label="Baldes" value={item.cantidadBaldesVacios} color={theme.colors.info} />
                <Metric
                  label="Galoneras"
                  value={item.cantidadGalonerasVacias}
                  color={theme.colors.gold}
                />
              </View>
            </Section>

            {item.notas ? (
              <Section title="Notas">
                <Text style={styles.notes}>{item.notas}</Text>
              </Section>
            ) : null}

            <Section title="Fotos">
              <View style={styles.photos}>
                <PhotoThumb
                  label="Mercadería"
                  uri={item.fotoMercaderia}
                  onPress={() => item.fotoMercaderia && setPreview(item.fotoMercaderia)}
                />
                <PhotoThumb
                  label="Guía"
                  uri={item.fotoGuiaRetiro}
                  onPress={() => item.fotoGuiaRetiro && setPreview(item.fotoGuiaRetiro)}
                />
              </View>
            </Section>
          </ScrollView>
        </View>
      </View>

      <Modal visible={Boolean(preview)} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreview(null)}>
          {preview ? (
            <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="contain" />
          ) : null}
        </Pressable>
      </Modal>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
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

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.metric, { backgroundColor: `${color}14` }]}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color }]}>{label}</Text>
    </View>
  );
}

function PhotoThumb({
  label,
  uri,
  onPress,
}: {
  label: string;
  uri: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={!uri} style={styles.photo}>
      {uri ? (
        <Image source={{ uri }} style={styles.photoImg} />
      ) : (
        <View style={styles.photoEmpty}>
          <Text style={styles.photoEmptyText}>Sin foto</Text>
        </View>
      )}
      <Text style={styles.photoLabel}>{label}</Text>
    </Pressable>
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
    maxHeight: "88%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 10,
    ...Platform.select({
      web: { maxWidth: 560, width: "100%", alignSelf: "center" },
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
  head: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  headCopy: { flex: 1, minWidth: 0, gap: 2 },
  kicker: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: { color: theme.colors.ink, fontSize: 17, fontWeight: "800" },
  close: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.cream,
  },
  closeText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8 },
  action: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  actionPrimary: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  actionPrimaryText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  actionDanger: {
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.danger,
  },
  actionDangerText: { color: theme.colors.danger, fontSize: 12, fontWeight: "800" },
  body: { gap: 10, paddingBottom: 16 },
  section: { gap: 6 },
  sectionTitle: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionBody: {
    backgroundColor: theme.colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 10,
    gap: 8,
  },
  pair: { gap: 2 },
  pairLabel: { color: theme.colors.muted, fontSize: 10, fontWeight: "700" },
  pairValue: { color: theme.colors.ink, fontSize: 13, fontWeight: "700" },
  metrics: { flexDirection: "row", gap: 8 },
  metric: { flex: 1, borderRadius: 10, padding: 10, gap: 2 },
  metricValue: { fontSize: 18, fontWeight: "900" },
  metricLabel: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  notes: { color: theme.colors.ink, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  photos: { flexDirection: "row", gap: 10 },
  photo: { flex: 1, gap: 4 },
  photoImg: { width: "100%", height: 110, borderRadius: 10 },
  photoEmpty: {
    height: 110,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: theme.colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  photoEmptyText: { color: theme.colors.muted, fontSize: 11, fontWeight: "700" },
  photoLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: "700" },
  previewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  previewImage: { width: "100%", height: "80%" },
});
