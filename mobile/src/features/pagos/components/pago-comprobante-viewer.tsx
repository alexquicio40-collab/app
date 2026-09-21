import { formatFechaHora, isImagePath, isPdfPath } from "@/features/pagos/lib/format";
import type { ComprobantePago } from "@/features/pagos/types";
import { theme } from "@/lib/theme";
import { createElement } from "react";
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

type PagoComprobanteViewerProps = {
  item: ComprobantePago | null;
  canDelete: boolean;
  onClose: () => void;
  onDelete?: () => void;
};

export function PagoComprobanteViewer({
  item,
  canDelete,
  onClose,
  onDelete,
}: PagoComprobanteViewerProps) {
  const insets = useSafeAreaInsets();
  const open = Boolean(item);
  const image = item ? isImagePath(item.rutaArchivo) : false;
  const pdf = item ? isPdfPath(item.rutaArchivo) : false;

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.safe,
          {
            paddingTop: Math.max(insets.top, 10),
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
        <View style={styles.head}>
          <View style={styles.headCopy}>
            <Text style={styles.title} numberOfLines={1}>
              {item?.descripcion || "Comprobante"}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {[item ? formatFechaHora(item.createdAt) : null, item?.creadoPorNombre || null]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>
          {canDelete && onDelete ? (
            <Pressable accessibilityLabel="Eliminar" onPress={onDelete} style={styles.dangerBtn}>
              <Text style={styles.dangerText}>×</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityLabel="Cerrar" onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <View style={styles.viewer}>
          {item && image ? (
            <Image source={{ uri: item.archivoUrl }} style={styles.image} resizeMode="contain" />
          ) : item && pdf ? (
            <PdfFrame url={item.archivoUrl} />
          ) : item ? (
            <View style={styles.fallback}>
              <Text style={styles.fallbackText}>Archivo no previsualizable</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function PdfFrame({ url }: { url: string }) {
  if (Platform.OS === "web") {
    return (
      <View style={styles.pdfHost}>
        {createElement("iframe", {
          src: url,
          title: "Comprobante PDF",
          style: { width: "100%", height: "100%", border: "none" },
        })}
      </View>
    );
  }

  const sourceUri =
    Platform.OS === "android"
      ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`
      : url;

  return (
    <WebView
      source={{ uri: sourceUri }}
      style={styles.pdfHost}
      startInLoadingState
      originWhitelist={["*"]}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  headCopy: { flex: 1, minWidth: 0, gap: 2 },
  title: { color: theme.colors.ink, fontSize: 16, fontWeight: "800" },
  meta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: theme.colors.muted, fontSize: 22, fontWeight: "600", lineHeight: 24 },
  dangerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerText: { color: theme.colors.danger, fontSize: 22, fontWeight: "600", lineHeight: 24 },
  viewer: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  pdfHost: { flex: 1, width: "100%", backgroundColor: theme.colors.cream },
  fallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  fallbackText: { color: theme.colors.muted, fontSize: 13, fontWeight: "600" },
});
