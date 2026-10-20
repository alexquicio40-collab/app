import { DayCalendarField } from "@/features/routes/components/day-calendar-field";
import { fetchRutasReprogramadas, updateRoute } from "@/features/routes/api";
import type { RouteItem } from "@/features/routes/types";
import { limaDate } from "@/lib/api";
import { theme } from "@/lib/theme";
import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ROLES = new Set(["administrador", "asesor"]);

export function ReprogramAviso() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const rol = (user?.rol ?? "").toLowerCase();
  const visible = ROLES.has(rol);
  const [items, setItems] = useState<RouteItem[]>([]);
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!visible) return;
    try {
      const rows = await fetchRutasReprogramadas();
      if (!rows.length) {
        setItems([]);
        setOpen(false);
        return;
      }
      setItems(rows);
      setDrafts((prev) => {
        const next = { ...prev };
        for (const row of rows) {
          if (!next[row.id]) next[row.id] = row.fechaAsignacion || limaDate();
        }
        return next;
      });
      setOpen(true);
    } catch {
      // Sin aviso si no hay red.
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    void load();
    const id = setInterval(() => void load(), 45000);
    return () => clearInterval(id);
  }, [visible, load]);

  const saveFecha = async (item: RouteItem) => {
    const fecha = drafts[item.id] || limaDate();
    setSavingId(item.id);
    setError(null);
    try {
      await updateRoute(item.id, { fechaAsignacion: fecha, estado: "programado" });
      setItems((prev) => {
        const next = prev.filter((row) => row.id !== item.id);
        if (!next.length) setOpen(false);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la fecha");
    } finally {
      setSavingId(null);
    }
  };

  if (!open || !items.length) return null;

  const titulo =
    items.length === 1 ? "1 ruta para reprogramar" : `${items.length} rutas para reprogramar`;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { marginBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.kicker}>Reprogramar</Text>
          <Text style={styles.title}>{titulo}</Text>
          <Text style={styles.hint}>Elige la nueva fecha y guárdala desde este aviso.</Text>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {items.map((item, index) => (
              <View key={item.id} style={styles.item}>
                <Text style={styles.local} numberOfLines={2}>
                  {item.localNombre || "Local"}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.conductorNombre || "Operador"}
                  {item.fechaAsignacion ? ` · ${item.fechaAsignacion}` : ""}
                </Text>
                <DayCalendarField
                  value={drafts[item.id] ?? limaDate()}
                  onChange={(fecha) => setDrafts((prev) => ({ ...prev, [item.id]: fecha }))}
                  autoOpen={index === 0}
                />
                <Pressable
                  onPress={() => void saveFecha(item)}
                  disabled={savingId === item.id}
                  style={styles.save}
                >
                  {savingId === item.id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveText}>Cambiar fecha</Text>
                  )}
                </Pressable>
              </View>
            ))}
          </ScrollView>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={() => setOpen(false)} style={styles.later}>
            <Text style={styles.laterText}>Más tarde</Text>
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
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    maxHeight: "84%",
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 4,
  },
  kicker: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: { color: theme.colors.ink, fontSize: 20, fontWeight: "800" },
  hint: { color: theme.colors.muted, fontSize: 13, fontWeight: "600", marginBottom: 8 },
  list: { flexGrow: 0 },
  listContent: { gap: 8 },
  item: {
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
  },
  local: { color: theme.colors.ink, fontSize: 14, fontWeight: "800" },
  meta: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  save: {
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  error: { color: theme.colors.danger, fontSize: 12, fontWeight: "700" },
  later: {
    alignSelf: "flex-end",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  laterText: { color: theme.colors.accent, fontSize: 13, fontWeight: "800" },
});
