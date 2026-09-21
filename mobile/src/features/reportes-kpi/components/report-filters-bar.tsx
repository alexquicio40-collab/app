import type { ReportFilters } from "@/features/reportes-kpi/types";
import type { ConductorOption } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type ReportFiltersBarProps = {
  filters: ReportFilters;
  rangeLabel: string;
  conductores: ConductorOption[];
  onPatchDates: (patch: Partial<Pick<ReportFilters, "fechaDesde" | "fechaHasta">>) => void;
  onConductor: (id: string | null) => void;
};

export function ReportFiltersBar({
  filters,
  rangeLabel,
  conductores,
  onPatchDates,
  onConductor,
}: ReportFiltersBarProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.range}>
        <Text style={styles.rangeLabel}>Período</Text>
        <Text style={styles.rangeValue} numberOfLines={1}>
          {rangeLabel}
        </Text>
      </View>

      <View style={styles.row}>
        <DateField
          label="Desde"
          value={filters.fechaDesde}
          onChange={(fechaDesde) => onPatchDates({ fechaDesde })}
        />
        <View style={styles.divider} />
        <DateField
          label="Hasta"
          value={filters.fechaHasta}
          onChange={(fechaHasta) => onPatchDates({ fechaHasta })}
        />
        <View style={styles.divider} />
        <ConductorSelect
          value={filters.conductorId}
          options={conductores}
          onChange={onConductor}
        />
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
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
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
        <Pressable
          accessibilityRole="button"
          onPress={() => setOpen(true)}
          style={styles.conductorMain}
        >
          <Text style={styles.cellLabel}>Operador</Text>
          <Text
            style={[styles.conductorValue, active ? styles.conductorValueOn : null]}
            numberOfLines={1}
          >
            {selected ?? "Todos"}
          </Text>
        </Pressable>
        {active ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quitar operador"
            onPress={() => onChange(null)}
            hitSlop={6}
            style={styles.clear}
          >
            <Text style={styles.clearGlyph}>×</Text>
          </Pressable>
        ) : null}
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Operador</Text>
            <ScrollView style={styles.sheetList}>
              <Option
                label="Todos los operadores"
                active={!value}
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
              />
              {options.map((item) => (
                <Option
                  key={item.id}
                  label={item.nombre}
                  active={value === item.id}
                  onPress={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Option({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.option, active ? styles.optionOn : null]}>
      <Text style={[styles.optionText, active ? styles.optionTextOn : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 10,
    marginTop: 8,
    gap: 8,
  },
  range: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
  },
  rangeLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  rangeValue: {
    flex: 1,
    textAlign: "right",
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
    minHeight: 48,
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.line,
  },
  cell: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 2,
  },
  cellOn: {
    backgroundColor: theme.colors.accentSoft,
  },
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
    flex: 1.15,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  conductorMain: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  conductorValue: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  conductorValueOn: {
    color: theme.colors.accent,
  },
  clear: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  clearGlyph: {
    color: theme.colors.muted,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "70%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 8,
  },
  sheetTitle: {
    paddingHorizontal: 16,
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  sheetList: {
    paddingHorizontal: 8,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  optionOn: {
    backgroundColor: theme.colors.accentSoft,
  },
  optionText: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  optionTextOn: {
    color: theme.colors.accent,
    fontWeight: "800",
  },
});
