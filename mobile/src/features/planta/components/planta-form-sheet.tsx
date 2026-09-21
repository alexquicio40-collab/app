import type { AsesorOption, PendingFoto, PlantaFormInput, PlantaRegistro } from "@/features/planta/types";
import { joinIngreso, nowIsoLocal, splitIngreso } from "@/features/planta/lib/format";
import {
  FieldLabel,
  FieldRow,
  GhostButton,
  PrimaryButton,
  SelectField,
  TextField,
} from "@/features/routes/assign/components/form-kit";
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

type PlantaFormSheetProps = {
  open: boolean;
  item: PlantaRegistro | null;
  asesores: AsesorOption[];
  saving?: boolean;
  onClose: () => void;
  onSave: (input: PlantaFormInput) => Promise<void>;
};

function makeKey() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function toPending(asset: ImagePicker.ImagePickerAsset): PendingFoto {
  const ext = asset.mimeType?.includes("png") ? "png" : "jpg";
  return {
    key: makeKey(),
    uri: asset.uri,
    name: asset.fileName?.trim() || `planta_${Date.now()}.${ext}`,
    mimeType: asset.mimeType || "image/jpeg",
  };
}

function emptyForm(asesorDefault = ""): PlantaFormInput {
  return {
    nombreProveedor: "",
    asesorComercial: asesorDefault,
    ingresoMercaderia: nowIsoLocal(),
    guiaRetiro: "",
    cantidadLitraje: 0,
    cantidadBaldesVacios: 0,
    cantidadGalonerasVacias: 0,
    notas: "",
    fotoMercaderia: null,
    fotoGuiaRetiro: null,
  };
}

export function PlantaFormSheet({
  open,
  item,
  asesores,
  saving = false,
  onClose,
  onSave,
}: PlantaFormSheetProps) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<PlantaFormInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [existingMercaderia, setExistingMercaderia] = useState<string | null>(null);
  const [existingGuia, setExistingGuia] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (!item) {
      setForm(emptyForm(asesores[0]?.nombre ?? ""));
      setExistingMercaderia(null);
      setExistingGuia(null);
    } else {
      setForm({
        nombreProveedor: item.nombreProveedor,
        asesorComercial: item.asesorComercial,
        ingresoMercaderia: item.ingresoMercaderia ?? nowIsoLocal(),
        guiaRetiro: item.guiaRetiro,
        cantidadLitraje: item.cantidadLitraje,
        cantidadBaldesVacios: item.cantidadBaldesVacios,
        cantidadGalonerasVacias: item.cantidadGalonerasVacias,
        notas: item.notas,
        fotoMercaderia: null,
        fotoGuiaRetiro: null,
      });
      setExistingMercaderia(item.fotoMercaderia);
      setExistingGuia(item.fotoGuiaRetiro);
    }
    setError(null);
  }, [open, item, asesores]);

  const patch = (next: Partial<PlantaFormInput>) => {
    setForm((prev) => ({ ...prev, ...next }));
  };

  const pickPhoto = async (field: "fotoMercaderia" | "fotoGuiaRetiro") => {
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Fotos", "Necesitas permiso de galería");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      patch({ [field]: toPending(result.assets[0]) });
    } catch (err) {
      Alert.alert("Fotos", err instanceof Error ? err.message : "No se pudo seleccionar");
    }
  };

  const takePhoto = async (field: "fotoMercaderia" | "fotoGuiaRetiro") => {
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Cámara", "Necesitas permiso de cámara");
          return;
        }
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      patch({ [field]: toPending(result.assets[0]) });
    } catch (err) {
      Alert.alert("Cámara", err instanceof Error ? err.message : "No se pudo tomar la foto");
    }
  };

  const submit = async () => {
    if (!form.nombreProveedor.trim()) {
      setError("El proveedor es obligatorio");
      return;
    }
    if (!form.asesorComercial.trim()) {
      setError("El asesor comercial es obligatorio");
      return;
    }
    if (!form.ingresoMercaderia.trim()) {
      setError("La fecha de ingreso es obligatoria");
      return;
    }
    if (!form.guiaRetiro.trim()) {
      setError("La guía de retiro es obligatoria");
      return;
    }
    setError(null);
    await onSave({
      ...form,
      nombreProveedor: form.nombreProveedor.trim(),
      asesorComercial: form.asesorComercial.trim(),
      guiaRetiro: form.guiaRetiro.trim(),
      notas: form.notas.trim(),
    });
  };

  if (!open) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <Text style={styles.title}>{item ? "Editar registro" : "Nuevo registro"}</Text>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.field}>
              <FieldLabel>Proveedor *</FieldLabel>
              <TextField
                value={form.nombreProveedor}
                onChangeText={(nombreProveedor) => patch({ nombreProveedor })}
                placeholder="Nombre del proveedor…"
              />
            </View>

            <SelectField
              label="Asesor comercial *"
              value={form.asesorComercial || null}
              placeholder="Seleccionar…"
              options={asesores.map((a) => ({ value: a.nombre, label: a.nombre }))}
              onChange={(asesorComercial) => patch({ asesorComercial: asesorComercial || "" })}
            />

            <FieldRow>
              <View style={styles.half}>
                <FieldLabel>Fecha ingreso *</FieldLabel>
                <TextField
                  value={splitIngreso(form.ingresoMercaderia).date}
                  onChangeText={(date) => {
                    const time = splitIngreso(form.ingresoMercaderia).time || "00:00";
                    const joined = joinIngreso(date, time);
                    if (joined) patch({ ingresoMercaderia: joined });
                    else if (!date.trim()) patch({ ingresoMercaderia: "" });
                  }}
                  placeholder="AAAA-MM-DD"
                />
              </View>
              <View style={styles.half}>
                <FieldLabel>Hora *</FieldLabel>
                <TextField
                  value={splitIngreso(form.ingresoMercaderia).time}
                  onChangeText={(time) => {
                    const date = splitIngreso(form.ingresoMercaderia).date;
                    if (!date) return;
                    const joined = joinIngreso(date, time);
                    if (joined) patch({ ingresoMercaderia: joined });
                  }}
                  placeholder="HH:mm"
                />
              </View>
            </FieldRow>

            <View style={styles.field}>
              <FieldLabel>Guía retiro *</FieldLabel>
              <TextField
                value={form.guiaRetiro}
                onChangeText={(guiaRetiro) => patch({ guiaRetiro })}
                placeholder="N° guía…"
              />
            </View>

            <FieldRow>
              <View style={styles.third}>
                <FieldLabel>Litros</FieldLabel>
                <TextField
                  value={String(form.cantidadLitraje || "")}
                  onChangeText={(v) => patch({ cantidadLitraje: Number(v.replace(/\D/g, "")) || 0 })}
                  placeholder="0"
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.third}>
                <FieldLabel>Baldes</FieldLabel>
                <TextField
                  value={String(form.cantidadBaldesVacios || "")}
                  onChangeText={(v) =>
                    patch({ cantidadBaldesVacios: Number(v.replace(/\D/g, "")) || 0 })
                  }
                  placeholder="0"
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.third}>
                <FieldLabel>Galoneras</FieldLabel>
                <TextField
                  value={String(form.cantidadGalonerasVacias || "")}
                  onChangeText={(v) =>
                    patch({ cantidadGalonerasVacias: Number(v.replace(/\D/g, "")) || 0 })
                  }
                  placeholder="0"
                  keyboardType="number-pad"
                />
              </View>
            </FieldRow>

            <View style={styles.field}>
              <FieldLabel>Notas</FieldLabel>
              <TextField
                value={form.notas}
                onChangeText={(notas) => patch({ notas })}
                placeholder="Observaciones…"
                multiline
              />
            </View>

            <PhotoPicker
              label="Foto mercadería"
              pending={form.fotoMercaderia}
              existing={existingMercaderia}
              onGallery={() => void pickPhoto("fotoMercaderia")}
              onCamera={() => void takePhoto("fotoMercaderia")}
              onClear={() => {
                patch({ fotoMercaderia: null });
                setExistingMercaderia(null);
              }}
            />

            <PhotoPicker
              label="Foto guía de retiro"
              pending={form.fotoGuiaRetiro}
              existing={existingGuia}
              onGallery={() => void pickPhoto("fotoGuiaRetiro")}
              onCamera={() => void takePhoto("fotoGuiaRetiro")}
              onClear={() => {
                patch({ fotoGuiaRetiro: null });
                setExistingGuia(null);
              }}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <FieldRow>
              <View style={styles.half}>
                <PrimaryButton
                  label={item ? "Guardar cambios" : "Crear registro"}
                  onPress={() => void submit()}
                  loading={saving}
                />
              </View>
              <View style={styles.half}>
                <GhostButton label="Cancelar" onPress={onClose} />
              </View>
            </FieldRow>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PhotoPicker({
  label,
  pending,
  existing,
  onGallery,
  onCamera,
  onClear,
}: {
  label: string;
  pending?: PendingFoto | null;
  existing: string | null;
  onGallery: () => void;
  onCamera: () => void;
  onClear: () => void;
}) {
  const uri = pending?.uri || existing;
  return (
    <View style={styles.photoBlock}>
      <Text style={styles.photoTitle}>{label}</Text>
      <View style={styles.photoRow}>
        <View style={styles.photoPreview}>
          {uri ? (
            <Image source={{ uri }} style={styles.photoImg} />
          ) : (
            <Text style={styles.photoEmpty}>Sin foto</Text>
          )}
        </View>
        <View style={styles.photoActions}>
          <Pressable onPress={onGallery} style={styles.photoBtn}>
            <Text style={styles.photoBtnText}>Galería</Text>
          </Pressable>
          <Pressable onPress={onCamera} style={styles.photoBtn}>
            <Text style={styles.photoBtnText}>Cámara</Text>
          </Pressable>
          {uri ? (
            <Pressable onPress={onClear} style={[styles.photoBtn, styles.photoBtnDanger]}>
              <Text style={styles.photoBtnDangerText}>Quitar</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  dismiss: { flex: 0.06 },
  sheet: {
    flex: 1,
    maxHeight: "94%",
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
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: { color: theme.colors.ink, fontSize: 16, fontWeight: "800" },
  close: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.cream,
  },
  closeText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  body: { gap: 10, paddingBottom: 20 },
  field: { gap: 3 },
  half: { flex: 1, minWidth: 0, gap: 3 },
  third: { flex: 1, minWidth: 0, gap: 3 },
  error: { color: theme.colors.danger, fontSize: 12, fontWeight: "700" },
  photoBlock: { gap: 6 },
  photoTitle: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  photoRow: { flexDirection: "row", gap: 10 },
  photoPreview: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  photoImg: { width: "100%", height: "100%" },
  photoEmpty: { color: theme.colors.muted, fontSize: 11, fontWeight: "700" },
  photoActions: { flex: 1, gap: 6, justifyContent: "center" },
  photoBtn: {
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
    alignItems: "center",
  },
  photoBtnText: { color: theme.colors.accent, fontSize: 12, fontWeight: "800" },
  photoBtnDanger: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerSoft,
  },
  photoBtnDangerText: { color: theme.colors.danger, fontSize: 12, fontWeight: "800" },
});
