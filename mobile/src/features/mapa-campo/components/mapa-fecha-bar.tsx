import { limaDate } from "@/lib/api";
import { sumarDias } from "@/lib/fecha-lima";
import { theme } from "@/lib/theme";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { createElement } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

type MapaFechaBarProps = {
  fecha: string;
  onChange: (fecha: string) => void;
};

function parseDay(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function corto(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}`;
}

/** Un solo día: Hoy / Ayer / calendario. */
export function MapaFechaBar({ fecha, onChange }: MapaFechaBarProps) {
  const [open, setOpen] = useState(false);
  const today = limaDate();
  const yesterday = sumarDias(today, -1);

  const onPick = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setOpen(false);
    if (event.type === "dismissed" || !date) return;
    onChange(toIso(date));
  };

  return (
    <View style={styles.bar}>
      {Platform.OS === "web" ? (
        <View style={styles.day}>
          <Text style={styles.caption}>Fecha</Text>
          {createElement("input", {
            type: "date",
            "aria-label": "Fecha",
            value: fecha,
            onChange: (event: { target: { value: string } }) => {
              const next = event.target.value;
              if (/^\d{4}-\d{2}-\d{2}$/.test(next)) onChange(next);
            },
            style: {
              border: "none",
              background: "transparent",
              color: theme.colors.ink,
              fontSize: 13,
              fontWeight: "700",
              fontFamily: "inherit",
              width: 118,
              height: 22,
              padding: 0,
              margin: 0,
            },
          })}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Fecha ${corto(fecha)}`}
          onPress={() => setOpen(true)}
          style={styles.day}
        >
          <Text style={styles.caption}>Fecha</Text>
          <Text style={styles.value}>{corto(fecha)}</Text>
        </Pressable>
      )}

      <Chip label="Hoy" on={fecha === today} onPress={() => onChange(today)} />
      <Chip label="Ayer" on={fecha === yesterday} onPress={() => onChange(yesterday)} />

      {open && Platform.OS === "android" ? (
        <DateTimePicker value={parseDay(fecha)} mode="date" display="default" onChange={onPick} />
      ) : null}
      {open && Platform.OS === "ios" ? (
        <Modal transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => undefined}>
              <Text style={styles.sheetTitle}>Fecha</Text>
              <DateTimePicker value={parseDay(fecha)} mode="date" display="spinner" onChange={onPick} />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.chip, on ? styles.chipOn : null]}
    >
      <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginTop: 6,
    minHeight: 32,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.line,
    overflow: "hidden",
    paddingRight: 6,
  },
  day: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 0,
  },
  caption: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  value: { color: theme.colors.ink, fontSize: 13, fontWeight: "700" },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: theme.colors.cream,
  },
  chipOn: { backgroundColor: theme.colors.accentSoft },
  chipText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  chipTextOn: { color: theme.colors.accent },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  sheetTitle: {
    textAlign: "center",
    paddingTop: 14,
    paddingBottom: 6,
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
});
