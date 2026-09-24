import type { CertificadoTexto } from "@/features/certificados/api";
import { theme } from "@/lib/theme";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type CertificadoTextoSheetProps = {
  value: CertificadoTexto | null;
  saving?: boolean;
  onClose: () => void;
  onProcess: (texto: CertificadoTexto) => void;
};

const FIELDS: { key: keyof CertificadoTexto; label: string; multiline?: boolean }[] = [
  { key: "codigo", label: "Código" },
  { key: "fechaEmision", label: "Fecha de emisión" },
  { key: "fechaRetiro", label: "Fecha de retiro" },
  { key: "numeroGuia", label: "N.° de guía" },
  { key: "litros", label: "Litros" },
  { key: "cliente", label: "Cliente", multiline: true },
  { key: "localNombre", label: "Local" },
  { key: "localDireccion", label: "Dirección cert.", multiline: true },
  { key: "fechaProsa", label: "Cierre del certificado", multiline: true },
];

export function CertificadoTextoSheet({
  value,
  saving = false,
  onClose,
  onProcess,
}: CertificadoTextoSheetProps) {
  const [form, setForm] = useState<CertificadoTexto | null>(value);

  useEffect(() => {
    setForm(value);
  }, [value]);

  return (
    <Modal visible={form != null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Text style={styles.title}>Revisar certificado</Text>
          <Text style={styles.hint}>Edita el texto. El PDF se crea al pulsar Procesar.</Text>
          <ScrollView contentContainerStyle={styles.form}>
            {form
              ? FIELDS.map((field) => (
                  <View key={field.key} style={styles.field}>
                    <Text style={styles.label}>{field.label}</Text>
                    <TextInput
                      value={form[field.key]}
                      onChangeText={(text) => setForm({ ...form, [field.key]: text })}
                      multiline={field.multiline}
                      style={[styles.input, field.multiline && styles.inputMulti]}
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>
                ))
              : null}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable disabled={saving} onPress={onClose} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              disabled={saving || !form}
              onPress={() => form && onProcess(form)}
              style={styles.process}
            >
              <Text style={styles.processText}>{saving ? "Procesando…" : "Procesar"}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "88%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    gap: 8,
  },
  title: { fontSize: 18, fontWeight: "800", color: theme.colors.ink },
  hint: { color: theme.colors.muted, fontSize: 13 },
  form: { gap: 10, paddingBottom: 8 },
  field: { gap: 4 },
  label: { fontSize: 12, fontWeight: "700", color: theme.colors.ink },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.ink,
  },
  inputMulti: { minHeight: 64, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: 8 },
  cancel: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cancelText: { color: theme.colors.ink, fontWeight: "700" },
  process: {
    flex: 1.4,
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  processText: { color: "#fff", fontWeight: "800" },
});
