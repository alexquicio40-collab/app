import { formatFechaEs } from "@/features/rutas-mapa/lib/format";
import type { HistorialResumen } from "@/features/trazos/types";
import { theme } from "@/lib/theme";
import { SearchableOptionSheet } from "@/ui/searchable-option-sheet";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type TrazosBarProps = {
  fecha: string;
  onFecha: (date: Date) => void;
  puedeElegir: boolean;
  operador: string | null;
  operadores: { id: string; nombre: string }[];
  resumenes: HistorialResumen[];
  selectedId: string | null;
  onOperador: (id: string | null) => void;
};

function parseFecha(fecha: string) {
  const d = new Date(`${fecha}T12:00:00`);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function shift(fecha: string, days: number) {
  const next = parseFecha(fecha);
  next.setDate(next.getDate() + days);
  return next;
}

export function TrazosBar({
  fecha,
  onFecha,
  puedeElegir,
  operador,
  operadores,
  resumenes,
  selectedId,
  onOperador,
}: TrazosBarProps) {
  const [openDate, setOpenDate] = useState(false);
  const [openOps, setOpenOps] = useState(false);
  const pts = new Map(resumenes.map((item) => [item.usuarioId, item.puntos]));

  const onPick = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setOpenDate(false);
    if (event.type === "dismissed" || !date) return;
    onFecha(date);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.fecha}>
          <Text style={styles.kicker}>Fecha</Text>
          <View style={styles.fechaRow}>
            <Pressable onPress={() => onFecha(shift(fecha, -1))} hitSlop={8} style={styles.nav}>
              <Text style={styles.navTxt}>‹</Text>
            </Pressable>
            {Platform.OS === "web" ? (
              <View style={styles.dateHit}>
                <Text style={styles.value} numberOfLines={1}>
                  {formatFechaEs(fecha)}
                </Text>
                <input
                  type="date"
                  value={fecha}
                  onChange={(event) => {
                    if (event.target.value) onFecha(parseFecha(event.target.value));
                  }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    cursor: "pointer",
                    border: "none",
                  }}
                />
              </View>
            ) : (
              <Pressable onPress={() => setOpenDate(true)} style={styles.dateHit}>
                <Text style={styles.value} numberOfLines={1}>
                  {formatFechaEs(fecha)}
                </Text>
              </Pressable>
            )}
            <Pressable onPress={() => onFecha(shift(fecha, 1))} hitSlop={8} style={styles.nav}>
              <Text style={styles.navTxt}>›</Text>
            </Pressable>
          </View>
        </View>

        {puedeElegir ? (
          <>
            <View style={styles.div} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Elegir operador"
              onPress={() => setOpenOps(true)}
              style={styles.op}
            >
              <Text style={styles.kicker}>Operador</Text>
              <View style={styles.opRow}>
                <Text style={styles.value} numberOfLines={1}>
                  {selectedId ? operador || "Elegir…" : "Todos"}
                </Text>
                <Text style={styles.chev}>▾</Text>
              </View>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.div} />
            <View style={styles.op}>
              <Text style={styles.kicker}>Operador</Text>
              <Text style={styles.value} numberOfLines={1}>
                {operador || "—"}
              </Text>
            </View>
          </>
        )}
      </View>

      <SearchableOptionSheet
        visible={openOps}
        title="Operador"
        allLabel="Todos los operadores"
        placeholder="Buscar operador…"
        value={selectedId}
        options={operadores.map((item) => ({
          value: item.id,
          label: pts.has(item.id) ? `${item.nombre} · ${pts.get(item.id)} pts` : item.nombre,
        }))}
        onSelect={onOperador}
        onClose={() => setOpenOps(false)}
      />

      {openDate && Platform.OS !== "web" ? (
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
  wrap: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6 },
  fecha: { flex: 1.15, minWidth: 0, gap: 1 },
  fechaRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  nav: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  navTxt: { color: theme.colors.accent, fontSize: 20, fontWeight: "700", lineHeight: 22 },
  dateHit: { flex: 1, minWidth: 0, position: "relative", justifyContent: "center" },
  op: { flex: 1, minWidth: 0, gap: 1 },
  opRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  kicker: { color: theme.colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.2 },
  value: { color: theme.colors.ink, fontSize: 13, fontWeight: "800" },
  chev: { color: theme.colors.muted, fontSize: 11, fontWeight: "800" },
  div: { width: 1, height: 28, backgroundColor: theme.colors.line, marginHorizontal: 8 },
});
