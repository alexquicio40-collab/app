import { dash } from "@/features/operador-inicio/palette";
import { theme } from "@/lib/theme";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { useEffect, useState } from "react";
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
import { loadGuiaRecojos, type GuiaRecojo } from "../lib/recojos";

type GuiaRecojosSheetProps = {
  localId: string | null;
  localNombre: string;
  onClose: () => void;
};

export function GuiaRecojosSheet({ localId, localNombre, onClose }: GuiaRecojosSheetProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = useContentBottomPad(8);
  const [rows, setRows] = useState<GuiaRecojo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!localId) {
      setRows([]);
      setError(null);
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
    <>
      <Modal visible transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <Pressable style={styles.dismiss} onPress={onClose} />
          <View style={[styles.sheet, { paddingBottom: sheetBottom }]}>
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
                <ActivityIndicator color={dash.green} />
              </View>
            ) : error ? (
              <Text style={styles.error}>{error}</Text>
            ) : rows.length === 0 ? (
              <Text style={styles.empty}>Aún no hay recojos registrados para este local.</Text>
            ) : (
              <ScrollView
                contentContainerStyle={{ paddingBottom: bottomPad, gap: 8 }}
                showsVerticalScrollIndicator={false}
              >
                {rows.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <Text style={styles.fecha}>{item.fechaLabel}</Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {item.estado} · {item.operador}
                    </Text>
                    <View style={styles.fotos}>
                      {item.fotoGuia ? (
                        <Pressable onPress={() => setPreview(item.fotoGuia)} style={styles.foto}>
                          <Image source={{ uri: item.fotoGuia }} style={styles.fotoImg} />
                          <Text style={styles.fotoLbl}>Guía</Text>
                        </Pressable>
                      ) : null}
                      {item.fotoMercaderia ? (
                        <Pressable
                          onPress={() => setPreview(item.fotoMercaderia)}
                          style={styles.foto}
                        >
                          <Image source={{ uri: item.fotoMercaderia }} style={styles.fotoImg} />
                          <Text style={styles.fotoLbl}>Mercadería</Text>
                        </Pressable>
                      ) : null}
                      {item.certificadoUrl ? (
                        <Pressable
                          onPress={() => setPreview(item.certificadoUrl)}
                          style={styles.foto}
                        >
                          <Image source={{ uri: item.certificadoUrl }} style={styles.fotoImg} />
                          <Text style={styles.fotoLbl}>Certificado</Text>
                        </Pressable>
                      ) : null}
                      {!item.fotoGuia && !item.fotoMercaderia && !item.certificadoUrl ? (
                        <Text style={styles.sinFoto}>Sin foto de guía</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(preview)} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.preview} onPress={() => setPreview(null)}>
          {preview ? <Image source={{ uri: preview }} style={styles.previewImg} resizeMode="contain" /> : null}
        </Pressable>
      </Modal>
    </>
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
  center: { paddingVertical: 28, alignItems: "center" },
  error: { color: "#DC2626", fontSize: 13, fontWeight: "700" },
  empty: { color: dash.muted, fontSize: 13, fontWeight: "600", paddingVertical: 12 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    padding: 10,
    gap: 4,
  },
  fecha: { color: theme.colors.ink, fontSize: 14, fontWeight: "800" },
  meta: { color: dash.muted, fontSize: 12, fontWeight: "600" },
  fotos: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  foto: { width: 84, gap: 4 },
  fotoImg: {
    width: 84,
    height: 84,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
  },
  fotoLbl: { color: dash.muted, fontSize: 10, fontWeight: "700" },
  sinFoto: { color: dash.muted, fontSize: 11, fontWeight: "600" },
  preview: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  previewImg: { width: "100%", height: "80%" },
});
