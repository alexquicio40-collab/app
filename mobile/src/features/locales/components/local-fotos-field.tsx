import type { LocalFoto, PendingLocalFoto } from "@/features/locales/types";
import { theme } from "@/lib/theme";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type LocalFotosFieldProps = {
  existing: LocalFoto[];
  pending: PendingLocalFoto[];
  removedIds: string[];
  onChangePending: (next: PendingLocalFoto[]) => void;
  onChangeRemoved: (next: string[]) => void;
};

function makeKey() {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toPending(asset: ImagePicker.ImagePickerAsset): PendingLocalFoto {
  const ext =
    asset.mimeType?.includes("png") ? "png" : asset.mimeType?.includes("webp") ? "webp" : "jpg";
  return {
    key: makeKey(),
    uri: asset.uri,
    name: asset.fileName?.trim() || `entrada_${Date.now()}.${ext}`,
    mimeType: asset.mimeType || `image/${ext === "jpg" ? "jpeg" : ext}`,
  };
}

async function ensureLibraryPermission() {
  if (Platform.OS === "web") return true;
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;
  const asked = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return asked.granted;
}

async function ensureCameraPermission() {
  if (Platform.OS === "web") return true;
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;
  const asked = await ImagePicker.requestCameraPermissionsAsync();
  return asked.granted;
}

function warn(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Fotos", message);
}

/**
 * Fotos de entrada de proveedores: galería + cámara,
 * con preview de existentes y pendientes.
 */
export function LocalFotosField({
  existing,
  pending,
  removedIds,
  onChangePending,
  onChangeRemoved,
}: LocalFotosFieldProps) {
  const [busy, setBusy] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const visibleExisting = existing.filter((foto) => !removedIds.includes(foto.id));

  const pickFromLibrary = useCallback(async () => {
    const ok = await ensureLibraryPermission();
    if (!ok) {
      warn("Necesitas permiso para acceder a la galería.");
      return;
    }
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.85,
        selectionLimit: 8,
      });
      if (result.canceled || !result.assets?.length) return;
      onChangePending([...pending, ...result.assets.map(toPending)]);
    } catch (err) {
      warn(err instanceof Error ? err.message : "No se pudieron seleccionar fotos");
    } finally {
      setBusy(false);
    }
  }, [onChangePending, pending]);

  const takePhoto = useCallback(async () => {
    const ok = await ensureCameraPermission();
    if (!ok) {
      warn("Necesitas permiso para usar la cámara.");
      return;
    }
    setBusy(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        cameraType: ImagePicker.CameraType.back,
      });
      if (result.canceled || !result.assets?.length) return;
      onChangePending([...pending, ...result.assets.map(toPending)]);
    } catch (err) {
      warn(err instanceof Error ? err.message : "No se pudo tomar la foto");
    } finally {
      setBusy(false);
    }
  }, [onChangePending, pending]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Fotos de entrada de proveedores</Text>
      <Text style={styles.hint}>Galería o cámara · se suben al guardar</Text>

      <View style={styles.grid}>
        {visibleExisting.map((foto) => (
          <View key={foto.id} style={styles.thumbWrap}>
            <Pressable onPress={() => setPreviewUri(foto.rutaArchivo)}>
              <Image source={{ uri: foto.rutaArchivo }} style={styles.thumb} />
            </Pressable>
            <Pressable
              accessibilityLabel="Quitar foto"
              onPress={() => onChangeRemoved([...removedIds, foto.id])}
              style={styles.remove}
            >
              <Text style={styles.removeText}>×</Text>
            </Pressable>
          </View>
        ))}

        {pending.map((foto) => (
          <View key={foto.key} style={styles.thumbWrap}>
            <Pressable onPress={() => setPreviewUri(foto.uri)}>
              <Image source={{ uri: foto.uri }} style={styles.thumb} />
            </Pressable>
            <Pressable
              accessibilityLabel="Quitar foto nueva"
              onPress={() => onChangePending(pending.filter((item) => item.key !== foto.key))}
              style={styles.remove}
            >
              <Text style={styles.removeText}>×</Text>
            </Pressable>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>Nueva</Text>
            </View>
          </View>
        ))}

        <Pressable
          onPress={() => void pickFromLibrary()}
          style={styles.addBtn}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator size="small" color={theme.colors.accent} />
          ) : (
            <>
              <Text style={styles.addIcon}>⧉</Text>
              <Text style={styles.addLabel}>Galería</Text>
            </>
          )}
        </Pressable>

        <Pressable onPress={() => void takePhoto()} style={styles.addBtn} disabled={busy}>
          <Text style={styles.addIcon}>◉</Text>
          <Text style={styles.addLabel}>Cámara</Text>
        </Pressable>
      </View>

      <Modal
        visible={Boolean(previewUri)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUri(null)}
      >
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewUri(null)}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  title: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  hint: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  thumbWrap: {
    width: 76,
    height: 76,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
  },
  thumb: { width: "100%", height: "100%" },
  remove: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 16,
  },
  newBadge: {
    position: "absolute",
    left: 3,
    bottom: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "800",
  },
  addBtn: {
    width: 76,
    height: 76,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    borderStyle: "dashed",
    backgroundColor: theme.colors.cream,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  addIcon: {
    color: theme.colors.accent,
    fontSize: 18,
    fontWeight: "700",
  },
  addLabel: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "700",
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  previewImage: {
    width: "100%",
    height: "80%",
  },
});
