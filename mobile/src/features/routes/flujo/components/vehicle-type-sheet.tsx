import type { VehicleType } from "@/features/routes/flujo/types";
import { theme } from "@/lib/theme";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type VehicleTypeSheetProps = {
  open: boolean;
  localNombre?: string;
  initial?: VehicleType | null;
  saving?: boolean;
  onClose: () => void;
  onContinue: (type: VehicleType) => Promise<void> | void;
};

const OPTIONS: {
  value: VehicleType;
  label: string;
  hint: string;
}[] = [
  { value: "ligero", label: "Ligero", hint: "Auto / moto" },
  { value: "pesado", label: "Pesado", hint: "Camión / tracto" },
];

export function VehicleTypeSheet({
  open,
  localNombre,
  initial = null,
  saving = false,
  onClose,
  onContinue,
}: VehicleTypeSheetProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<VehicleType | null>(initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelected(initial);
    setError(null);
  }, [open, initial]);

  if (!open) return null;

  const submit = async () => {
    if (!selected) {
      setError("Selecciona ligero o pesado");
      return;
    }
    setError(null);
    await onContinue(selected);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.handle} />

          <Text style={styles.title}>Tipo de vehículo</Text>
          {localNombre ? (
            <Text style={styles.meta} numberOfLines={1}>
              {localNombre}
            </Text>
          ) : null}

          <View style={styles.row}>
            {OPTIONS.map((item) => {
              const on = selected === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => {
                    setSelected(item.value);
                    setError(null);
                  }}
                  style={[styles.card, on ? styles.cardOn : null]}
                >
                  {on ? (
                    <View style={styles.check}>
                      <View style={styles.checkMark} />
                    </View>
                  ) : null}
                  <View style={[styles.iconWrap, on ? styles.iconWrapOn : null]}>
                    {item.value === "ligero" ? (
                      <LigeroIcon active={on} />
                    ) : (
                      <PesadoIcon active={on} />
                    )}
                  </View>
                  <Text style={[styles.cardLabel, on ? styles.cardLabelOn : null]}>
                    {item.label}
                  </Text>
                  <Text style={styles.cardHint}>{item.hint}</Text>
                </Pressable>
              );
            })}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.ghost} disabled={saving}>
              <Text style={styles.ghostText}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={() => void submit()}
              style={[
                styles.primary,
                !selected || saving ? styles.primaryDisabled : null,
              ]}
              disabled={saving || !selected}
            >
              <Text style={styles.primaryText}>
                {saving ? "…" : "Continuar"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function LigeroIcon({ active }: { active: boolean }) {
  const color = active ? theme.colors.accent : theme.colors.muted;
  return (
    <View style={styles.iconBox}>
      <View style={[styles.carBody, { backgroundColor: color }]} />
      <View
        style={[
          styles.carCabin,
          {
            borderColor: color,
            backgroundColor: active ? "#DCEEE7" : "#EEF3F1",
          },
        ]}
      />
      <View style={[styles.wheel, styles.wheelL, { backgroundColor: theme.colors.ink }]} />
      <View style={[styles.wheel, styles.wheelR, { backgroundColor: theme.colors.ink }]} />
    </View>
  );
}

function PesadoIcon({ active }: { active: boolean }) {
  const color = active ? theme.colors.gold : theme.colors.muted;
  return (
    <View style={styles.iconBox}>
      <View style={[styles.truckBox, { backgroundColor: color }]} />
      <View style={[styles.truckCab, { backgroundColor: color }]} />
      <View
        style={[
          styles.truckWindow,
          { backgroundColor: active ? "#FFF8E8" : "#EEF3F1" },
        ]}
      />
      <View style={[styles.wheel, styles.truckWheel1, { backgroundColor: theme.colors.ink }]} />
      <View style={[styles.wheel, styles.truckWheel2, { backgroundColor: theme.colors.ink }]} />
      <View style={[styles.wheel, styles.truckWheel3, { backgroundColor: theme.colors.ink }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.55)",
    justifyContent: "flex-end",
    padding: 12,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
    ...Platform.select({
      web: { maxWidth: 420, width: "100%", alignSelf: "center" },
      default: {},
    }),
  },
  handle: {
    alignSelf: "center",
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
    marginBottom: 2,
  },
  title: { color: theme.colors.ink, fontSize: 15, fontWeight: "900" },
  meta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600", marginTop: -4 },
  row: { flexDirection: "row", gap: 8 },
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 4,
    alignItems: "center",
    overflow: "hidden",
  },
  cardOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  check: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    width: 7,
    height: 4,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#fff",
    transform: [{ rotate: "-45deg" }, { translateY: -1 }],
  },
  iconWrap: {
    width: 56,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapOn: {
    borderColor: theme.colors.accent,
    backgroundColor: "#fff",
  },
  iconBox: {
    width: 48,
    height: 24,
    position: "relative",
  },
  carBody: {
    position: "absolute",
    left: 4,
    right: 4,
    bottom: 5,
    height: 9,
    borderRadius: 3,
  },
  carCabin: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 1,
    height: 10,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderWidth: 2,
    borderBottomWidth: 0,
  },
  wheel: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    bottom: 0,
  },
  wheelL: { left: 8 },
  wheelR: { right: 8 },
  truckBox: {
    position: "absolute",
    left: 0,
    top: 2,
    width: 26,
    height: 14,
    borderRadius: 2,
  },
  truckCab: {
    position: "absolute",
    right: 2,
    top: 5,
    width: 16,
    height: 11,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 2,
  },
  truckWindow: {
    position: "absolute",
    right: 5,
    top: 7,
    width: 7,
    height: 5,
    borderRadius: 1,
  },
  truckWheel1: { left: 4 },
  truckWheel2: { left: 14 },
  truckWheel3: { right: 5 },
  cardLabel: { color: theme.colors.ink, fontSize: 13, fontWeight: "900" },
  cardLabelOn: { color: theme.colors.accent },
  cardHint: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  error: {
    color: theme.colors.danger,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  actions: { flexDirection: "row", gap: 8, marginTop: 2 },
  ghost: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.cream,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  ghostText: { color: theme.colors.muted, fontSize: 13, fontWeight: "800" },
  primary: {
    flex: 1.3,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
  },
  primaryDisabled: { opacity: 0.55 },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
