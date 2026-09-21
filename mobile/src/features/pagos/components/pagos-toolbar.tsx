import type { PagosFilters } from "@/features/pagos/types";
import { theme } from "@/lib/theme";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type PagosToolbarProps = {
  filters: PagosFilters;
  visible: number;
  total: number;
  hasFilters: boolean;
  onChange: (patch: Partial<PagosFilters>) => void;
  onClear: () => void;
};

export function PagosToolbar({
  filters,
  visible,
  total,
  hasFilters,
  onChange,
  onClear,
}: PagosToolbarProps) {
  const [open, setOpen] = useState(false);
  const hasSearch = Boolean(filters.search.trim());
  const activeCount = [filters.search.trim(), filters.fechaDesde, filters.fechaHasta].filter(
    Boolean,
  ).length;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((v) => !v)}
          style={styles.headMain}
        >
          <View style={styles.headCopy}>
            <Text style={styles.headTitle}>Filtros</Text>
            <Text style={styles.headMeta}>
              {activeCount > 0
                ? `${activeCount} activo${activeCount > 1 ? "s" : ""} · ${visible} de ${total}`
                : `${visible} de ${total}`}
            </Text>
          </View>
        </Pressable>
        {hasFilters ? (
          <Pressable onPress={onClear} hitSlop={8} style={styles.clearAll}>
            <Text style={styles.clearAllText}>Limpiar</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => setOpen((v) => !v)} style={styles.icon}>
          <Text style={styles.iconText}>{open ? "−" : "+"}</Text>
        </Pressable>
      </View>

      {open ? (
        <View style={styles.body}>
          <View style={styles.searchBox}>
            <TextInput
              value={filters.search}
              onChangeText={(search) => onChange({ search })}
              placeholder="Buscar local, conductor o placa…"
              placeholderTextColor={theme.colors.muted}
              style={styles.search}
              autoCorrect={false}
            />
            {hasSearch ? (
              <Pressable onPress={() => onChange({ search: "" })} hitSlop={8} style={styles.clearHit}>
                <Text style={styles.clearGlyph}>×</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.filtersRow}>
            <DateCell
              label="Desde"
              value={filters.fechaDesde}
              onChange={(fechaDesde) => onChange({ fechaDesde })}
            />
            <View style={styles.divider} />
            <DateCell
              label="Hasta"
              value={filters.fechaHasta}
              onChange={(fechaHasta) => onChange({ fechaHasta })}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function DateCell({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <View style={[styles.filterCell, value ? styles.filterCellOn : null]}>
      <Text style={styles.filterLabel}>{label}</Text>
      <TextInput
        value={value ?? ""}
        onChangeText={(text) => {
          if (!text.trim()) {
            onChange(null);
            return;
          }
          if (/^\d{4}-\d{2}-\d{2}$/.test(text.trim())) onChange(text.trim());
          else onChange(text);
        }}
        placeholder="AAAA-MM-DD"
        placeholderTextColor={theme.colors.muted}
        style={styles.dateInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 8,
    marginTop: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: "hidden",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headMain: { flex: 1, minWidth: 0 },
  headCopy: { gap: 1 },
  headTitle: { color: theme.colors.ink, fontSize: 13, fontWeight: "800" },
  headMeta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  clearAll: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: theme.colors.cream,
  },
  clearAllText: { color: theme.colors.accent, fontSize: 11, fontWeight: "800" },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    color: theme.colors.accent,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  body: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
    paddingTop: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingHorizontal: 10,
    minHeight: 38,
  },
  search: {
    flex: 1,
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 8,
  },
  clearHit: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
  clearGlyph: {
    color: theme.colors.muted,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  filtersRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    overflow: "hidden",
    minHeight: 44,
  },
  divider: { width: 1, backgroundColor: theme.colors.line },
  filterCell: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 1,
  },
  filterCellOn: { backgroundColor: theme.colors.accentSoft },
  filterLabel: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  dateInput: {
    padding: 0,
    margin: 0,
    color: theme.colors.ink,
    fontSize: 11,
    fontWeight: "700",
  },
});
