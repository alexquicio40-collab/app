import {
  FieldLabel,
  FieldRow,
  GhostButton,
  PanelCard,
  PrimaryButton,
  SelectField,
  TextField,
} from "@/features/routes/assign/components/form-kit";
import type { LocalOption } from "@/features/routes/assign/types";
import type { ConductorOption } from "@/features/routes/types";
import { limaDate } from "@/lib/api";
import { theme } from "@/lib/theme";
import { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

type AssignPanelProps = {
  conductores: ConductorOption[];
  locales: LocalOption[];
  localesLoading?: boolean;
  bottomPad?: number;
  onAssign: (input: {
    conductorId: string;
    localId: string;
    fechaAsignacion: string;
    observaciones: string;
  }) => Promise<void>;
  onDone?: () => void;
};

export function AssignPanel({
  conductores,
  locales,
  localesLoading = false,
  bottomPad = 120,
  onAssign,
  onDone,
}: AssignPanelProps) {
  const [conductorId, setConductorId] = useState<string | null>(null);
  const [localId, setLocalId] = useState<string | null>(null);
  const [fecha, setFecha] = useState(limaDate());
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);

  const notify = (title: string, message: string) => {
    if (Platform.OS === "web") window.alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  const submit = async () => {
    if (!conductorId || !localId) {
      notify("Asignación", "Selecciona operador y local");
      return;
    }
    setSaving(true);
    try {
      await onAssign({
        conductorId,
        localId,
        fechaAsignacion: fecha,
        observaciones: obs.trim(),
      });
      setConductorId(null);
      setLocalId(null);
      setObs("");
      setFecha(limaDate());
      notify("Listo", "Ruta asignada");
      onDone?.();
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "No se pudo asignar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.wrap, { paddingBottom: bottomPad }]}
      keyboardShouldPersistTaps="handled"
    >
      <PanelCard title="Nueva asignación" subtitle="Asigna un local a un operador para una fecha.">
        <FieldRow>
          <SelectField
            flex
            label="Operador *"
            value={conductorId}
            placeholder="Operador…"
            options={conductores.map((item) => ({ value: item.id, label: item.nombre }))}
            onChange={setConductorId}
          />
          <SelectField
            flex
            label="Local *"
            value={localId}
            placeholder={localesLoading && !locales.length ? "Cargando locales…" : "Local…"}
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
            {Platform.OS === "web" ? (
              <TextField value={fecha} onChangeText={setFecha} placeholder="yyyy-mm-dd" />
            ) : (
              <>
                <Pressable onPress={() => setPicking(true)} style={styles.dateBtn}>
                  <Text style={styles.dateText}>{formatDisplay(fecha)}</Text>
                </Pressable>
                {picking ? (
                  <DateTimePicker
                    value={parseDay(fecha)}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(_, date) => {
                      if (Platform.OS === "android") setPicking(false);
                      if (date) setFecha(toIso(date));
                    }}
                  />
                ) : null}
              </>
            )}
          </View>
          <View style={styles.half}>
            <FieldLabel>Observaciones</FieldLabel>
            <TextField value={obs} onChangeText={setObs} placeholder="Notas…" />
          </View>
        </FieldRow>

        <FieldRow>
          <View style={styles.half}>
            <PrimaryButton label="Asignar ruta" onPress={submit} loading={saving} />
          </View>
          <View style={styles.half}>
            <GhostButton
              label="Limpiar"
              onPress={() => {
                setConductorId(null);
                setLocalId(null);
                setObs("");
                setFecha(limaDate());
              }}
            />
          </View>
        </FieldRow>
      </PanelCard>
    </ScrollView>
  );
}

function parseDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y || 2026, (m || 1) - 1, d || 1);
}

function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

const styles = StyleSheet.create({
  wrap: {
    padding: 8,
    gap: 8,
  },
  half: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  dateBtn: {
    minHeight: 38,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  dateText: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
});
