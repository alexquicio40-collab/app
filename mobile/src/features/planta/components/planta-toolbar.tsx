import type { AsesorOption, PlantaFilters } from "@/features/planta/types";
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

type PlantaToolbarProps = {
  filters: PlantaFilters;
  asesores: AsesorOption[];
  total: number;
  visible: number;
  hasFilters: boolean;
  onChange: (patch: Partial<PlantaFilters>) => void;
  onClear: () => void;
};

/** Buscador + filtros en acordeón (cerrado por defecto). */
export function PlantaToolbar({
  filters,
  asesores,
  total,
  visible,
  hasFilters,
  onChange,
  onClear,
}: PlantaToolbarProps) {
  const [open, setOpen] = useState(false);
  const hasSearch = Boolean(filters.search.trim());
  const activeCount = [
    filters.search.trim(),
    filters.asesor,
    filters.fechaDesde,
    filters.fechaHasta,
  ].filter(Boolean).length;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((value) => !value)}
          style={styles.headMain}
        >
          <View style={styles.headCopy}>
            <Text style={styles.headTitle}>Filtros</Text>
            <Text style={styles.headMeta}>
              {activeCount > 0
                ? `${activeCount} activo${activeCount > 1 ? "s" : ""} · ${visible} de ${total}`
                : `${visible} de ${total} registro${total === 1 ? "" : "s"}`}
            </Text>
          </View>
        </Pressable>
        {hasFilters ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpiar filtros"
            onPress={onClear}
            hitSlop={8}
            style={styles.clearAll}
          >
            <Text style={styles.clearAllText}>Limpiar</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? "Cerrar filtros" : "Abrir filtros"}
          onPress={() => setOpen((value) => !value)}
          style={styles.icon}
        >
          <Text style={styles.iconText}>{open ? "−" : "+"}</Text>
        </Pressable>
      </View>

      {open ? (
        <View style={styles.body}>
          <View style={styles.searchBox}>
            <TextInput
              value={filters.search}
              onChangeText={(search) => onChange({ search })}
              placeholder="Buscar proveedor o guía…"
              placeholderTextColor={theme.colors.muted}
              style={styles.search}
              autoCorrect={false}
            />
            {hasSearch ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpiar búsqueda"
                onPress={() => onChange({ search: "" })}
                hitSlop={8}
                style={styles.clearHit}
              >
                <Text style={styles.clearGlyph}>×</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.filtersRow}>
            <FilterSelect
              label="Asesor"
              value={filters.asesor}
              options={asesores.map((item) => ({ value: item.nombre, label: item.nombre }))}
              onChange={(asesor) => onChange({ asesor })}
            />
            <View style={styles.divider} />
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
          </View>
        </View>
      ) : null}
    </View>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (value: string | null) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const selected = options.find((item) => item.value === value)?.label;
  const active = Boolean(value);

  return (
    <>
      <View style={[styles.filterCell, active ? styles.filterCellOn : null]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setSheetOpen(true)}
          style={styles.filterMain}
        >
          <Text style={styles.filterLabel}>{label}</Text>
          <Text
            style={[styles.filterValue, active ? styles.filterValueOn : null]}
            numberOfLines={1}
          >
            {selected ?? "Todos"}
          </Text>
        </Pressable>
        {active ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Limpiar ${label}`}
            onPress={() => onChange(null)}
            hitSlop={6}
            style={styles.filterClear}
          >
            <Text style={styles.clearGlyph}>×</Text>
          </Pressable>
        ) : null}
      </View>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSheetOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheetOpen(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={styles.sheetList}>
              <Option
                label="Todos"
                active={!value}
                onPress={() => {
                  onChange(null);
                  setSheetOpen(false);
                }}
              />
              {options.map((item) => (
                <Option
                  key={item.value}
                  label={item.label}
                  active={value === item.value}
                  onPress={() => {
                    onChange(item.value);
                    setSheetOpen(false);
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
  headMain: {
    flex: 1,
    minWidth: 0,
  },
  headCopy: { gap: 1 },
  headTitle: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  headMeta: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  clearAll: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: theme.colors.cream,
  },
  clearAllText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "800",
  },
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
  clearHit: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
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
  divider: {
    width: 1,
    backgroundColor: theme.colors.line,
  },
  filterCell: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
  },
  filterCellOn: {
    backgroundColor: theme.colors.accentSoft,
  },
  filterMain: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  filterLabel: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  filterValue: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  filterValueOn: {
    color: theme.colors.accent,
  },
  filterClear: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dateInput: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    margin: 0,
    color: theme.colors.ink,
    fontSize: 11,
    fontWeight: "700",
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
