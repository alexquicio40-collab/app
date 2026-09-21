import {
  deleteCajaDiaria,
  fetchCajaDiariaMap,
  setCajaDiaria,
} from "@/features/caja-diaria/api";
import type { CajaDiariaMap } from "@/features/caja-diaria/types";
import type { OperatorCatalogItem } from "@/features/map/types";
import { theme } from "@/lib/theme";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CajaDiariaSheetProps = {
  open: boolean;
  operators: OperatorCatalogItem[];
  onClose: () => void;
};

function todayIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatMoney(n: number) {
  return `S/ ${n.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function sanitizeMoney(value: string) {
  return value.replace(/[^0-9.,]/g, "");
}

function parseMoney(value: string) {
  const n = Number.parseFloat(value.trim().replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function CajaDiariaSheet({ open, operators, onClose }: CajaDiariaSheetProps) {
  const insets = useSafeAreaInsets();
  const [fecha, setFecha] = useState(todayIso);
  const [search, setSearch] = useState("");
  const [cajas, setCajas] = useState<CajaDiariaMap>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (day: string) => {
    setLoading(true);
    setError(null);
    try {
      const map = await fetchCajaDiariaMap(day);
      setCajas(map);
      const next: Record<string, string> = {};
      for (const [id, row] of Object.entries(map)) {
        next[id] = row.monto > 0 ? String(row.monto) : "";
      }
      setDrafts(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la caja");
      setCajas({});
      setDrafts({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const day = todayIso();
    setFecha(day);
    setSearch("");
    void load(day);
  }, [open, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...operators].sort((a, b) => a.name.localeCompare(b.name, "es"));
    if (!q) return list;
    return list.filter((item) => item.name.toLowerCase().includes(q));
  }, [operators, search]);

  const assignedCount = useMemo(
    () => Object.values(cajas).filter((row) => row.monto > 0).length,
    [cajas],
  );

  const changeFecha = (value: string) => {
    setFecha(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) void load(value);
  };

  const save = async (op: OperatorCatalogItem) => {
    const key = String(op.id);
    const monto = parseMoney(drafts[key] ?? "");
    if (monto <= 0) {
      Alert.alert("Monto", "Ingresa un monto mayor a 0");
      return;
    }
    setBusyId(key);
    try {
      await setCajaDiaria({ conductorId: op.id, fecha, monto });
      await load(fecha);
      if (Platform.OS === "web") window.alert(`Caja asignada: ${formatMoney(monto)}`);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusyId(null);
    }
  };

  const remove = (op: OperatorCatalogItem) => {
    const key = String(op.id);
    const run = async () => {
      setBusyId(key);
      try {
        await deleteCajaDiaria({ conductorId: op.id, fecha });
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        await load(fecha);
      } catch (err) {
        Alert.alert("Error", err instanceof Error ? err.message : "No se pudo quitar");
      } finally {
        setBusyId(null);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`¿Quitar la caja de ${op.name}? El operador no verá precarga.`)) {
        void run();
      }
      return;
    }

    Alert.alert(
      "¿Quitar caja?",
      `${op.name} no verá precarga en su hoja de ruta de este día.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Quitar", style: "destructive", onPress: () => void run() },
      ],
    );
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.handle} />

          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={styles.kicker}>Asignación</Text>
              <Text style={styles.title}>Caja del día</Text>
              <Text style={styles.meta}>
                Monto que recibirá cada operador · {assignedCount} asignada
                {assignedCount === 1 ? "" : "s"}
              </Text>
            </View>
            <Pressable accessibilityLabel="Cerrar" onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.toolbar}>
            <View style={styles.fechaBox}>
              <Text style={styles.fieldLabel}>Fecha</Text>
              <TextInput
                value={fecha}
                onChangeText={changeFecha}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={theme.colors.muted}
                style={styles.fechaInput}
                autoCorrect={false}
              />
            </View>
            <View style={styles.searchBox}>
              <Text style={styles.fieldLabel}>Buscar</Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Operador…"
                placeholderTextColor={theme.colors.muted}
                style={styles.searchInput}
                autoCorrect={false}
              />
            </View>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.colors.accent} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.error}>{error}</Text>
              <Pressable onPress={() => void load(fecha)} style={styles.retry}>
                <Text style={styles.retryText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
            >
              {filtered.length === 0 ? (
                <Text style={styles.empty}>Sin operadores</Text>
              ) : (
                filtered.map((op) => {
                  const key = String(op.id);
                  const assigned = Boolean(cajas[key]?.monto);
                  const busy = busyId === key;
                  return (
                    <View
                      key={op.id}
                      style={[styles.row, assigned ? styles.rowOn : null]}
                    >
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials(op.name)}</Text>
                      </View>
                      <View style={styles.rowCopy}>
                        <Text style={styles.rowName} numberOfLines={1}>
                          {op.name}
                        </Text>
                        <Text
                          style={[
                            styles.rowStatus,
                            { color: assigned ? theme.colors.accent : theme.colors.muted },
                          ]}
                        >
                          {assigned ? `Asignada · ${formatMoney(cajas[key].monto)}` : "Sin caja"}
                        </Text>
                        <View style={styles.amountRow}>
                          <Text style={styles.currency}>S/</Text>
                          <TextInput
                            value={drafts[key] ?? ""}
                            onChangeText={(value) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [key]: sanitizeMoney(value),
                              }))
                            }
                            placeholder="0.00"
                            placeholderTextColor={theme.colors.muted}
                            keyboardType="decimal-pad"
                            editable={!busy}
                            style={styles.amountInput}
                          />
                        </View>
                      </View>
                      <View style={styles.rowActions}>
                        <Pressable
                          disabled={busy}
                          onPress={() => void save(op)}
                          style={[styles.saveBtn, busy ? styles.btnBusy : null]}
                        >
                          {busy ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={styles.saveText}>Guardar</Text>
                          )}
                        </Pressable>
                        {assigned ? (
                          <Pressable
                            disabled={busy}
                            onPress={() => remove(op)}
                            style={styles.removeBtn}
                          >
                            <Text style={styles.removeText}>Quitar</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "90%",
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
    marginTop: 10,
    marginBottom: 4,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headCopy: { flex: 1, minWidth: 0, gap: 2 },
  kicker: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: { color: theme.colors.ink, fontSize: 18, fontWeight: "900" },
  meta: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  close: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
  },
  closeText: { color: theme.colors.muted, fontSize: 22, fontWeight: "600", lineHeight: 24 },
  toolbar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  fechaBox: {
    width: 128,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
  },
  searchBox: {
    flex: 1,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
  },
  fieldLabel: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  fechaInput: {
    padding: 0,
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  searchInput: {
    padding: 0,
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  center: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 10,
  },
  error: { color: theme.colors.danger, fontSize: 13, fontWeight: "700", textAlign: "center" },
  retry: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
  },
  retryText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  list: { paddingHorizontal: 12, paddingBottom: 18, gap: 8 },
  empty: {
    textAlign: "center",
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "600",
    paddingTop: 28,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
  },
  rowOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.goldSoft,
  },
  avatarText: { color: theme.colors.gold, fontSize: 12, fontWeight: "900" },
  rowCopy: { flex: 1, minWidth: 0, gap: 3 },
  rowName: { color: theme.colors.ink, fontSize: 14, fontWeight: "900" },
  rowStatus: { fontSize: 11, fontWeight: "700" },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  currency: { color: theme.colors.muted, fontSize: 12, fontWeight: "800" },
  amountInput: {
    flex: 1,
    padding: 0,
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  rowActions: { gap: 6, alignItems: "stretch" },
  saveBtn: {
    minWidth: 74,
    minHeight: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: theme.colors.accent,
  },
  btnBusy: { opacity: 0.8 },
  saveText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  removeBtn: {
    minHeight: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: theme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: "#E8B4B0",
  },
  removeText: { color: theme.colors.danger, fontSize: 11, fontWeight: "800" },
});
