import type { RouteItem } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReprogramReasonSheetProps = {
  open: boolean;
  route?: RouteItem | null;
  saving?: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void> | void;
};

export function ReprogramReasonSheet({
  open,
  route = null,
  saving = false,
  onClose,
  onConfirm,
}: ReprogramReasonSheetProps) {
  const insets = useSafeAreaInsets();
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMotivo(route?.observaciones ?? "");
    setError(null);
  }, [open, route?.id]);

  if (!open) return null;

  const submit = async () => {
    const text = motivo.trim();
    if (!text) {
      setError("Indica por qué se reprograma");
      return;
    }
    setError(null);
    await onConfirm(text);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.handle} />
          <Text style={styles.kicker}>Reprogramar</Text>
          <Text style={styles.title}>{route?.localNombre || "Ruta"}</Text>
          <Text style={styles.hint}>Escribe el motivo para dejar constancia en la ruta.</Text>
          <TextInput
            value={motivo}
            onChangeText={setMotivo}
            placeholder="¿Por qué se reprograma?"
            placeholderTextColor={theme.colors.muted}
            multiline
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={() => void submit()} disabled={saving} style={styles.save}>
            <Text style={styles.saveText}>{saving ? "Guardando…" : "Reprogramar"}</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: theme.colors.line,
    marginBottom: 6,
  },
  kicker: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: { color: theme.colors.ink, fontSize: 18, fontWeight: "800" },
  hint: { color: theme.colors.muted, fontSize: 13, fontWeight: "600" },
  input: {
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
  },
  error: { color: theme.colors.danger, fontSize: 12, fontWeight: "700" },
  save: {
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  cancel: { alignSelf: "center", paddingVertical: 8 },
  cancelText: { color: theme.colors.accent, fontSize: 13, fontWeight: "800" },
});
