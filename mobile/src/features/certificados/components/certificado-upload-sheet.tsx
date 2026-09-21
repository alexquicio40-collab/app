import { formatRutaVinculada } from "@/features/certificados/lib/format";
import type { CertUploadInput, CertificadoPendiente, PendingCertFile } from "@/features/certificados/types";
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

type CertificadoUploadSheetProps = {
  item: CertificadoPendiente | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (input: CertUploadInput) => Promise<void>;
};

const MAX_BYTES = 10 * 1024 * 1024;

function makeKey() {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function notify(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Atención", message);
}

export function CertificadoUploadSheet({
  item,
  saving = false,
  onClose,
  onSubmit,
}: CertificadoUploadSheetProps) {
  const insets = useSafeAreaInsets();
  const open = Boolean(item);
  const [file, setFile] = useState<PendingCertFile | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setObservaciones("");
    setError(null);
  }, [open, item?.id]);

  const pickCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      notify("Permiso de cámara denegado");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: false,
    });
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
      allowsMultipleSelection: false,
      mediaTypes: ["images"],
    });
    if (result.canceled || !result.assets[0]) return;
    applyAsset(result.assets[0]);
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
      multiple: false,
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
      name: asset.name || `certificado_${Date.now()}.pdf`,
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
      name: asset.fileName?.trim() || `certificado_${Date.now()}.${ext}`,
      mimeType: asset.mimeType || "image/jpeg",
    });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!item) return;
    if (!file) {
      setError("Selecciona un archivo (PDF o imagen)");
      return;
    }
    setError(null);
    await onSubmit({
      file,
      observaciones,
      rutaAsignadaId: item.ultimaRutaId,
    });
  };

  const isImage = Boolean(file?.mimeType.startsWith("image/"));
  const rutaLabel = item
    ? formatRutaVinculada(item.ultimaRutaId, item.ultimaRutaCompletada)
    : null;

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={styles.title}>Subir certificado</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {item?.nombre ?? ""}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.close}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.rutaBox, !rutaLabel ? styles.rutaBoxEmpty : null]}>
              <Text style={styles.rutaLabel}>Ruta vinculada</Text>
              <Text style={[styles.rutaValue, !rutaLabel ? styles.rutaValueEmpty : null]}>
                {rutaLabel ?? "Sin ruta completada · se emitirá sin vincular ruta"}
              </Text>
              {item?.ultimaRutaId ? (
                <Text style={styles.rutaHint}>
                  Al emitir se asociará a la ruta #{item.ultimaRutaId}
                </Text>
              ) : null}
            </View>

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
                <Pressable onPress={() => setFile(null)} style={styles.remove}>
                  <Text style={styles.removeText}>Quitar</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.emptyPreview}>
                <Text style={styles.emptyText}>PDF o imagen · máx. 10 MB</Text>
              </View>
            )}

            <View style={styles.field}>
              <FieldLabel>Observaciones</FieldLabel>
              <TextField
                value={observaciones}
                onChangeText={setObservaciones}
                placeholder="Opcional…"
                multiline
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel="Cancelar"
              onPress={onClose}
              disabled={saving}
              style={({ pressed }) => [
                styles.iconBtn,
                styles.iconBtnMuted,
                pressed ? styles.iconPressed : null,
                saving ? styles.iconDisabled : null,
              ]}
            >
              <CloseGlyph color={theme.colors.muted} />
            </Pressable>
            <Pressable
              accessibilityLabel="Emitir certificado"
              onPress={() => void handleSubmit()}
              disabled={saving}
              style={({ pressed }) => [
                styles.iconBtn,
                styles.iconBtnAccent,
                pressed ? styles.iconPressed : null,
                saving ? styles.iconDisabled : null,
              ]}
            >
              {saving ? (
                <ActivityIndicator color={theme.colors.accent} size="small" />
              ) : (
                <CheckGlyph color={theme.colors.accent} />
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

function CloseGlyph({ color }: { color: string }) {
  return (
    <View style={styles.glyphBox}>
      <View style={[styles.closeBar, { backgroundColor: color, transform: [{ rotate: "45deg" }] }]} />
      <View
        style={[styles.closeBar, { backgroundColor: color, transform: [{ rotate: "-45deg" }] }]}
      />
    </View>
  );
}

function CheckGlyph({ color }: { color: string }) {
  return (
    <View style={styles.glyphBox}>
      <View style={[styles.checkShort, { backgroundColor: color }]} />
      <View style={[styles.checkLong, { backgroundColor: color }]} />
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
  rutaBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#B7D4C8",
    backgroundColor: theme.colors.accentSoft,
    gap: 3,
  },
  rutaBoxEmpty: {
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
  },
  rutaLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  rutaValue: { color: theme.colors.accent, fontSize: 13, fontWeight: "800" },
  rutaValueEmpty: { color: theme.colors.muted, fontWeight: "600" },
  rutaHint: { color: theme.colors.ink, fontSize: 11, fontWeight: "600", marginTop: 2 },
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
    minHeight: 120,
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
  pdfName: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  remove: { alignSelf: "flex-end" },
  removeText: { color: theme.colors.danger, fontSize: 12, fontWeight: "800" },
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
  iconBtnMuted: {
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
  },
  iconBtnAccent: {
    borderColor: "#B7D4C8",
    backgroundColor: theme.colors.accentSoft,
  },
  iconPressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
  iconDisabled: { opacity: 0.5 },
  glyphBox: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBar: {
    position: "absolute",
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  checkShort: {
    position: "absolute",
    left: 1,
    bottom: 4,
    width: 6,
    height: 2.2,
    borderRadius: 1,
    transform: [{ rotate: "45deg" }],
  },
  checkLong: {
    position: "absolute",
    right: 0,
    bottom: 6,
    width: 12,
    height: 2.2,
    borderRadius: 1,
    transform: [{ rotate: "-45deg" }],
  },
});
