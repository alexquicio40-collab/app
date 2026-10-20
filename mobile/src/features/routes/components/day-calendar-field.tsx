import { limaDate } from "@/lib/api";
import { theme } from "@/lib/theme";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { createElement, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type DayCalendarFieldProps = {
  value: string;
  onChange: (iso: string) => void;
  /** Abre el calendario al montar (cambio de fecha / reprogramar). */
  autoOpen?: boolean;
};

function parseDay(iso: string) {
  const key = iso || limaDate();
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso || "Elegir fecha";
  return `${d}/${m}/${y}`;
}

export function DayCalendarField({ value, onChange, autoOpen = false }: DayCalendarFieldProps) {
  const [open, setOpen] = useState(false);
  const autoRef = useRef(false);
  const openedAt = useRef(0);

  useEffect(() => {
    if (!autoOpen || autoRef.current || Platform.OS === "web") return;
    autoRef.current = true;
    const id = setTimeout(() => {
      openedAt.current = Date.now();
      setOpen(true);
    }, 280);
    return () => clearTimeout(id);
  }, [autoOpen]);

  const show = () => {
    openedAt.current = Date.now();
    setOpen(true);
  };

  const onPick = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android" && Date.now() - openedAt.current < 400) return;
    if (event.type === "dismissed") {
      setOpen(false);
      return;
    }
    if (event.type !== "set" || !date) return;
    if (Platform.OS === "android") setOpen(false);
    onChange(toIso(date));
  };

  if (Platform.OS === "web") {
    return createElement("input", {
      type: "date",
      value: value || limaDate(),
      onChange: (e: { target: { value: string } }) => onChange(e.target.value),
      style: {
        height: 38,
        borderRadius: 9,
        border: `1.5px solid ${theme.colors.line}`,
        padding: "0 10px",
        fontWeight: 700,
        background: theme.colors.cream,
        color: theme.colors.ink,
      },
    });
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        onPress={show}
        style={styles.btn}
      >
        <Text style={styles.text}>{formatDisplay(value)}</Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={parseDay(value)}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "calendar"}
          onChange={onPick}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 38,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  text: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
});
