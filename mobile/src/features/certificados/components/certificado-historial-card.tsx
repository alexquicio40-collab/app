import {
  formatFechaHora,
  isImageFile,
  isPdfFile,
} from "@/features/certificados/lib/format";
import type { CertificadoHistorial } from "@/features/certificados/types";
import { theme } from "@/lib/theme";
import { createElement, type ReactNode, useRef } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

type CertificadoHistorialCardProps = {
  item: CertificadoHistorial;
  canDelete: boolean;
  onView: () => void;
  onOpenDetail: () => void;
  onDelete?: () => void;
  onEditCodigo?: () => void;
};

const DOUBLE_MS = 320;

export function CertificadoHistorialCard({
  item,
  canDelete,
  onView,
  onOpenDetail,
  onDelete,
  onEditCodigo,
}: CertificadoHistorialCardProps) {
  const image = isImageFile(item.tipoArchivo, item.archivo);
  const pdf = isPdfFile(item.tipoArchivo, item.archivo);
  const lastTap = useRef(0);

  const handleCopyPress = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_MS) {
      lastTap.current = 0;
      onOpenDetail();
      return;
    }
    lastTap.current = now;
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Pressable
          onPress={onView}
          style={styles.thumbWrap}
          accessibilityLabel="Ver certificado"
        >
          {image ? (
            <Image source={{ uri: item.archivoUrl }} style={styles.thumb} />
          ) : pdf ? (
            <PdfThumb url={item.archivoUrl} />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback]}>
              <Text style={styles.thumbLabel}>DOC</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={handleCopyPress}
          style={styles.copy}
          accessibilityHint="Doble toque para ver detalles"
        >
          <Text style={styles.title} numberOfLines={1}>
            {item.localNombre}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {[item.codigoRegistro.trim() || null, formatFechaHora(item.createdAt), item.usuarioNombre.trim() || null]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          {item.conductorNombre.trim() || item.localRuc.trim() ? (
            <Text style={styles.sub} numberOfLines={1}>
              {[
                item.conductorNombre.trim() ? `Cond. ${item.conductorNombre.trim()}` : null,
                item.localRuc.trim() ? `RUC ${item.localRuc.trim()}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          ) : null}
          {item.observaciones.trim() ? (
            <Text style={styles.obs} numberOfLines={2}>
              {item.observaciones.trim()}
            </Text>
          ) : null}
        </Pressable>

        {onEditCodigo ? (
          <Pressable onPress={onEditCodigo} style={styles.editCode} accessibilityLabel="Corregir código">
            <Text style={styles.editCodeText}>CBC</Text>
          </Pressable>
        ) : null}
        {canDelete && onDelete ? (
          <IconAction label="Eliminar" onPress={onDelete}>
            <TrashGlyph color={theme.colors.danger} />
          </IconAction>
        ) : null}
      </View>
    </View>
  );
}

/** Miniatura del PDF (sin interacción; el Pressable padre abre el visor). */
function PdfThumb({ url }: { url: string }) {
  if (Platform.OS === "web") {
    return (
      <View style={styles.thumb} pointerEvents="none">
        {createElement("iframe", {
          src: `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`,
          title: "Vista PDF",
          style: {
            width: "100%",
            height: "100%",
            border: "none",
            pointerEvents: "none",
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
    <View style={styles.thumb} pointerEvents="none">
      <WebView
        source={{ uri: sourceUri }}
        style={styles.pdfWeb}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        pointerEvents="none"
        originWhitelist={["*"]}
      />
    </View>
  );
}

function IconAction({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.action, pressed ? styles.actionPressed : null]}
    >
      {children}
    </Pressable>
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
  editCode: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#fff7ed",
  },
  editCodeText: { color: "#b45309", fontWeight: "800", fontSize: 11 },
  card: {
    marginHorizontal: 10,
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  thumbWrap: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  thumb: {
    width: 64,
    height: 80,
    borderRadius: 10,
    backgroundColor: theme.colors.cream,
    overflow: "hidden",
  },
  pdfWeb: {
    width: 64,
    height: 80,
    backgroundColor: theme.colors.cream,
  },
  thumbFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.warnSoft,
  },
  thumbLabel: { color: theme.colors.warn, fontSize: 10, fontWeight: "900" },
  copy: { flex: 1, minWidth: 0, gap: 2, paddingTop: 2 },
  title: { color: theme.colors.ink, fontSize: 14, fontWeight: "800" },
  meta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  sub: { color: theme.colors.ink, fontSize: 11, fontWeight: "600" },
  obs: { color: theme.colors.muted, fontSize: 11, fontWeight: "600", marginTop: 2 },
  action: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8B4B0",
    backgroundColor: theme.colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  actionPressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
  trash: {
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  trashHandle: {
    width: 4,
    height: 2,
    borderWidth: 1.1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginBottom: 0.5,
  },
  trashLid: { width: 9, height: 1.2, borderRadius: 1, marginBottom: 1 },
  trashBody: {
    width: 7,
    height: 6,
    borderWidth: 1.1,
    borderRadius: 1.5,
    borderTopWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  trashLine: { width: 1.1, height: 3.5, borderRadius: 1 },
});
