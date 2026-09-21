import { formatFechaHora, isImageFile, isPdfFile } from "@/features/certificados/lib/format";
import type { CertificadoHistorial } from "@/features/certificados/types";
import { theme } from "@/lib/theme";
import { createElement } from "react";
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

type CertificadoViewerSheetProps = {
  item: CertificadoHistorial | null;
  canDelete: boolean;
  onClose: () => void;
  onDelete?: () => void;
};

export function CertificadoViewerSheet({
  item,
  canDelete,
  onClose,
  onDelete,
}: CertificadoViewerSheetProps) {
  const insets = useSafeAreaInsets();
  const open = Boolean(item);
  const image = item ? isImageFile(item.tipoArchivo, item.archivo) : false;
  const pdf = item ? isPdfFile(item.tipoArchivo, item.archivo) : false;

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
              {item?.localNombre ?? "Certificado"}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {[
                item ? formatFechaHora(item.createdAt) : null,
                item?.usuarioNombre.trim() || null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>

          {canDelete && onDelete ? (
            <Pressable
              accessibilityLabel="Eliminar"
              onPress={onDelete}
              style={styles.iconBtnDanger}
            >
              <TrashGlyph color={theme.colors.danger} />
            </Pressable>
          ) : null}

          <Pressable accessibilityLabel="Cerrar" onPress={onClose} style={styles.iconBtn}>
            <CloseGlyph color={theme.colors.muted} />
          </Pressable>
        </View>

        <View style={styles.viewer}>
          {item && image ? (
            <Image
              source={{ uri: item.archivoUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : item && pdf ? (
            <PdfFrame url={item.archivoUrl} />
          ) : item ? (
            <View style={styles.fallback}>
              <Text style={styles.fallbackTitle}>Archivo no previsualizable</Text>
              <Text style={styles.fallbackText}>Tipo: {item.tipoArchivo || "desconocido"}</Text>
            </View>
          ) : null}
        </View>

        {item?.observaciones.trim() ? (
          <Text style={styles.obs} numberOfLines={3}>
            {item.observaciones.trim()}
          </Text>
        ) : null}
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
          title: "Certificado PDF",
          style: {
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: 12,
          },
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
      allowsFullscreenVideo
      originWhitelist={["*"]}
    />
  );
}

function CloseGlyph({ color }: { color: string }) {
  return (
    <View style={styles.closeGlyph}>
      <View style={[styles.closeBar, { backgroundColor: color, transform: [{ rotate: "45deg" }] }]} />
      <View
        style={[styles.closeBar, { backgroundColor: color, transform: [{ rotate: "-45deg" }] }]}
      />
    </View>
  );
}

function TrashGlyph({ color }: { color: string }) {
  return (
    <View style={styles.trash}>
      <View style={[styles.trashHandle, { borderColor: color }]} />
      <View style={[styles.trashLid, { backgroundColor: color }]} />
      <View style={[styles.trashBody, { borderColor: color }]}>
        <View style={[styles.trashLine, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
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
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDanger: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8B4B0",
    backgroundColor: theme.colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },
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
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 24,
  },
  fallbackTitle: { color: theme.colors.ink, fontSize: 14, fontWeight: "800" },
  fallbackText: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  obs: {
    marginHorizontal: 14,
    marginTop: 10,
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "600",
  },
  closeGlyph: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBar: {
    position: "absolute",
    width: 14,
    height: 1.8,
    borderRadius: 1,
  },
  trash: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  trashHandle: {
    width: 5,
    height: 2.2,
    borderWidth: 1.2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginBottom: 0.5,
  },
  trashLid: { width: 10, height: 1.4, borderRadius: 1, marginBottom: 1 },
  trashBody: {
    width: 8,
    height: 7,
    borderWidth: 1.2,
    borderRadius: 1.5,
    borderTopWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  trashLine: { width: 1.2, height: 4, borderRadius: 1 },
});
