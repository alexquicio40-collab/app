import {
  CERT_FILTER_OPTIONS,
  FREQ_FILTER_OPTIONS,
} from "@/features/locales/lib/format";
import type { LocalesFilters } from "@/features/locales/types";
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

type LocalesToolbarProps = {
  filters: LocalesFilters;
  distritos: string[];
  onChange: (patch: Partial<LocalesFilters>) => void;
  onClear?: () => void;
  hasFilters?: boolean;
};

/** Buscador + filtros en acordeón (cerrado por defecto). */
export function LocalesToolbar({
  filters,
  distritos,
  onChange,
  onClear,
  hasFilters = false,
}: LocalesToolbarProps) {
  const [open, setOpen] = useState(false);
  const hasSearch = Boolean(filters.search.trim());
  const activeCount = [
    filters.search.trim(),
    filters.distrito,
    filters.certificacion,
    filters.frecuencia,
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
                ? `${activeCount} activo${activeCount > 1 ? "s" : ""}`
                : "Buscar y filtrar"}
            </Text>
          </View>
        </Pressable>
        {hasFilters && onClear ? (
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
              placeholder="Buscar local, dirección, RUC…"
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

          <View style={styles.filtersBar}>
            <FilterSelect
              label="Distrito"
              value={filters.distrito}
              options={distritos.map((item) => ({ value: item, label: item }))}
              onChange={(distrito) => onChange({ distrito })}
            />
            <View style={styles.divider} />
            <FilterSelect
              label="Certificación"
              value={filters.certificacion}
              options={CERT_FILTER_OPTIONS.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
              onChange={(certificacion) => onChange({ certificacion })}
            />
            <View style={styles.divider} />
            <FilterSelect
              label="Frecuencia"
              value={filters.frecuencia}
              options={FREQ_FILTER_OPTIONS.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
              onChange={(frecuencia) => onChange({ frecuencia })}
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
  const [open, setOpen] = useState(false);
  const selected = options.find((item) => item.value === value)?.label;
  const active = Boolean(value);

  return (
    <>
      <View style={[styles.chip, active ? styles.chipOn : null]}>
        <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={styles.chipMain}>
          <Text style={[styles.chipText, active ? styles.chipTextOn : null]} numberOfLines={1}>
            {selected ?? label}
          </Text>
        </Pressable>
        {active ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Limpiar ${label}`}
            onPress={() => onChange(null)}
            hitSlop={6}
            style={styles.chipClear}
          >
            <Text style={styles.clearGlyph}>×</Text>
          </Pressable>
        ) : null}
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={styles.sheetList}>
              <Option
                label="Todos"
                active={!value}
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
              />
              {options.map((item) => (
                <Option
                  key={item.value}
                  label={item.label}
                  active={value === item.value}
                  onPress={() => {
                    onChange(item.value);
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
  filtersBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 2,
  },
  divider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: theme.colors.line,
    marginVertical: 4,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    minHeight: 28,
    paddingHorizontal: 4,
  },
  chipOn: {
    backgroundColor: theme.colors.accentSoft,
  },
  chipMain: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  chipText: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  chipTextOn: {
    color: theme.colors.accent,
  },
  chipClear: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
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
