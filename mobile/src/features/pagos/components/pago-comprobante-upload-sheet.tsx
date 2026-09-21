import type {
  ComprobanteUploadInput,
  HojaPago,
  PendingComprobanteFile,
} from "@/features/pagos/types";
import { FieldLabel, TextField } from "@/features/routes/assign/components/form-kit";
import { theme } from "@/lib/theme";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

type PagoComprobanteUploadSheetProps = {
  open: boolean;
  hoja: HojaPago | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (input: ComprobanteUploadInput) => Promise<void>;
};

const MAX_BYTES = 10 * 1024 * 1024;

function makeKey() {
  return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function notify(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Atención", message);
}

export function PagoComprobanteUploadSheet({
  open,
  hoja,
  saving = false,
  onClose,
  onSubmit,
}: PagoComprobanteUploadSheetProps) {
  const insets = useSafeAreaInsets();
  const [file, setFile] = useState<PendingComprobanteFile | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setDescripcion("");
    setError(null);
  }, [open, hoja?.id]);

  const pickCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      notify("Permiso de cámara denegado");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    applyAsset(result.assets[0]);
  };

  const pickGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      notify("Permiso de galería denegado");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.85,
      mediaTypes: ["images"],
    });
    if (result.canceled || !result.assets[0]) return;
    applyAsset(result.assets[0]);
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (asset.size != null && asset.size > MAX_BYTES) {
      notify("El archivo supera 10 MB");
      return;
    }
    setFile({
      key: makeKey(),
      uri: asset.uri,
      name: asset.name || `comprobante_${Date.now()}.pdf`,
      mimeType: asset.mimeType || "application/pdf",
    });
    setError(null);
  };

  const applyAsset = (asset: ImagePicker.ImagePickerAsset) => {
    if (asset.fileSize != null && asset.fileSize > MAX_BYTES) {
      notify("El archivo supera 10 MB");
      return;
    }
    const ext = asset.mimeType?.includes("png") ? "png" : "jpg";
    setFile({
      key: makeKey(),
      uri: asset.uri,
      name: asset.fileName?.trim() || `comprobante_${Date.now()}.${ext}`,
      mimeType: asset.mimeType || "image/jpeg",
    });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Selecciona un comprobante (PDF o imagen)");
      return;
    }
    setError(null);
    await onSubmit({ file, descripcion });
  };

  const isImage = Boolean(file?.mimeType.startsWith("image/"));

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={styles.title}>Adjuntar comprobante</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {hoja?.conductorNombre ?? ""}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.pickRow}>
              <PickBtn label="Cámara" onPress={() => void pickCamera()} />
              <PickBtn label="Galería" onPress={() => void pickGallery()} />
              <PickBtn label="Archivo" onPress={() => void pickDocument()} />
            </View>

            {file ? (
              <View style={styles.preview}>
                {isImage ? (
                  <Image source={{ uri: file.uri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.pdfBox}>
                    <Text style={styles.pdfGlyph}>PDF</Text>
                    <Text style={styles.pdfName} numberOfLines={2}>
                      {file.name}
                    </Text>
                  </View>
                )}
                <Pressable onPress={() => setFile(null)}>
                  <Text style={styles.removeText}>Quitar</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.emptyPreview}>
                <Text style={styles.emptyText}>PDF o imagen · máx. 10 MB</Text>
              </View>
            )}

            <View style={styles.field}>
              <FieldLabel>Descripción</FieldLabel>
              <TextField
                value={descripcion}
                onChangeText={(v) => setDescripcion(v.slice(0, 200))}
                placeholder="Opcional…"
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel="Cancelar"
              onPress={onClose}
              disabled={saving}
              style={[styles.iconBtn, styles.iconMuted]}
            >
              <Text style={styles.iconGlyphMuted}>×</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Guardar comprobante"
              onPress={() => void handleSubmit()}
              disabled={saving}
              style={[styles.iconBtn, styles.iconAccent]}
            >
              {saving ? (
                <ActivityIndicator color={theme.colors.accent} size="small" />
              ) : (
                <Text style={styles.iconGlyphAccent}>✓</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PickBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.pickBtn}>
      <Text style={styles.pickText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "88%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  headCopy: { flex: 1, minWidth: 0, gap: 2 },
  title: { color: theme.colors.ink, fontSize: 16, fontWeight: "800" },
  subtitle: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
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
  pickRow: { flexDirection: "row", gap: 8 },
  pickBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  pickText: { color: theme.colors.accent, fontSize: 12, fontWeight: "800" },
  preview: { gap: 8 },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: theme.colors.cream,
  },
  pdfBox: {
    minHeight: 110,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.warnSoft,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 16,
  },
  pdfGlyph: { color: theme.colors.warn, fontSize: 18, fontWeight: "900" },
  pdfName: { color: theme.colors.ink, fontSize: 12, fontWeight: "700", textAlign: "center" },
  removeText: {
    alignSelf: "flex-end",
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: "800",
  },
  emptyPreview: {
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: theme.colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.cream,
  },
  emptyText: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  field: { gap: 6 },
  error: { color: theme.colors.danger, fontSize: 12, fontWeight: "700" },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  iconMuted: { borderColor: theme.colors.line, backgroundColor: theme.colors.cream },
  iconAccent: { borderColor: "#B7D4C8", backgroundColor: theme.colors.accentSoft },
  iconGlyphMuted: { color: theme.colors.muted, fontSize: 22, fontWeight: "600", lineHeight: 24 },
  iconGlyphAccent: { color: theme.colors.accent, fontSize: 20, fontWeight: "800" },
});
