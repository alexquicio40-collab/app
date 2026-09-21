import type { MetodoPagoOption } from "@/features/locales/api";
import { theme } from "@/lib/theme";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MetodosPagoManagerSheetProps = {
  open: boolean;
  items: MetodoPagoOption[];
  saving?: boolean;
  onClose: () => void;
  onCreate: (nombre: string) => Promise<void>;
  onRename: (id: number, nombre: string) => Promise<void>;
  onDelete: (item: MetodoPagoOption) => Promise<void>;
};

export function MetodosPagoManagerSheet({
  open,
  items,
  saving = false,
  onClose,
  onCreate,
  onRename,
  onDelete,
}: MetodosPagoManagerSheetProps) {
  const insets = useSafeAreaInsets();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<MetodoPagoOption | null>(null);
  const [editNombre, setEditNombre] = useState("");

  useEffect(() => {
    if (!open) {
      setNombre("");
      setError(null);
      setEditItem(null);
      setEditNombre("");
    }
  }, [open]);

  const submitCreate = async () => {
    const trimmed = nombre.trim();
    if (!trimmed) {
      setError("Escribe un nombre");
      return;
    }
    setError(null);
    try {
      await onCreate(trimmed);
      setNombre("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar");
    }
  };

  const submitEdit = async () => {
    if (!editItem) return;
    const trimmed = editNombre.trim();
    if (!trimmed) {
      setError("Escribe un nombre");
      return;
    }
    setError(null);
    try {
      await onRename(editItem.id, trimmed);
      setEditItem(null);
      setEditNombre("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar");
    }
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.handle} />

          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={styles.kicker}>Catálogo</Text>
              <Text style={styles.title}>Formas de pago</Text>
              <Text style={styles.meta}>
                {items.length} método{items.length === 1 ? "" : "s"} activo
                {items.length === 1 ? "" : "s"}
              </Text>
            </View>
            <Pressable accessibilityLabel="Cerrar" onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.createRow}>
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nueva forma de pago…"
              placeholderTextColor={theme.colors.muted}
              style={styles.createInput}
              maxLength={60}
              editable={!saving}
              onSubmitEditing={() => void submitCreate()}
              returnKeyType="done"
            />
            <Pressable
              disabled={saving}
              onPress={() => void submitCreate()}
              style={({ pressed }) => [
                styles.addBtn,
                pressed || saving ? styles.addPressed : null,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.addText}>Agregar</Text>
              )}
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          >
            {items.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Sin formas de pago</Text>
                <Text style={styles.emptyText}>
                  Agrega la primera (Yape, Plin, Efectivo…)
                </Text>
              </View>
            ) : (
              items.map((item) => (
                <View key={item.id} style={styles.row}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{initials(item.nombre)}</Text>
                  </View>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <Pressable
                    accessibilityLabel="Editar"
                    disabled={saving}
                    onPress={() => {
                      setEditItem(item);
                      setEditNombre(item.nombre);
                      setError(null);
                    }}
                    style={styles.iconBtn}
                  >
                    <Text style={styles.editGlyph}>✎</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Eliminar"
                    disabled={saving}
                    onPress={() => void onDelete(item)}
                    style={[styles.iconBtn, styles.iconDanger]}
                  >
                    <Text style={styles.deleteGlyph}>×</Text>
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      <Modal
        visible={Boolean(editItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditItem(null)}
      >
        <View style={styles.editBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditItem(null)} />
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>Renombrar</Text>
            <TextInput
              value={editNombre}
              onChangeText={setEditNombre}
              style={styles.editInput}
              maxLength={60}
              autoFocus
              editable={!saving}
              onSubmitEditing={() => void submitEdit()}
            />
            <View style={styles.editActions}>
              <Pressable onPress={() => setEditItem(null)} style={styles.editCancel}>
                <Text style={styles.editCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                disabled={saving}
                onPress={() => void submitEdit()}
                style={styles.editSave}
              >
                <Text style={styles.editSaveText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

function initials(nombre: string) {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
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
    maxHeight: "82%",
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
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 8,
  },
  createInput: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  addBtn: {
    minWidth: 88,
    minHeight: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: theme.colors.accent,
  },
  addPressed: { opacity: 0.85 },
  addText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  error: {
    marginHorizontal: 16,
    marginBottom: 6,
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  list: { flexGrow: 0 },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 8,
  },
  empty: {
    paddingVertical: 36,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: { color: theme.colors.ink, fontSize: 14, fontWeight: "800" },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: "center",
    maxWidth: 240,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.goldSoft,
  },
  badgeText: { color: theme.colors.gold, fontSize: 11, fontWeight: "900" },
  rowTitle: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accentSoft,
  },
  iconDanger: { backgroundColor: theme.colors.dangerSoft },
  editGlyph: { color: theme.colors.accent, fontSize: 14, fontWeight: "700" },
  deleteGlyph: { color: theme.colors.danger, fontSize: 18, fontWeight: "700", lineHeight: 20 },
  editBackdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  editCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    padding: 16,
    backgroundColor: theme.colors.surface,
    gap: 12,
  },
  editTitle: { color: theme.colors.ink, fontSize: 16, fontWeight: "900" },
  editInput: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  editActions: { flexDirection: "row", gap: 8 },
  editCancel: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.cream,
  },
  editCancelText: { color: theme.colors.muted, fontSize: 13, fontWeight: "800" },
  editSave: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
  },
  editSaveText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
