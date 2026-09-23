import type { LocalOption } from "@/features/hoja-ruta/types";
import { theme } from "@/lib/theme";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HojaLocalPickerProps = {
  open: boolean;
  locales: LocalOption[];
  loading?: boolean;
  selectedIds: Set<string>;
  onClose: () => void;
  onSelect: (local: LocalOption) => void;
};

export function HojaLocalPicker({
  open,
  locales,
  loading = false,
  selectedIds,
  onClose,
  onSelect,
}: HojaLocalPickerProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return locales.filter((item) => {
      if (selectedIds.has(item.id)) return false;
      if (!q) return true;
      return (
        item.nombre.toLowerCase().includes(q) || item.direccion.toLowerCase().includes(q)
      );
    });
  }, [locales, selectedIds, search]);

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={styles.title}>Agregar local</Text>
              <Text style={styles.meta}>
                {loading && !locales.length
                  ? "Cargando locales…"
                  : `${filtered.length} disponibles`}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nombre o dirección…"
              placeholderTextColor={theme.colors.muted}
              style={styles.search}
              autoCorrect={false}
              editable={!loading || locales.length > 0}
            />
          </View>

          {loading && !locales.length ? (
            <View style={styles.boot}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text style={styles.empty}>Cargando lista de locales…</Text>
            </View>
          ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            initialNumToRender={24}
            maxToRenderPerBatch={24}
            windowSize={7}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.empty}>
                {search.trim() ? "Sin coincidencias" : "No hay más locales para agregar"}
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  setSearch("");
                }}
                style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
              >
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.nombre}
                </Text>
                {item.direccion ? (
                  <Text style={styles.rowMeta} numberOfLines={2}>
                    {item.direccion}
                  </Text>
                ) : null}
              </Pressable>
            )}
          />
          )}
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
  sheet: {
    maxHeight: "85%",
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  headCopy: { flex: 1, gap: 2 },
  title: { color: theme.colors.ink, fontSize: 17, fontWeight: "900" },
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
  searchBox: {
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
  },
  search: {
    paddingVertical: 10,
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  list: { paddingHorizontal: 12, paddingBottom: 16, gap: 6 },
  empty: {
    textAlign: "center",
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "600",
    paddingTop: 28,
  },
  boot: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  row: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    gap: 3,
  },
  rowPressed: { backgroundColor: theme.colors.accentSoft },
  rowTitle: { color: theme.colors.ink, fontSize: 14, fontWeight: "800" },
  rowMeta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600", lineHeight: 15 },
});
