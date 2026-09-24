import {
  hasAnyFinalizacionField,
  MAX_PHOTO_BYTES,
  validateFinalizarRuta,
} from "@/features/routes/flujo/lib/validate";
import type {
  FinalizacionConfig,
  FinalizarFieldErrors,
  FinalizarRutaInput,
  PendingFoto,
} from "@/features/routes/flujo/types";
import type { RouteItem } from "@/features/routes/types";
import { FieldLabel, TextField } from "@/features/routes/assign/components/form-kit";
import { theme } from "@/lib/theme";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
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

type FinalizarRutaSheetProps = {
  open: boolean;
  route: RouteItem | null;
  config: FinalizacionConfig;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (input: FinalizarRutaInput) => Promise<void>;
};

function makeKey() {
  return `fin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function notify(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Atención", message);
}

function emptyForm(): FinalizarRutaInput {
  return {
    cantidadLitraje: 0,
    cantidadBaldesVacios: 0,
    cantidadGalonerasVacias: 0,
    observaciones: "",
    fotoGuia: null,
    fotoMercaderia: null,
  };
}

export function FinalizarRutaSheet({
  open,
  route,
  config,
  saving = false,
  onClose,
  onSubmit,
}: FinalizarRutaSheetProps) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<FinalizarRutaInput>(emptyForm);
  const [errors, setErrors] = useState<FinalizarFieldErrors>({});

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm());
    setErrors({});
  }, [open, route?.id]);

  if (!open || !route) return null;

  const showQty =
    config.requiereLitraje || config.requiereBaldesVacios || config.requiereGalonerasVacias;
  const showPhotos = config.requiereFotoGuia || config.requiereFotoMercaderia;
  const anyField = hasAnyFinalizacionField(config);

  const pickPhoto = async (field: "fotoGuia" | "fotoMercaderia") => {
    const choice =
      Platform.OS === "web"
        ? "gallery"
        : await new Promise<"camera" | "gallery" | null>((resolve) => {
            Alert.alert("Foto", "Elige origen", [
              { text: "Cámara", onPress: () => resolve("camera") },
              { text: "Galería", onPress: () => resolve("gallery") },
              { text: "Cancelar", style: "cancel", onPress: () => resolve(null) },
            ]);
          });

    if (!choice) return;

    if (choice === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        notify("Permiso de cámara denegado");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
      if (result.canceled || !result.assets[0]) return;
      applyAsset(field, result.assets[0]);
      return;
    }

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
    applyAsset(field, result.assets[0]);
  };

  const applyAsset = (field: "fotoGuia" | "fotoMercaderia", asset: ImagePicker.ImagePickerAsset) => {
    if (asset.fileSize != null && asset.fileSize > MAX_PHOTO_BYTES) {
      notify("La foto es demasiado grande. Máximo 1 GB");
      return;
    }
    const ext = asset.mimeType?.includes("png") ? "png" : "jpg";
    const foto: PendingFoto = {
      key: makeKey(),
      uri: asset.uri,
      name: asset.fileName?.trim() || `${field}_${Date.now()}.${ext}`,
      mimeType: asset.mimeType || "image/jpeg",
    };
    setForm((prev) => ({ ...prev, [field]: foto }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async () => {
    const result = validateFinalizarRuta(form, config);
    setErrors(result.errors);
    if (!result.ok) {
      if (result.missing.length) {
        notify(`Complete: ${result.missing.join(", ")}`);
      }
      return;
    }
    await onSubmit(form);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={saving ? undefined : onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={saving ? undefined : onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={styles.kicker}>Llegaste a</Text>
              <Text style={styles.title} numberOfLines={2}>
                {route.localNombre}
              </Text>
              {route.localDireccion ? (
                <Text style={styles.address} numberOfLines={2}>
                  {route.localDireccion}
                </Text>
              ) : null}
              <Text style={styles.meta} numberOfLines={1}>
                {route.localDireccion || "Sin dirección"}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.close} disabled={saving}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {!anyField ? (
              <View style={styles.emptyCfg}>
                <Text style={styles.emptyCfgText}>
                  Sin campos obligatorios. Puedes finalizar la visita.
                </Text>
              </View>
            ) : null}

            {showQty ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cantidades</Text>
                <View style={styles.qtyRow}>
                  {config.requiereLitraje ? (
                    <QtyField
                      label="Cant. litraje"
                      value={String(form.cantidadLitraje)}
                      error={errors.cantidadLitraje}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          cantidadLitraje: Number(value.replace(/[^\d]/g, "")) || 0,
                        }))
                      }
                    />
                  ) : null}
                  {config.requiereBaldesVacios ? (
                    <QtyField
                      label="Baldes vacíos"
                      value={String(form.cantidadBaldesVacios)}
                      error={errors.cantidadBaldesVacios}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          cantidadBaldesVacios: Number(value.replace(/[^\d]/g, "")) || 0,
                        }))
                      }
                    />
                  ) : null}
                  {config.requiereGalonerasVacias ? (
                    <QtyField
                      label="Galoneras vacías"
                      value={String(form.cantidadGalonerasVacias)}
                      error={errors.cantidadGalonerasVacias}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          cantidadGalonerasVacias: Number(value.replace(/[^\d]/g, "")) || 0,
                        }))
                      }
                    />
                  ) : null}
                </View>
              </View>
            ) : null}

            {showPhotos ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Fotos</Text>
                <View style={styles.photoRow}>
                  {config.requiereFotoGuia ? (
                    <PhotoTile
                      label="Foto de la guía *"
                      foto={form.fotoGuia}
                      error={errors.fotoGuia}
                      onPick={() => void pickPhoto("fotoGuia")}
                      onRemove={() => setForm((prev) => ({ ...prev, fotoGuia: null }))}
                    />
                  ) : null}
                  {config.requiereFotoMercaderia ? (
                    <PhotoTile
                      label="Foto mercadería *"
                      foto={form.fotoMercaderia}
                      error={errors.fotoMercaderia}
                      onPick={() => void pickPhoto("fotoMercaderia")}
                      onRemove={() => setForm((prev) => ({ ...prev, fotoMercaderia: null }))}
                    />
                  ) : null}
                </View>
              </View>
            ) : null}

            {config.requiereNotas ? (
              <View style={styles.section}>
                <FieldLabel>Notas *</FieldLabel>
                <TextField
                  value={form.observaciones}
                  onChangeText={(observaciones) => {
                    setForm((prev) => ({ ...prev, observaciones }));
                    if (errors.observaciones) {
                      setErrors((prev) => ({ ...prev, observaciones: undefined }));
                    }
                  }}
                  placeholder="Observación al finalizar…"
                  multiline
                />
                {errors.observaciones ? (
                  <Text style={styles.fieldError}>{errors.observaciones}</Text>
                ) : null}
              </View>
            ) : null}

            <Pressable
              onPress={() => void submit()}
              disabled={saving}
              style={[styles.submit, saving ? styles.submitDisabled : null]}
            >
              <Text style={styles.submitText}>
                {saving ? "Finalizando…" : "Finalizar ruta"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function QtyField({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.qtyField}>
      <FieldLabel>{label}</FieldLabel>
      <TextField value={value} onChangeText={onChange} keyboardType="number-pad" placeholder="0" />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function PhotoTile({
  label,
  foto,
  error,
  onPick,
  onRemove,
}: {
  label: string;
  foto: PendingFoto | null;
  error?: string;
  onPick: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.photoTile}>
      <Text style={styles.photoLabel}>{label}</Text>
      {foto ? (
        <View style={styles.photoPreview}>
          <Image source={{ uri: foto.uri }} style={styles.photoImg} />
          <Pressable onPress={onRemove} style={styles.photoRemove}>
            <Text style={styles.photoRemoveText}>Quitar</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={onPick} style={[styles.photoBtn, error ? styles.photoBtnErr : null]}>
          <Text style={styles.photoBtnText}>Tomar / elegir</Text>
        </Pressable>
      )}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  dismiss: { flex: 0.12 },
  sheet: {
    flex: 1,
    maxHeight: "92%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 8,
    ...Platform.select({
      web: { maxWidth: 560, width: "100%", alignSelf: "center" },
      default: {},
    }),
  },
  handle: {
    alignSelf: "center",
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
    marginBottom: 6,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  headCopy: { flex: 1, minWidth: 0, gap: 2 },
  kicker: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "800",
  },
  title: { color: theme.colors.ink, fontSize: 16, fontWeight: "900" },
  address: { color: theme.colors.muted, fontSize: 12, fontWeight: "600", lineHeight: 16 },
  meta: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  close: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.cream,
  },
  closeText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  body: { gap: 14, paddingBottom: 24 },
  emptyCfg: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: "#B7D4C8",
  },
  emptyCfgText: { color: theme.colors.accent, fontSize: 12, fontWeight: "700", lineHeight: 17 },
  section: { gap: 8 },
  sectionTitle: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  qtyRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  qtyField: { flexGrow: 1, flexBasis: "30%", minWidth: 96, gap: 3 },
  photoRow: { flexDirection: "row", gap: 8 },
  photoTile: { flex: 1, gap: 6 },
  photoLabel: { color: theme.colors.ink, fontSize: 12, fontWeight: "700" },
  photoBtn: {
    height: 88,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    borderStyle: "dashed",
    backgroundColor: theme.colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  photoBtnErr: { borderColor: theme.colors.danger },
  photoBtnText: { color: theme.colors.accent, fontSize: 12, fontWeight: "800" },
  photoPreview: { gap: 6 },
  photoImg: {
    width: "100%",
    height: 88,
    borderRadius: 12,
    backgroundColor: theme.colors.cream,
  },
  photoRemove: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: theme.colors.dangerSoft,
  },
  photoRemoveText: { color: theme.colors.danger, fontSize: 11, fontWeight: "800" },
  fieldError: { color: theme.colors.danger, fontSize: 11, fontWeight: "700" },
  submit: {
    height: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
    marginTop: 4,
  },
  submitDisabled: { opacity: 0.65 },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "900" },
});
