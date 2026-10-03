import { limaDate } from "@/lib/api";
import { sumarDias } from "@/lib/fecha-lima";
import { theme } from "@/lib/theme";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { createElement } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

type MapaFechaBarProps = {
  desde: string;
  hasta: string;
  onChange: (desde: string, hasta: string) => void;
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

function label(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}`;
}

type Secuencia = {
  id: string;
  corto: string;
  label: string;
  desde: string;
  hasta: string;
};

function secuencias(today = limaDate()): Secuencia[] {
  const [year, month] = today.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, Number(today.slice(8)))).getUTCDay();
  const lunes = sumarDias(today, -((weekday + 6) % 7));
  const inicioMes = `${today.slice(0, 8)}01`;
  const finMes = `${today.slice(0, 8)}${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`;
  const previo = new Date(Date.UTC(year, month - 2, 1));
  const previoAnio = previo.getUTCFullYear();
  const previoMes = String(previo.getUTCMonth() + 1).padStart(2, "0");
  const finPrevio = String(new Date(Date.UTC(previoAnio, previo.getUTCMonth() + 1, 0)).getUTCDate()).padStart(2, "0");

  return [
    { id: "hoy", corto: "Hoy", label: "Hoy", desde: today, hasta: today },
    { id: "ayer", corto: "Ayer", label: "Ayer", desde: sumarDias(today, -1), hasta: sumarDias(today, -1) },
    { id: "semana", corto: "Semana", label: "Esta semana", desde: lunes, hasta: sumarDias(lunes, 6) },
    { id: "semana-pasada", corto: "Sem. ant.", label: "Semana pasada", desde: sumarDias(lunes, -7), hasta: sumarDias(lunes, -1) },
    { id: "mes", corto: "Mes", label: "Este mes", desde: inicioMes, hasta: finMes },
    {
      id: "mes-pasado",
      corto: "Mes ant.",
      label: "Mes pasado",
      desde: `${previoAnio}-${previoMes}-01`,
      hasta: `${previoAnio}-${previoMes}-${finPrevio}`,
    },
  ];
}

/** Filtro Desde–Hasta del mapa. En iOS abre el selector nativo. */
export function MapaFechaBar({ desde, hasta, onChange }: MapaFechaBarProps) {
  const [picking, setPicking] = useState<"desde" | "hasta" | null>(null);
  const [menu, setMenu] = useState(false);
  const opciones = secuencias();
  const activa = opciones.find((item) => item.desde === desde && item.hasta === hasta);

  const apply = (which: "desde" | "hasta", next: string) => {
    if (which === "desde") onChange(next, hasta);
    else onChange(desde, next);
  };

  const onPick = (event: DateTimePickerEvent, date?: Date) => {
    const which = picking;
    if (Platform.OS === "android") setPicking(null);
    if (!which || event.type === "dismissed" || !date) return;
    apply(which, toIso(date));
  };

  return (
    <View style={styles.bar}>
      {Platform.OS === "web" ? (
        <>
          <WebDay label="Desde" value={desde} onChange={(value) => apply("desde", value)} />
          <View style={styles.rule} />
          <WebDay label="Hasta" value={hasta} onChange={(value) => apply("hasta", value)} />
        </>
      ) : (
        <>
          <Day label="Desde" value={desde} onPress={() => setPicking("desde")} />
          <View style={styles.rule} />
          <Day label="Hasta" value={hasta} onPress={() => setPicking("hasta")} />
        </>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Elegir secuencia de fechas"
        onPress={() => setMenu(true)}
        style={styles.today}
      >
        <Text style={styles.todayText}>{activa?.corto ?? "Rango"}</Text>
      </Pressable>
      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenu(false)}>
          <Pressable style={styles.menu} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>Fecha</Text>
            {opciones.map((item) => {
              const on = item.id === activa?.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    onChange(item.desde, item.hasta);
                    setMenu(false);
                  }}
                  style={[styles.option, on ? styles.optionOn : null]}
                >
                  <Text style={[styles.optionText, on ? styles.optionTextOn : null]}>{item.label}</Text>
                  <Text style={styles.optionRange}>
                    {item.desde === item.hasta ? label(item.desde) : `${label(item.desde)} – ${label(item.hasta)}`}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
      {picking && Platform.OS === "android" ? (
        <DateTimePicker
          value={parseDay(picking === "desde" ? desde : hasta)}
          mode="date"
          display="default"
          onChange={onPick}
        />
      ) : null}
      {picking && Platform.OS === "ios" ? (
        <Modal transparent animationType="fade" onRequestClose={() => setPicking(null)}>
          <Pressable style={styles.backdrop} onPress={() => setPicking(null)}>
            <Pressable style={styles.sheet} onPress={() => undefined}>
              <Text style={styles.sheetTitle}>{picking === "desde" ? "Desde" : "Hasta"}</Text>
              <DateTimePicker
                value={parseDay(picking === "desde" ? desde : hasta)}
                mode="date"
                display="spinner"
                onChange={onPick}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

function Day({ label: title, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title} ${label(value)}`} onPress={onPress} style={styles.day}>
      <Text style={styles.caption}>{title}</Text>
      <Text style={styles.value}>{label(value)}</Text>
    </Pressable>
  );
}

function WebDay({
  label: title,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.day}>
      <Text style={styles.caption}>{title}</Text>
      {createElement("input", {
        type: "date",
        "aria-label": title,
        value,
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
          width: 112,
          height: 22,
          padding: 0,
          margin: 0,
        },
      })}
    </View>
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
  caption: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  value: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  rule: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: theme.colors.line,
  },
  today: {
    marginRight: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: theme.colors.accentSoft,
  },
  todayText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },
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
  menu: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 18,
    paddingHorizontal: 8,
  },
  option: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  optionOn: {
    backgroundColor: theme.colors.accentSoft,
  },
  optionText: {
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: "600",
  },
  optionTextOn: {
    color: theme.colors.accent,
    fontWeight: "700",
  },
  optionRange: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
});
