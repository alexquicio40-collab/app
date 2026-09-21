import {
  FieldLabel,
  FieldRow,
  GhostButton,
  PanelCard,
  PrimaryButton,
  SelectField,
  TextField,
} from "@/features/routes/assign/components/form-kit";
import type { RestrictionItem } from "@/features/routes/assign/types";
import { ActionIconButton, TrashIcon } from "@/features/routes/components/route-action-bar";
import { theme } from "@/lib/theme";
import { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

const VEHICLE_TYPES = [
  { value: "liviano", label: "Liviano" },
  { value: "pesado", label: "Pesado" },
  { value: "ambos", label: "Ambos" },
];

type RestrictionPanelProps = {
  items: RestrictionItem[];
  bottomPad?: number;
  onSave: (
    input: {
      tipoVehiculo: string;
      nombre: string;
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    },
    editId?: number,
  ) => Promise<void>;
  onToggle: (item: RestrictionItem) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

export function RestrictionPanel({
  items,
  bottomPad = 120,
  onSave,
  onToggle,
  onDelete,
}: RestrictionPanelProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | undefined>();
  const [tipo, setTipo] = useState<string | null>("ambos");
  const [nombre, setNombre] = useState("");
  const [minLat, setMinLat] = useState("");
  const [maxLat, setMaxLat] = useState("");
  const [minLng, setMinLng] = useState("");
  const [maxLng, setMaxLng] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setEditId(undefined);
    setTipo("ambos");
    setNombre("");
    setMinLat("");
    setMaxLat("");
    setMinLng("");
    setMaxLng("");
  };

  const loadEdit = (item: RestrictionItem) => {
    setEditId(item.id);
    setTipo(item.tipoVehiculo);
    setNombre(item.nombre);
    setMinLat(String(item.minLat));
    setMaxLat(String(item.maxLat));
    setMinLng(String(item.minLng));
    setMaxLng(String(item.maxLng));
    setFormOpen(true);
  };

  const submit = async () => {
    const a = Number(minLat);
    const b = Number(maxLat);
    const c = Number(minLng);
    const d = Number(maxLng);
    if (!tipo || !nombre.trim() || ![a, b, c, d].every(Number.isFinite)) {
      notify("Restricción", "Completa tipo, nombre y coordenadas de la zona");
      return;
    }
    setSaving(true);
    try {
      await onSave(
        {
          tipoVehiculo: tipo,
          nombre: nombre.trim(),
          minLat: Math.min(a, b),
          maxLat: Math.max(a, b),
          minLng: Math.min(c, d),
          maxLng: Math.max(c, d),
        },
        editId,
      );
      reset();
      setFormOpen(false);
      notify("Listo", editId ? "Restricción actualizada" : "Restricción guardada");
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    const ok =
      Platform.OS === "web"
        ? window.confirm("¿Eliminar esta restricción?")
        : await new Promise<boolean>((resolve) => {
            Alert.alert("Eliminar", "¿Eliminar esta restricción?", [
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
        title={editId ? "Editar restricción" : "Nueva restricción"}
        subtitle="Define una zona rectangular (min/max latitud y longitud)."
      >
        <FieldRow>
          <SelectField
            flex
            label="Tipo *"
            value={tipo}
            placeholder="Tipo…"
            options={VEHICLE_TYPES}
            onChange={setTipo}
          />
          <View style={styles.half}>
            <FieldLabel>Nombre *</FieldLabel>
            <TextField value={nombre} onChangeText={setNombre} placeholder="Zona…" />
          </View>
        </FieldRow>
        <FieldRow>
          <View style={styles.half}>
            <FieldLabel>Min lat</FieldLabel>
            <TextField value={minLat} onChangeText={setMinLat} placeholder="-12.12" />
          </View>
          <View style={styles.half}>
            <FieldLabel>Max lat</FieldLabel>
            <TextField value={maxLat} onChangeText={setMaxLat} placeholder="-12.10" />
          </View>
        </FieldRow>
        <FieldRow>
          <View style={styles.half}>
            <FieldLabel>Min lng</FieldLabel>
            <TextField value={minLng} onChangeText={setMinLng} placeholder="-77.05" />
          </View>
          <View style={styles.half}>
            <FieldLabel>Max lng</FieldLabel>
            <TextField value={maxLng} onChangeText={setMaxLng} placeholder="-77.02" />
          </View>
        </FieldRow>
        <FieldRow>
          <View style={styles.half}>
            <PrimaryButton label={editId ? "Actualizar" : "Guardar"} onPress={submit} loading={saving} />
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

      <Text style={styles.listTitle}>Zonas ({items.length})</Text>
      {items.map((item) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.copy}>
            <Text style={styles.title}>{item.nombre}</Text>
            <Text style={styles.meta}>
              {item.tipoVehiculo} · {item.activo ? "Activa" : "Inactiva"}
            </Text>
          </View>
          <View style={styles.actions}>
            <ActionIconButton
              label={item.activo ? "Desactivar" : "Activar"}
              glyph={item.activo ? "●" : "○"}
              tone={item.activo ? "info" : "muted"}
              onPress={() => void onToggle(item)}
            />
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

function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}: ${message}`);
  else Alert.alert(title, message);
}

const styles = StyleSheet.create({
  wrap: { padding: 8, gap: 8 },
  half: { flex: 1, minWidth: 0, gap: 4 },
  listTitle: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "800",
    paddingHorizontal: 2,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 10,
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { color: theme.colors.ink, fontSize: 13, fontWeight: "800" },
  meta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
});
