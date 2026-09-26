import { formatFechaLabel } from "@/features/hoja-ruta/lib/format";
import type { HistorialFilters } from "@/features/hoja-ruta/types";
import type { ConductorOption } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { SearchableOptionSheet } from "@/ui/searchable-option-sheet";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type HistorialFiltersBarProps = {
  filters: HistorialFilters;
  conductores: ConductorOption[];
  puedeVerTodas: boolean;
  hasFilters: boolean;
  total: number;
  onChange: (patch: Partial<HistorialFilters>) => void;
  onClear: () => void;
};

export function HistorialFiltersBar({
  filters,
  conductores,
  puedeVerTodas,
  hasFilters,
  total,
  onChange,
  onClear,
}: HistorialFiltersBarProps) {
  const rangeLabel =
    filters.fechaDesde && filters.fechaHasta
      ? filters.fechaDesde === filters.fechaHasta
        ? formatFechaLabel(filters.fechaDesde)
        : `${formatFechaLabel(filters.fechaDesde)} → ${formatFechaLabel(filters.fechaHasta)}`
      : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          {total} hoja{total === 1 ? "" : "s"}
          {rangeLabel ? ` · ${rangeLabel}` : ""}
        </Text>
        {hasFilters ? (
          <Pressable onPress={onClear} style={styles.clear}>
            <Text style={styles.clearText}>Limpiar</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.row}>
        <DateField
          label="Desde"
          value={filters.fechaDesde}
          onChange={(fechaDesde) => onChange({ fechaDesde })}
        />
        <View style={styles.divider} />
        <DateField
          label="Hasta"
          value={filters.fechaHasta}
          onChange={(fechaHasta) => onChange({ fechaHasta })}
        />
        {puedeVerTodas ? (
          <>
            <View style={styles.divider} />
            <ConductorSelect
              value={filters.conductorId}
              options={conductores}
              onChange={(conductorId) => onChange({ conductorId })}
            />
          </>
        ) : null}
      </View>
    </View>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <View style={[styles.cell, value ? styles.cellOn : null]}>
      <Text style={styles.cellLabel}>{label}</Text>
      <TextInput
        value={value ?? ""}
        onChangeText={(text) => {
          if (!text.trim()) {
            onChange(null);
            return;
          }
          onChange(text.trim());
        }}
        placeholder="AAAA-MM-DD"
        placeholderTextColor={theme.colors.muted}
        style={styles.dateInput}
        autoCorrect={false}
      />
    </View>
  );
}

function ConductorSelect({
  value,
  options,
  onChange,
}: {
  value: string | null;
  options: ConductorOption[];
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((item) => item.id === value)?.nombre;
  const active = Boolean(value);

  return (
    <>
      <View style={[styles.cell, styles.conductorCell, active ? styles.cellOn : null]}>
        <Pressable onPress={() => setOpen(true)} style={styles.conductorMain}>
          <Text style={styles.cellLabel}>Operador</Text>
          <Text
            style={[styles.conductorValue, active ? styles.conductorValueOn : null]}
            numberOfLines={1}
          >
            {selected ?? "Todos"}
          </Text>
        </Pressable>
        {active ? (
          <Pressable onPress={() => onChange(null)} hitSlop={6} style={styles.clearHit}>
            <Text style={styles.clearGlyph}>×</Text>
          </Pressable>
        ) : null}
      </View>

      <SearchableOptionSheet
        visible={open}
        title="Operador"
        options={options.map((item) => ({ value: item.id, label: item.nombre }))}
        value={value}
        allLabel="Todos los operadores"
        placeholder="Buscar operador…"
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 10,
    marginTop: 8,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  meta: {
    flex: 1,
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  clear: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: theme.colors.cream,
  },
  clearText: { color: theme.colors.accent, fontSize: 11, fontWeight: "800" },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
    minHeight: 46,
  },
  divider: { width: 1, backgroundColor: theme.colors.line },
  cell: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 2,
  },
  cellOn: { backgroundColor: theme.colors.accentSoft },
  cellLabel: {
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
  conductorCell: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  conductorMain: { flex: 1, minWidth: 0, gap: 2 },
  conductorValue: { color: theme.colors.muted, fontSize: 11, fontWeight: "700" },
  conductorValueOn: { color: theme.colors.accent },
  clearHit: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  clearGlyph: { color: theme.colors.muted, fontSize: 16, fontWeight: "700", lineHeight: 18 },
});
