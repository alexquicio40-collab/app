import { ROL_FILTER_OPTIONS } from "@/features/usuarios/lib/roles";
import type { UsuariosFilters } from "@/features/usuarios/types";
import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type UsuariosToolbarProps = {
  filters: UsuariosFilters;
  total: number;
  visible: number;
  hasFilters: boolean;
  onChange: (patch: Partial<UsuariosFilters>) => void;
  onClear: () => void;
};

export function UsuariosToolbar({
  filters,
  total,
  visible,
  hasFilters,
  onChange,
  onClear,
}: UsuariosToolbarProps) {
  return (
    <View style={styles.wrap}>
      <TextInput
        value={filters.search}
        onChangeText={(search) => onChange({ search })}
        placeholder="Buscar nombre o usuario…"
        placeholderTextColor={theme.colors.muted}
        style={styles.search}
      />

      <View style={styles.row}>
        <Pressable
          onPress={() => onChange({ rol: null })}
          style={[styles.chip, !filters.rol ? styles.chipOn : null]}
        >
          <Text style={[styles.chipText, !filters.rol ? styles.chipTextOn : null]}>Todos</Text>
        </Pressable>
        {ROL_FILTER_OPTIONS.map((item) => {
          const on = filters.rol === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => onChange({ rol: on ? null : item.value })}
              style={[styles.chip, on ? styles.chipOn : null]}
            >
              <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.meta}>
        <Text style={styles.count}>
          {visible} de {total}
        </Text>
        {hasFilters ? (
          <Pressable onPress={onClear}>
            <Text style={styles.clear}>Limpiar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  search: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingHorizontal: 12,
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
  },
  chipOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  chipText: { color: theme.colors.muted, fontSize: 11, fontWeight: "700" },
  chipTextOn: { color: theme.colors.accent },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  count: { color: theme.colors.muted, fontSize: 11, fontWeight: "700" },
  clear: { color: theme.colors.accent, fontSize: 11, fontWeight: "800" },
});
