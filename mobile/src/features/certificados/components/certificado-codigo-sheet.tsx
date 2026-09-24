import { theme } from "@/lib/theme";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type CertificadoCodigoSheetProps = {
  visible: boolean;
  title: string;
  hint: string;
  codigoInicial?: string;
  pedirLocal?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (value: { codigo: string; localId: string }) => void;
};

export function CertificadoCodigoSheet({
  visible,
  title,
  hint,
  codigoInicial = "",
  pedirLocal = false,
  saving = false,
  onClose,
  onSubmit,
}: CertificadoCodigoSheetProps) {
  const [codigo, setCodigo] = useState(codigoInicial);
  const [localId, setLocalId] = useState("");

  useEffect(() => {
    if (visible) {
      setCodigo(codigoInicial);
      setLocalId("");
    }
  }, [visible, codigoInicial]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.hint}>{hint}</Text>
          {pedirLocal ? (
            <TextInput
              value={localId}
              onChangeText={setLocalId}
              placeholder="ID del local"
              keyboardType="number-pad"
              style={styles.input}
              placeholderTextColor={theme.colors.muted}
            />
          ) : null}
          <TextInput
            value={codigo}
            onChangeText={setCodigo}
            autoCapitalize="characters"
            placeholder="CBC-0664-2026"
            style={styles.input}
            placeholderTextColor={theme.colors.muted}
          />
          <Pressable
            disabled={saving}
            onPress={() => onSubmit({ codigo: codigo.trim(), localId: localId.trim() })}
            style={styles.save}
          >
            <Text style={styles.saveText}>{saving ? "Guardando…" : "Guardar código"}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: "800", color: theme.colors.ink },
  hint: { color: theme.colors.muted, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.ink,
  },
  save: {
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "800" },
});
