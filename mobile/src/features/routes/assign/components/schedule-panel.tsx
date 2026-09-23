import {
  FieldLabel,
  FieldRow,
  GhostButton,
  PanelCard,
  PrimaryButton,
  SelectField,
  TextField,
} from "@/features/routes/assign/components/form-kit";
import type { LocalOption, ScheduleItem } from "@/features/routes/assign/types";
import { ActionIconButton, TrashIcon } from "@/features/routes/components/route-action-bar";
import type { ConductorOption } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const FREQ = [
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual", label: "Mensual" },
];

type SchedulePanelProps = {
  conductores: ConductorOption[];
  locales: LocalOption[];
  localesLoading?: boolean;
  schedules: ScheduleItem[];
  bottomPad?: number;
  onSave: (input: {
    localId: string;
    conductorId: string;
    frecuencia: string;
    diasSemana?: string;
    diasMes?: string;
    horaVisita?: string;
    observaciones?: string;
  }, editId?: number) => Promise<void>;
  onGenerate: (desde: string, hasta: string) => Promise<{ creadas?: number }>;
  onDelete: (id: number) => Promise<void>;
  onReload: () => Promise<void>;
};

function defaultRange() {
  const now = new Date();
  const desde = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const hasta = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  return { desde: toIso(desde), hasta: toIso(hasta) };
}

export function SchedulePanel({
  conductores,
  locales,
  localesLoading = false,
  schedules,
  bottomPad = 120,
  onSave,
  onGenerate,
  onDelete,
  onReload,
}: SchedulePanelProps) {
  const range0 = useMemo(() => defaultRange(), []);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | undefined>();
  const [localId, setLocalId] = useState<string | null>(null);
  const [conductorId, setConductorId] = useState<string | null>(null);
  const [frecuencia, setFrecuencia] = useState<string | null>(null);
  const [diasSemana, setDiasSemana] = useState<number[]>([]);
  const [diasMes, setDiasMes] = useState("");
  const [hora, setHora] = useState("");
  const [obs, setObs] = useState("");
  const [desde, setDesde] = useState(range0.desde);
  const [hasta, setHasta] = useState(range0.hasta);
  const [saving, setSaving] = useState(false);

  const notify = (title: string, message: string) => {
    if (Platform.OS === "web") window.alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  const reset = () => {
    setEditId(undefined);
    setLocalId(null);
    setConductorId(null);
    setFrecuencia(null);
    setDiasSemana([]);
    setDiasMes("");
    setHora("");
    setObs("");
  };

  const loadEdit = (item: ScheduleItem) => {
    setEditId(item.id);
    setLocalId(item.localId);
    setConductorId(item.conductorId);
    setFrecuencia(item.frecuencia);
    setDiasSemana(
      item.diasSemana
        ? item.diasSemana.split(",").map((d) => Number(d.trim())).filter((n) => Number.isFinite(n))
        : [],
    );
    setDiasMes(item.diasMes);
    setHora(item.horaVisita);
    setObs(item.observaciones);
    setFormOpen(true);
  };

  const submit = async () => {
    if (!localId || !conductorId || !frecuencia) {
      notify("Programación", "Completa local, operador y frecuencia");
      return;
    }
    if (frecuencia === "semanal" && diasSemana.length === 0) {
      notify("Programación", "Selecciona al menos un día");
      return;
    }
    if ((frecuencia === "quincenal" || frecuencia === "mensual") && !diasMes.trim()) {
      notify("Programación", "Indica los días del mes");
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          localId,
          conductorId,
          frecuencia,
          diasSemana: frecuencia === "semanal" ? diasSemana.join(",") : undefined,
          diasMes: frecuencia !== "semanal" ? diasMes.trim() : undefined,
          horaVisita: hora.trim() || undefined,
          observaciones: obs.trim() || undefined,
        },
        editId,
      );
      const gen = await onGenerate(desde, hasta);
      await onReload();
      reset();
      setFormOpen(false);
      notify("Listo", `Programación guardada. Se generaron ${gen.creadas ?? 0} asignaciones.`);
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    const ok =
      Platform.OS === "web"
        ? window.confirm("¿Eliminar esta programación?")
        : await new Promise<boolean>((resolve) => {
            Alert.alert("Eliminar", "¿Eliminar esta programación?", [
              { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
              { text: "Eliminar", style: "destructive", onPress: () => resolve(true) },
            ]);
          });
    if (!ok) return;
    try {
      await onDelete(id);
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "No se pudo eliminar");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.wrap, { paddingBottom: bottomPad }]}
      keyboardShouldPersistTaps="handled"
    >
      <PanelCard
        collapsible
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editId ? "Editar programación" : "Nueva programación"}
        subtitle="Al guardar se crea la programación y se generan rutas en el rango."
      >
        <FieldRow>
          <SelectField
            flex
            label="Local *"
            value={localId}
            placeholder={localesLoading && !locales.length ? "Cargando locales…" : "Local…"}
            searchable
            options={locales.map((item) => ({ value: item.id, label: item.nombre, hint: item.direccion }))}
            onChange={setLocalId}
          />
          <SelectField
            flex
            label="Operador *"
            value={conductorId}
            placeholder="Operador…"
            options={conductores.map((item) => ({ value: item.id, label: item.nombre }))}
            onChange={setConductorId}
          />
        </FieldRow>

        <FieldRow>
          <SelectField
            flex
            label="Frecuencia *"
            value={frecuencia}
            placeholder="Frecuencia…"
            options={FREQ}
            onChange={setFrecuencia}
          />
          <View style={styles.half}>
            <FieldLabel>Hora</FieldLabel>
            <TextField value={hora} onChangeText={setHora} placeholder="HH:mm" />
          </View>
        </FieldRow>

        {frecuencia === "semanal" ? (
          <View style={styles.field}>
            <FieldLabel>Días de la semana *</FieldLabel>
            <View style={styles.days}>
              {DAYS.map((day, index) => {
                const on = diasSemana.includes(index);
                return (
                  <Pressable
                    key={day}
                    onPress={() =>
                      setDiasSemana((prev) =>
                        on ? prev.filter((d) => d !== index) : [...prev, index].sort(),
                      )
                    }
                    style={[styles.day, on ? styles.dayOn : null]}
                  >
                    <Text style={[styles.dayText, on ? styles.dayTextOn : null]}>{day}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {frecuencia === "quincenal" || frecuencia === "mensual" ? (
          <View style={styles.field}>
            <FieldLabel>Días del mes *</FieldLabel>
            <TextField
              value={diasMes}
              onChangeText={setDiasMes}
              placeholder={frecuencia === "quincenal" ? "Ej. 1,15" : "Ej. 10"}
            />
          </View>
        ) : null}

        <FieldRow>
          <View style={styles.half}>
            <FieldLabel>Generar desde</FieldLabel>
            <TextField value={desde} onChangeText={setDesde} placeholder="yyyy-mm-dd" />
          </View>
          <View style={styles.half}>
            <FieldLabel>Generar hasta</FieldLabel>
            <TextField value={hasta} onChangeText={setHasta} placeholder="yyyy-mm-dd" />
          </View>
        </FieldRow>

        <View style={styles.field}>
          <FieldLabel>Observaciones</FieldLabel>
          <TextField value={obs} onChangeText={setObs} placeholder="Notas…" />
        </View>

        <FieldRow>
          <View style={styles.half}>
            <PrimaryButton
              label={editId ? "Actualizar" : "Guardar"}
              onPress={submit}
              loading={saving}
            />
          </View>
          <View style={styles.half}>
            {editId ? (
              <GhostButton
                label="Cancelar"
                onPress={() => {
                  reset();
                  setFormOpen(false);
                }}
              />
            ) : (
              <GhostButton label="Limpiar" onPress={reset} />
            )}
          </View>
        </FieldRow>
      </PanelCard>

      <View style={styles.listHead}>
        <Text style={styles.listTitle}>Programaciones ({schedules.length})</Text>
      </View>

      {schedules.map((item) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.itemCopy}>
            <Text style={styles.itemTitle}>{item.localNombre}</Text>
            <Text style={styles.itemMeta}>
              {item.conductorNombre} · {item.frecuencia}
              {item.horaVisita ? ` · ${item.horaVisita}` : ""}
            </Text>
          </View>
          <View style={styles.actions}>
            <ActionIconButton label="Editar" glyph="✎" tone="accent" onPress={() => loadEdit(item)} />
            <ActionIconButton
              label="Eliminar"
              tone="danger"
              icon={<TrashIcon />}
              onPress={() => void remove(item.id)}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const styles = StyleSheet.create({
  wrap: {
    padding: 8,
    gap: 8,
  },
  field: { gap: 4 },
  days: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  day: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
  },
  dayOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  dayText: { color: theme.colors.muted, fontSize: 11, fontWeight: "700" },
  dayTextOn: { color: theme.colors.accent },
  half: { flex: 1, minWidth: 0, gap: 4 },
  listHead: { paddingHorizontal: 2, paddingTop: 4 },
  listTitle: { color: theme.colors.ink, fontSize: 13, fontWeight: "800" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 10,
  },
  itemCopy: { flex: 1, gap: 2, minWidth: 0 },
  itemTitle: { color: theme.colors.ink, fontSize: 13, fontWeight: "800" },
  itemMeta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
});
