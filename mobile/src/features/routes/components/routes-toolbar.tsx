import { ESTADO_OPTIONS } from "@/features/routes/lib/format";
import type { ConductorOption, RoutesFilters } from "@/features/routes/types";
import { limaDate } from "@/lib/api";
import { theme } from "@/lib/theme";
import { SearchableOptionSheet } from "@/ui/searchable-option-sheet";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { createElement, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type RoutesToolbarProps = {
  filters: RoutesFilters;
  distritos: string[];
  conductores: ConductorOption[];
  onChange: (patch: Partial<RoutesFilters>) => void;
};

export function RoutesToolbar({ filters, distritos, conductores, onChange }: RoutesToolbarProps) {
  const hasSearch = Boolean(filters.search.trim());

  return (
    <View style={styles.wrap}>
      <View style={styles.searchBox}>
        <TextInput
          value={filters.search}
          onChangeText={(search) => onChange({ search })}
          placeholder="Buscar…"
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
          label="Operador"
          value={filters.conductorId}
          options={conductores.map((item) => ({ value: item.id, label: item.nombre }))}
          placeholder="Buscar operador…"
          onChange={(conductorId) => onChange({ conductorId })}
        />
        <View style={styles.divider} />
        <FilterSelect
          label="Estado"
          value={filters.estado}
          options={ESTADO_OPTIONS}
          onChange={(estado) => onChange({ estado })}
        />
        <View style={styles.divider} />
        <DateRangeChip
          desde={filters.fechaDesde}
          hasta={filters.fechaHasta}
          onChange={(fechaDesde, fechaHasta) => onChange({ fechaDesde, fechaHasta })}
        />
      </View>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  onClear,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  onClear?: () => void;
}) {
  return (
    <View style={[styles.chip, active ? styles.chipOn : null]}>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.chipMain}>
        <Text style={[styles.chipText, active ? styles.chipTextOn : null]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
      {active && onClear ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quitar filtro"
          onPress={onClear}
          hitSlop={4}
          style={styles.chipClear}
        >
          <Text style={styles.clearGlyph}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function FilterSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  placeholder?: string;
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => options.find((item) => item.value === value)?.label ?? null,
    [options, value],
  );

  return (
    <>
      <FilterChip
        label={selected ?? label}
        active={Boolean(value)}
        onPress={() => setOpen(true)}
        onClear={() => onChange(null)}
      />
      <SearchableOptionSheet
        visible={open}
        title={label}
        options={options}
        value={value}
        placeholder={placeholder}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function DateRangeChip({
  desde,
  hasta,
  onChange,
}: {
  desde: string | null;
  hasta: string | null;
  onChange: (desde: string | null, hasta: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftDesde, setDraftDesde] = useState(desde);
  const [draftHasta, setDraftHasta] = useState(hasta);
  const [picking, setPicking] = useState<"desde" | "hasta" | null>(null);

  const active = Boolean(desde || hasta);
  const label = formatRangeLabel(desde, hasta);

  const openSheet = () => {
    setDraftDesde(desde);
    setDraftHasta(hasta);
    setOpen(true);
  };

  const apply = () => {
    let nextDesde = draftDesde;
    let nextHasta = draftHasta;
    if (nextDesde && nextHasta && nextDesde > nextHasta) {
      [nextDesde, nextHasta] = [nextHasta, nextDesde];
    }
    onChange(nextDesde, nextHasta);
    setOpen(false);
  };

  const setToday = () => {
    const today = limaDate();
    setDraftDesde(today);
    setDraftHasta(today);
  };

  const onPick = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setPicking(null);
    if (event.type === "dismissed" || !date) return;
    const key = toIsoDay(date);
    if (picking === "desde") setDraftDesde(key);
    if (picking === "hasta") setDraftHasta(key);
  };

  return (
    <>
      <FilterChip
        label={label}
        active={active}
        onPress={openSheet}
        onClear={() => onChange(null, null)}
      />

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.rangeSheet}>
            <Text style={styles.sheetTitle}>Rango de fechas</Text>

            <View style={styles.rangeRow}>
              <DateField label="Desde" value={draftDesde} onPress={() => setPicking("desde")} />
              <DateField label="Hasta" value={draftHasta} onPress={() => setPicking("hasta")} />
            </View>

            {Platform.OS === "web" ? (
              <View style={styles.webDates}>
                <WebDateInput label="Desde" value={draftDesde} onChange={setDraftDesde} />
                <WebDateInput label="Hasta" value={draftHasta} onChange={setDraftHasta} />
              </View>
            ) : null}

            {picking && Platform.OS !== "web" ? (
              <DateTimePicker
                value={parseIsoDay(picking === "desde" ? draftDesde : draftHasta, limaDate())}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onPick}
              />
            ) : null}

            <View style={styles.rangeActions}>
              <Pressable onPress={setToday} style={styles.ghostBtn}>
                <Text style={styles.ghostText}>Hoy</Text>
              </Pressable>
              <Pressable onPress={apply} style={styles.applyBtn}>
                <Text style={styles.applyText}>Aplicar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function DateField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string | null;
  onPress: () => void;
}) {
  if (Platform.OS === "web") return null;
  return (
    <Pressable onPress={onPress} style={styles.dateField}>
      <Text style={styles.dateLabel}>{label}</Text>
      <Text style={styles.dateValue}>{value ? formatDayMonth(value) : "Elegir"}</Text>
    </Pressable>
  );
}

function WebDateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <View style={styles.webField}>
      <Text style={styles.dateLabel}>{label}</Text>
      {createElement("input", {
        type: "date",
        value: value ?? "",
        onChange: (e: { target: { value: string } }) => onChange(e.target.value || null),
        style: {
          height: 36,
          borderRadius: 8,
          border: `1.5px solid ${theme.colors.line}`,
          padding: "0 10px",
          fontWeight: 700,
          color: theme.colors.ink,
          background: theme.colors.cream,
        },
      })}
    </View>
  );
}

/** dd/mm */
function formatDayMonth(isoDay: string) {
  const parts = isoDay.split("-");
  if (parts.length < 3) return isoDay;
  return `${parts[2]}/${parts[1]}`;
}

/** Etiqueta compacta: Fecha | 19/09 | 19–25/09 | ≥19/09 | ≤25/09 */
function formatRangeLabel(desde: string | null, hasta: string | null) {
  if (!desde && !hasta) return "Fecha";
  if (desde && hasta && desde === hasta) return formatDayMonth(desde);
  if (desde && hasta) {
    const [, m1, d1] = desde.split("-");
    const [, m2, d2] = hasta.split("-");
    if (m1 && d1 && m2 && d2 && m1 === m2) return `${d1}–${d2}/${m1}`;
    return `${formatDayMonth(desde)}–${formatDayMonth(hasta)}`;
  }
  if (desde) return `≥${formatDayMonth(desde)}`;
  return `≤${formatDayMonth(hasta!)}`;
}

function toIsoDay(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseIsoDay(value: string | null, fallback: string) {
  const key = value || fallback;
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

const BAR_RADIUS = 9;
const BAR_BORDER = 1.5;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 4,
    gap: 4,
  },
  searchBox: {
    height: 32,
    borderRadius: 8,
    borderWidth: BAR_BORDER,
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
  clearHit: {
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
  filtersBar: {
    minHeight: 30,
    borderRadius: 8,
    borderWidth: BAR_BORDER,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surface,
    flexDirection: "row",
    alignItems: "stretch",
    overflow: "hidden",
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.accent,
    opacity: 0.35,
  },
  chip: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.cream,
  },
  chipOn: {
    backgroundColor: theme.colors.accentSoft,
  },
  chipMain: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 5,
    justifyContent: "center",
  },
  chipClear: {
    width: 20,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
  },
  chipTextOn: {
    color: theme.colors.accent,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  rangeSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 24,
    gap: 12,
  },
  sheetTitle: {
    paddingHorizontal: 12,
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  rangeRow: {
    flexDirection: "row",
    gap: 8,
  },
  dateField: {
    flex: 1,
    backgroundColor: theme.colors.cream,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  dateLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateValue: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  webDates: {
    flexDirection: "row",
    gap: 8,
  },
  webField: {
    flex: 1,
    gap: 4,
  },
  rangeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ghostBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostText: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  applyBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
