import type { VehicleType } from "@/features/routes/flujo/types";
import { theme } from "@/lib/theme";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CompanionsSheetProps = {
  open: boolean;
  vehicleType: VehicleType | null;
  saving?: boolean;
  onBack: () => void;
  onClose: () => void;
  onSkip: () => Promise<void> | void;
  onConfirm: (names: string[]) => Promise<void> | void;
};

export function CompanionsSheet({
  open,
  vehicleType,
  saving = false,
  onBack,
  onClose,
  onSkip,
  onConfirm,
}: CompanionsSheetProps) {
  const insets = useSafeAreaInsets();
  const [names, setNames] = useState<string[]>([""]);

  useEffect(() => {
    if (!open) return;
    setNames([""]);
  }, [open]);

  if (!open) return null;

  const patch = (index: number, value: string) => {
    setNames((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const add = () => {
    if (names.length >= 10) return;
    setNames((prev) => [...prev, ""]);
  };

  const submit = async () => {
    const cleaned = names.map((item) => item.trim()).filter(Boolean);
    await onConfirm(cleaned);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={styles.kicker}>
                Vehículo {vehicleType === "pesado" ? "pesado" : "ligero"}
              </Text>
              <Text style={styles.title}>Acompañantes en esta ruta</Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          <Text style={styles.hint}>
            Opcional. Se usará al compartir la ruta y en la bienvenida.
          </Text>

          <View style={styles.list}>
            {names.map((name, index) => (
              <TextInput
                key={`c-${index}`}
                value={name}
                onChangeText={(value) => patch(index, value)}
                placeholder="Ejemplo: Juan Pérez"
                placeholderTextColor={theme.colors.muted}
                maxLength={80}
                style={styles.input}
              />
            ))}
          </View>

          {names.length < 10 ? (
            <Pressable onPress={add} style={styles.add}>
              <Text style={styles.addText}>+ Agregar otro acompañante</Text>
            </Pressable>
          ) : null}

          <View style={styles.actions}>
            <Pressable onPress={onBack} style={styles.ghost} disabled={saving}>
              <Text style={styles.ghostText}>Atrás</Text>
            </Pressable>
            <Pressable onPress={() => void onSkip()} style={styles.soft} disabled={saving}>
              <Text style={styles.softText}>Saltar</Text>
            </Pressable>
            <Pressable
              onPress={() => void submit()}
              style={[styles.primary, saving ? styles.disabled : null]}
              disabled={saving}
            >
              <Text style={styles.primaryText}>Iniciar ruta</Text>
            </Pressable>
          </View>
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
  dismiss: { flex: 0.25 },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 8,
    ...Platform.select({
      web: { maxWidth: 520, width: "100%", alignSelf: "center" },
      default: {},
    }),
  },
  handle: {
    alignSelf: "center",
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
    marginBottom: 4,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  headCopy: { flex: 1, minWidth: 0, gap: 2 },
  kicker: {
    color: theme.colors.gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: { color: theme.colors.ink, fontSize: 16, fontWeight: "900" },
  close: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.cream,
  },
  closeText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  hint: { color: theme.colors.muted, fontSize: 12, fontWeight: "600", lineHeight: 16 },
  list: { gap: 8, marginTop: 4 },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingHorizontal: 12,
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  add: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  addText: { color: theme.colors.accent, fontSize: 13, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 8, marginTop: 8 },
  ghost: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.cream,
  },
  ghostText: { color: theme.colors.muted, fontSize: 13, fontWeight: "800" },
  soft: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.goldSoft,
    borderWidth: 1,
    borderColor: "#E0C98A",
  },
  softText: { color: theme.colors.gold, fontSize: 13, fontWeight: "800" },
  primary: {
    flex: 1.2,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
  },
  disabled: { opacity: 0.6 },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
