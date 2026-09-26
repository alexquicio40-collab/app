import { inicialNombre } from "@/features/rutas-mapa/lib/format";
import type { ConductorOption } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

type ConductoresBarProps = {
  conductores: ConductorOption[];
  countByConductor: Map<string, number>;
  colorByConductor: Map<string, string>;
  totalRutas: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export function ConductoresBar({
  conductores,
  countByConductor,
  colorByConductor,
  totalRutas,
  selectedId,
  onSelect,
}: ConductoresBarProps) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const rows = q
      ? conductores.filter((item) => item.nombre.toLowerCase().includes(q))
      : conductores;
    const withRoutes = rows
      .filter((item) => (countByConductor.get(item.id) ?? 0) > 0)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    const withoutRoutes = rows
      .filter((item) => (countByConductor.get(item.id) ?? 0) === 0)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return { withRoutes, withoutRoutes };
  }, [conductores, countByConductor, q]);

  return (
    <View style={styles.wrap}>
      <View style={styles.searchBox}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar operador…"
          placeholderTextColor={theme.colors.muted}
          style={styles.search}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8} style={styles.clear}>
            <Text style={styles.clearGlyph}>×</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <Chip
          label="Todos"
          count={totalRutas}
          color={theme.colors.accent}
          initial="★"
          selected={selectedId == null}
          onPress={() => onSelect(null)}
        />

        {visible.withRoutes.map((item) => (
          <Chip
            key={item.id}
            label={item.nombre}
            count={countByConductor.get(item.id) ?? 0}
            color={colorByConductor.get(item.id) ?? theme.colors.accent}
            initial={inicialNombre(item.nombre)}
            selected={selectedId === item.id}
            onPress={() => onSelect(item.id)}
          />
        ))}

        {visible.withRoutes.length && visible.withoutRoutes.length ? (
          <View style={styles.divider} />
        ) : null}

        {visible.withoutRoutes.map((item) => (
          <Chip
            key={item.id}
            label={item.nombre}
            count={0}
            color={colorByConductor.get(item.id) ?? theme.colors.muted}
            initial={inicialNombre(item.nombre)}
            selected={selectedId === item.id}
            muted
            onPress={() => onSelect(item.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  count,
  color,
  initial,
  selected,
  muted,
  onPress,
}: {
  label: string;
  count: number;
  color: string;
  initial: string;
  selected: boolean;
  muted?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected ? { borderColor: color, backgroundColor: `${color}18` } : null,
        muted ? styles.chipMuted : null,
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.count}>
          {count} {count === 1 ? "ruta" : "rutas"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  searchBox: {
    marginHorizontal: 10,
    marginTop: 6,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
    paddingRight: 2,
  },
  search: {
    flex: 1,
    paddingVertical: 0,
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "600",
  },
  clear: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  clearGlyph: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 15,
  },
  row: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  divider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: theme.colors.line,
    marginHorizontal: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    maxWidth: 160,
  },
  chipMuted: { opacity: 0.55 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  meta: { flex: 1, minWidth: 0, gap: 1 },
  name: { color: theme.colors.ink, fontSize: 12, fontWeight: "800" },
  count: { color: theme.colors.muted, fontSize: 10, fontWeight: "600" },
});
