import {
  FieldLabel,
  FieldRow,
  GhostButton,
  PrimaryButton,
  SelectField,
  TextField,
} from "@/features/routes/assign/components/form-kit";
import type { LocalOption } from "@/features/routes/assign/types";
import { toDayKey } from "@/features/routes/lib/format";
import type { ConductorOption, RouteItem } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type RouteEditPayload = {
  conductorId: string;
  localId: string;
  fechaAsignacion: string;
  observaciones: string;
};

type RouteEditSheetProps = {
  route: RouteItem | null;
  conductores: ConductorOption[];
  locales: LocalOption[];
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: RouteEditPayload) => Promise<void>;
};

export function RouteEditSheet({
  route,
  conductores,
  locales,
  saving = false,
  onClose,
  onSave,
}: RouteEditSheetProps) {
  const insets = useSafeAreaInsets();
  const [conductorId, setConductorId] = useState<string | null>(null);
  const [localId, setLocalId] = useState<string | null>(null);
  const [fecha, setFecha] = useState("");
  const [obs, setObs] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!route) return;
    setConductorId(route.conductorId || null);
    setLocalId(route.localId || null);
    setFecha(toDayKey(route.fechaAsignacion));
    setObs(route.observaciones || "");
    setError(null);
  }, [route]);

  if (!route) return null;

  const submit = async () => {
    if (!conductorId || !localId || !fecha) {
      setError("Completa operador, local y fecha");
      return;
    }
    setError(null);
    await onSave({
      conductorId,
      localId,
      fechaAsignacion: fecha,
      observaciones: obs.trim(),
    });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={styles.kicker}>Editar ruta #{route.id}</Text>
              <Text style={styles.title} numberOfLines={2}>
                {route.localNombre}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          <FieldRow>
            <SelectField
              flex
              label="Operador *"
              value={conductorId}
              placeholder="Operador…"
              options={conductores.map((item) => ({ value: item.id, label: item.nombre }))}
              searchable
              onChange={setConductorId}
            />
            <SelectField
              flex
              label="Local *"
              value={localId}
              placeholder="Local…"
              searchable
              options={locales.map((item) => ({
                value: item.id,
                label: item.nombre,
                hint: item.direccion,
              }))}
              onChange={setLocalId}
            />
          </FieldRow>

          <FieldRow>
            <View style={styles.half}>
              <FieldLabel>Fecha *</FieldLabel>
              <TextField value={fecha} onChangeText={setFecha} placeholder="yyyy-mm-dd" />
            </View>
            <View style={styles.half}>
              <FieldLabel>Observaciones</FieldLabel>
              <TextField value={obs} onChangeText={setObs} placeholder="Notas…" />
            </View>
          </FieldRow>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <FieldRow>
            <View style={styles.half}>
              <PrimaryButton label="Guardar" onPress={() => void submit()} loading={saving} />
            </View>
            <View style={styles.half}>
              <GhostButton label="Cancelar" onPress={onClose} />
            </View>
          </FieldRow>
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
  dismiss: {
    flex: 1,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 10,
    ...Platform.select({
      web: { maxWidth: 560, width: "100%", alignSelf: "center" },
      default: {},
    }),
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
    marginBottom: 4,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  headCopy: { flex: 1, gap: 2, minWidth: 0 },
  kicker: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  close: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.cream,
  },
  closeText: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  half: { flex: 1, minWidth: 0, gap: 4 },
  error: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
});
