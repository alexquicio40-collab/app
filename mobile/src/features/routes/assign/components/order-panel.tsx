import {
  FieldLabel,
  FieldRow,
  PanelCard,
  PrimaryButton,
  SelectField,
  TextField,
} from "@/features/routes/assign/components/form-kit";
import { fetchRoutes } from "@/features/routes/api";
import type { ConductorOption, RouteItem } from "@/features/routes/types";
import { limaDate } from "@/lib/api";
import { theme } from "@/lib/theme";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type OrderPanelProps = {
  conductores: ConductorOption[];
  bottomPad?: number;
  onSaveOrder: (orderedIds: string[]) => Promise<void>;
};

export function OrderPanel({ conductores, bottomPad = 120, onSaveOrder }: OrderPanelProps) {
  const [conductorId, setConductorId] = useState<string | null>(null);
  const [fecha, setFecha] = useState(limaDate());
  const [ordered, setOrdered] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!conductorId || !fecha) {
      setOrdered([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetchRoutes({ fecha, conductorId })
      .then((rows) => {
        if (cancelled) return;
        const sorted = [...rows].sort((a, b) => {
          const oa = a.orden ?? 9999;
          const ob = b.orden ?? 9999;
          if (oa !== ob) return oa - ob;
          return Number(a.id) - Number(b.id);
        });
        setOrdered(sorted);
      })
      .catch(() => {
        if (!cancelled) setOrdered([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conductorId, fecha]);

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= ordered.length) return;
    setOrdered((prev) => {
      const copy = [...prev];
      const tmp = copy[index];
      copy[index] = copy[next];
      copy[next] = tmp;
      return copy;
    });
  };

  const save = async () => {
    if (!ordered.length) {
      notify("Orden", "No hay rutas para guardar");
      return;
    }
    setSaving(true);
    try {
      await onSaveOrder(ordered.map((item) => item.id));
      notify("Listo", "Orden actualizado");
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.wrap, { paddingBottom: bottomPad }]}>
      <PanelCard
        title="Orden de rutas"
        subtitle="Usa ↑ ↓ para definir el orden de visita y luego guarda."
      >
        <FieldRow>
          <SelectField
            flex
            label="Operador"
            value={conductorId}
            placeholder="Operador…"
            options={conductores.map((item) => ({ value: item.id, label: item.nombre }))}
            searchable
            onChange={setConductorId}
          />
          <View style={styles.half}>
            <FieldLabel>Fecha</FieldLabel>
            <TextField value={fecha} onChangeText={setFecha} placeholder={limaDate()} />
          </View>
        </FieldRow>
        <PrimaryButton label="Guardar orden" onPress={save} loading={saving} disabled={!ordered.length} />
      </PanelCard>

      {!conductorId ? (
        <Text style={styles.empty}>Selecciona un operador para ver sus rutas.</Text>
      ) : loading ? (
        <ActivityIndicator color={theme.colors.accent} style={styles.loader} />
      ) : ordered.length === 0 ? (
        <Text style={styles.empty}>No hay rutas para esa fecha.</Text>
      ) : (
        ordered.map((route, index) => (
          <View key={route.id} style={styles.row}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{letter(index)}</Text>
            </View>
            <View style={styles.copy}>
              <Text style={styles.title} numberOfLines={1}>
                {route.localNombre}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                #{route.id} · {route.localDireccion || "Sin dirección"}
              </Text>
            </View>
            <Pressable onPress={() => move(index, -1)} style={styles.arrow}>
              <Text style={styles.arrowText}>↑</Text>
            </Pressable>
            <Pressable onPress={() => move(index, 1)} style={styles.arrow}>
              <Text style={styles.arrowText}>↓</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function letter(index: number) {
  return index < 26 ? String.fromCharCode(65 + index) : String(index + 1);
}

function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}: ${message}`);
  else Alert.alert(title, message);
}

const styles = StyleSheet.create({
  wrap: { padding: 8, gap: 6 },
  half: { flex: 1, minWidth: 0, gap: 4 },
  loader: { marginTop: 24 },
  empty: {
    color: theme.colors.muted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 10,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: theme.colors.accent, fontWeight: "800", fontSize: 12 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { color: theme.colors.ink, fontSize: 13, fontWeight: "800" },
  meta: { color: theme.colors.muted, fontSize: 11 },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: { color: theme.colors.ink, fontWeight: "800" },
});
