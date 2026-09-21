import { formatFechaEs } from "@/features/rutas-mapa/lib/format";
import { theme } from "@/lib/theme";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type FechaBarProps = {
  fecha: string;
  onChange: (date: Date) => void;
};

function parseFecha(fecha: string) {
  const d = new Date(`${fecha}T12:00:00`);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function FechaBar({ fecha, onChange }: FechaBarProps) {
  const [open, setOpen] = useState(false);

  const onPick = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setOpen(false);
    if (event.type === "dismissed" || !date) return;
    onChange(date);
  };

  return (
    <View style={styles.bar}>
      <Text style={styles.icon}>◷</Text>
      <Text style={styles.label} numberOfLines={1}>
        {formatFechaEs(fecha)}
      </Text>

      {Platform.OS === "web" ? (
        <TextInput
          value={fecha}
          onChangeText={(value) => {
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) onChange(parseFecha(value));
          }}
          placeholder="YYYY-MM-DD"
          style={styles.webInput}
        />
      ) : (
        <Pressable onPress={() => setOpen(true)} style={styles.btn}>
          <Text style={styles.btnText}>Cambiar</Text>
        </Pressable>
      )}

      {open && Platform.OS !== "web" ? (
        <DateTimePicker
          value={parseFecha(fecha)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onPick}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
    flexWrap: "wrap",
  },
  icon: { color: theme.colors.muted, fontSize: 14, fontWeight: "700" },
  label: {
    flex: 1,
    minWidth: 120,
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.accentSoft,
  },
  btnText: { color: theme.colors.accent, fontSize: 12, fontWeight: "800" },
  webInput: {
    minWidth: 130,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: theme.colors.ink,
    backgroundColor: theme.colors.cream,
    fontSize: 12,
    fontWeight: "700",
  },
});
