import {
  formatFecha,
  formatFechaHora,
  isImagePath,
  isPdfPath,
} from "@/features/pagos/lib/format";
import { PagoMetricsGrid } from "@/features/pagos/components/pago-metrics-grid";
import type { ComprobantePago, HojaPago } from "@/features/pagos/types";
import { theme } from "@/lib/theme";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PagoHojaDetailSheetProps = {
  item: HojaPago | null;
  comprobantes: ComprobantePago[];
  loading: boolean;
  canMutate: boolean;
  onClose: () => void;
  onUpload: () => void;
  onView: (item: ComprobantePago) => void;
  onDelete: (item: ComprobantePago) => void;
};

export function PagoHojaDetailSheet({
  item,
  comprobantes,
  loading,
  canMutate,
  onClose,
  onUpload,
  onView,
  onDelete,
}: PagoHojaDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const open = Boolean(item);
  const [localesOpen, setLocalesOpen] = useState(false);

  useEffect(() => {
    if (open) setLocalesOpen(false);
  }, [open, item?.id]);

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {item ? (
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.head}>
              <View style={styles.headCopy}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.localesNombres.join(" · ") || "Hoja de ruta"}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {[item.conductorNombre, formatFecha(item.fecha), item.placa || null]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>
              <Pressable accessibilityLabel="Cerrar" onPress={onClose} style={styles.close}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              {item.localesNombres.length > 0 ? (
                <LocalesAccordion
                  locales={item.localesNombres}
                  open={localesOpen}
                  onToggle={() => setLocalesOpen((value) => !value)}
                />
              ) : null}

              <PagoMetricsGrid item={item} showTotal />

              <View style={styles.compHead}>
                <Text style={styles.blockTitle}>Comprobantes</Text>
                {canMutate ? (
                  <Pressable onPress={onUpload} style={styles.uploadChip}>
                    <Text style={styles.uploadChipText}>+ Adjuntar</Text>
                  </Pressable>
                ) : null}
              </View>

              {loading ? (
                <ActivityIndicator color={theme.colors.accent} style={{ marginVertical: 16 }} />
              ) : comprobantes.length === 0 ? (
                <Text style={styles.emptyComp}>Sin comprobantes adjuntos</Text>
              ) : (
                comprobantes.map((comp) => (
                  <ComprobanteRow
                    key={comp.id}
                    item={comp}
                    canDelete={canMutate}
                    onView={() => onView(comp)}
                    onDelete={() => onDelete(comp)}
                  />
                ))
              )}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function LocalesAccordion({
  locales,
  open,
  onToggle,
}: {
  locales: string[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.accordion}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={styles.accordionHead}
      >
        <View style={styles.accordionCopy}>
          <Text style={styles.accordionTitle}>Locales visitados</Text>
          <Text style={styles.accordionMeta}>
            {locales.length} local{locales.length === 1 ? "" : "es"}
          </Text>
        </View>
        <View style={styles.accordionIcon}>
          <Text style={styles.accordionIconText}>{open ? "−" : "+"}</Text>
        </View>
      </Pressable>

      {open ? (
        <View style={styles.accordionBody}>
          {locales.map((nombre, index) => (
            <Text key={`${nombre}-${index}`} style={styles.localLine}>
              {index + 1}. {nombre}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ComprobanteRow({
  item,
  canDelete,
  onView,
  onDelete,
}: {
  item: ComprobantePago;
  canDelete: boolean;
  onView: () => void;
  onDelete: () => void;
}) {
  const image = isImagePath(item.rutaArchivo);
  const pdf = isPdfPath(item.rutaArchivo);

  return (
    <View style={styles.compCard}>
      <Pressable onPress={onView} style={styles.compThumb}>
        {image ? (
          <Image source={{ uri: item.archivoUrl }} style={styles.thumbImg} />
        ) : (
          <View style={styles.thumbFallback}>
            <Text style={styles.thumbGlyph}>{pdf ? "PDF" : "DOC"}</Text>
          </View>
        )}
      </Pressable>
      <Pressable onPress={onView} style={styles.compCopy}>
        <Text style={styles.compTitle} numberOfLines={1}>
          {item.descripcion || (pdf ? "Comprobante PDF" : "Comprobante")}
        </Text>
        <Text style={styles.compMeta} numberOfLines={1}>
          {[formatFechaHora(item.createdAt), item.creadoPorNombre || null]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </Pressable>
      {canDelete ? (
        <Pressable accessibilityLabel="Eliminar" onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>×</Text>
        </Pressable>
      ) : null}
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
    maxHeight: "92%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
  },
  head: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  headCopy: { flex: 1, minWidth: 0, gap: 4 },
  title: { color: theme.colors.ink, fontSize: 16, fontWeight: "800" },
  meta: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  close: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: theme.colors.muted, fontSize: 22, fontWeight: "600", lineHeight: 24 },
  body: { padding: 16, gap: 12 },
  accordion: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  accordionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  accordionCopy: { flex: 1, minWidth: 0, gap: 2 },
  accordionTitle: { color: theme.colors.ink, fontSize: 13, fontWeight: "800" },
  accordionMeta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  accordionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  accordionIconText: {
    color: theme.colors.accent,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  accordionBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
    paddingTop: 10,
  },
  blockTitle: { color: theme.colors.ink, fontSize: 13, fontWeight: "800" },
  localLine: { color: theme.colors.muted, fontSize: 12, fontWeight: "600", lineHeight: 17 },
  compHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  uploadChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.goldSoft,
    borderWidth: 1,
    borderColor: "#E0C98A",
  },
  uploadChipText: { color: theme.colors.gold, fontSize: 11, fontWeight: "800" },
  emptyComp: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  compCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
  },
  compThumb: { borderRadius: 8, overflow: "hidden" },
  thumbImg: { width: 48, height: 48, borderRadius: 8 },
  thumbFallback: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.warnSoft,
    borderWidth: 1,
    borderColor: "#E8C89A",
  },
  thumbGlyph: { color: theme.colors.warn, fontSize: 10, fontWeight: "900" },
  compCopy: { flex: 1, minWidth: 0, gap: 2 },
  compTitle: { color: theme.colors.ink, fontSize: 13, fontWeight: "800" },
  compMeta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.dangerSoft,
  },
  deleteText: { color: theme.colors.danger, fontSize: 18, fontWeight: "700", lineHeight: 20 },
});
