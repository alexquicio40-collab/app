import { dash } from "@/features/operador-inicio/palette";
import { theme } from "@/lib/theme";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { createElement, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { WebView } from "react-native-webview";
import {
  kindOfUrl,
  loadGuiaRecojos,
  type GuiaMediaKind,
  type GuiaRecojo,
} from "../lib/recojos";

type GuiaRecojosSheetProps = {
  localId: string | null;
  localNombre: string;
  onClose: () => void;
};

type Preview = { uri: string; kind: GuiaMediaKind; label: string };

export function GuiaRecojosSheet({ localId, localNombre, onClose }: GuiaRecojosSheetProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = useContentBottomPad(8);
  const [rows, setRows] = useState<GuiaRecojo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    setPreview(null);
    if (!localId) {
      setRows([]);
      setError(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    void loadGuiaRecojos(localId, localNombre)
      .then((list) => {
        if (alive) setRows(list);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "No se pudo cargar la guía");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [localId, localNombre]);

  if (!localId) return null;

  const sheetBottom =
    Platform.OS === "android"
      ? Math.max(insets.bottom, 24) + 12
      : Math.max(insets.bottom, 16);

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={preview ? () => setPreview(null) : onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: sheetBottom }]}>
          <View style={styles.sheetBody}>
            <View style={styles.handle} />
            <View style={styles.head}>
              <View style={styles.headCopy}>
                <Text style={styles.kicker}>Guía de recojos</Text>
                <Text style={styles.title} numberOfLines={2}>
                  {localNombre}
                </Text>
              </View>
              <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}>
                <Text style={styles.closeText}>Cerrar</Text>
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator color={dash.green} size="large" />
                <Text style={styles.empty}>Buscando fotos de guía…</Text>
              </View>
            ) : error ? (
              <Text style={styles.error}>{error}</Text>
            ) : rows.length === 0 ? (
              <Text style={styles.empty}>
                Aún no hay recojos con foto de guía para este local.
              </Text>
            ) : (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={{ paddingBottom: bottomPad, gap: 10 }}
                showsVerticalScrollIndicator={false}
              >
                {rows.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <Text style={styles.fecha}>{item.fechaLabel}</Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {item.estado} · {item.operador}
                    </Text>
                    <View style={styles.fotos}>
                      <MediaThumb
                        uri={item.fotoGuia}
                        kind={item.fotoGuiaKind}
                        label="Guía"
                        onOpen={setPreview}
                      />
                      <MediaThumb
                        uri={item.fotoMercaderia}
                        kind={item.fotoMercaderiaKind}
                        label="Mercadería"
                        onOpen={setPreview}
                      />
                      <MediaThumb
                        uri={item.certificadoUrl}
                        kind={item.certificadoKind}
                        label="Certificado"
                        onOpen={setPreview}
                      />
                      {!item.fotoGuia && !item.fotoMercaderia && !item.certificadoUrl ? (
                        <Text style={styles.sinFoto}>Sin foto de guía</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {preview ? (
            <View style={styles.previewLayer}>
              <View style={styles.previewHead}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {preview.label}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPreview(null)}
                  style={styles.close}
                >
                  <Text style={styles.closeText}>Cerrar</Text>
                </Pressable>
              </View>
              <View style={styles.previewBody}>
                {preview.kind === "pdf" ? (
                  <PdfFrame url={preview.uri} />
                ) : (
                  <Image
                    source={{ uri: preview.uri }}
                    style={styles.previewImg}
                    resizeMode="contain"
                  />
                )}
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function MediaThumb({
  uri,
  kind,
  label,
  onOpen,
}: {
  uri: string | null;
  kind: GuiaMediaKind | null;
  label: string;
  onOpen: (preview: Preview) => void;
}) {
  if (!uri) return null;
  const mediaKind = kind ?? kindOfUrl(uri) ?? "image";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onOpen({ uri, kind: mediaKind, label })}
      style={styles.foto}
    >
      {mediaKind === "pdf" ? (
        <View style={styles.pdfThumb}>
          <Text style={styles.pdfGlyph}>PDF</Text>
        </View>
      ) : (
        <Image source={{ uri }} style={styles.fotoImg} resizeMode="cover" />
      )}
      <Text style={styles.fotoLbl}>{label}</Text>
    </Pressable>
  );
}

function PdfFrame({ url }: { url: string }) {
  if (Platform.OS === "web") {
    return (
      <View style={styles.pdfHost}>
        {createElement("iframe", {
          src: url,
          title: "Guía PDF",
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  dismiss: { flex: 1 },
  sheet: {
    height: "82%",
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
  },
  sheetBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 10,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
  },
  head: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  headCopy: { flex: 1, gap: 2, minWidth: 0 },
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
  scroll: { flex: 1 },
  center: { flex: 1, paddingVertical: 28, alignItems: "center", justifyContent: "center", gap: 10 },
  error: { color: "#DC2626", fontSize: 13, fontWeight: "700", paddingVertical: 16 },
  empty: { color: dash.muted, fontSize: 13, fontWeight: "600", paddingVertical: 12, textAlign: "center" },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    padding: 10,
    gap: 4,
  },
  fecha: { color: theme.colors.ink, fontSize: 14, fontWeight: "800" },
  meta: { color: dash.muted, fontSize: 12, fontWeight: "600" },
  fotos: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  foto: { width: 110, gap: 4 },
  fotoImg: {
    width: 110,
    height: 110,
    borderRadius: 10,
    backgroundColor: theme.colors.cream,
  },
  pdfThumb: {
    width: 110,
    height: 110,
    borderRadius: 10,
    backgroundColor: theme.colors.cream,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  pdfGlyph: { color: theme.colors.ink, fontSize: 16, fontWeight: "900" },
  fotoLbl: { color: dash.muted, fontSize: 10, fontWeight: "700" },
  sinFoto: { color: dash.muted, fontSize: 11, fontWeight: "600" },
  previewLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 4,
    elevation: 6,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  previewHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  previewTitle: { flex: 1, color: theme.colors.ink, fontSize: 16, fontWeight: "800" },
  previewBody: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: theme.colors.cream,
    minHeight: 240,
  },
  previewImg: { width: "100%", height: "100%" },
  pdfHost: { flex: 1, width: "100%", backgroundColor: theme.colors.cream },
});
