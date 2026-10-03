import { horaLima, velLabel } from "@/features/trazos/lib/format";
import type { GpsPunto, TrazoCapa, TrazoEvento, TrazoKpis } from "@/features/trazos/types";
import { TrazosKpis } from "@/features/trazos/components/trazos-kpis";
import { theme } from "@/lib/theme";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type TrazosTimelineProps = {
  kpis: TrazoKpis;
  eventos: TrazoEvento[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  cursorPunto: GpsPunto | null;
  cursor: number;
  onCursor: (value: number) => void;
  verTodos?: boolean;
  capas?: TrazoCapa[];
  onOperador?: (id: string) => void;
};

export function TrazosTimeline({
  kpis,
  eventos,
  selectedId,
  onSelect,
  cursorPunto,
  cursor,
  onCursor,
  verTodos,
  capas = [],
  onOperador,
}: TrazosTimelineProps) {
  return (
    <View style={styles.wrap}>
      <TrazosKpis kpis={kpis} />
      {verTodos ? (
        <Text style={styles.playLbl}>Operadores del día</Text>
      ) : (
        <>
          <View style={styles.play}>
            <Text style={styles.playLbl}>Recorrido del día</Text>
            <Text style={styles.playMeta} numberOfLines={1}>
              {cursorPunto ? `${horaLima(cursorPunto.at)} · ${velLabel(cursorPunto.kmh)}` : "—"}
            </Text>
          </View>
          <View style={styles.sliderRow}>
            {Array.from({ length: 24 }, (_, i) => i / 23).map((step) => (
              <Pressable
                key={step}
                onPress={() => onCursor(step)}
                style={[styles.tick, cursor >= step - 0.02 ? styles.tickOn : null]}
              />
            ))}
          </View>
        </>
      )}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {verTodos ? (
          capas.length === 0 ? (
            <Text style={styles.empty}>Nadie tiene GPS este día.</Text>
          ) : (
            capas.map((capa) => (
              <Pressable
                key={capa.id}
                onPress={() => onOperador?.(capa.id)}
                style={styles.row}
              >
                <View style={[styles.dot, { backgroundColor: capa.color }]} />
                <View style={styles.body}>
                  <Text style={styles.title} numberOfLines={1}>
                    {capa.nombre}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {capa.trazo.kpis.km.toFixed(capa.trazo.kpis.km < 10 ? 1 : 0)} km · {capa.trazo.kpis.puntos} pts
                  </Text>
                </View>
              </Pressable>
            ))
          )
        ) : eventos.length === 0 ? (
          <Text style={styles.empty}>Sin paradas ni visitas registradas.</Text>
        ) : (
          eventos.map((item) => {
            const on = selectedId === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => onSelect(item.id)}
                style={[styles.row, on ? styles.rowOn : null]}
              >
                <View style={[styles.dot, item.kind === "local" ? styles.dotLocal : styles.dotStop]} />
                <View style={styles.body}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.titulo}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {item.detalle}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderColor: theme.colors.line,
    paddingHorizontal: 10,
    paddingTop: 8,
    maxHeight: 210,
    gap: 6,
  },
  play: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  playLbl: { color: theme.colors.ink, fontSize: 12, fontWeight: "800" },
  playMeta: { color: theme.colors.muted, fontSize: 11, fontWeight: "700" },
  sliderRow: { flexDirection: "row", gap: 3 },
  tick: { flex: 1, height: 6, borderRadius: 6, backgroundColor: theme.colors.line },
  tickOn: { backgroundColor: theme.colors.accent },
  list: { maxHeight: 108 },
  empty: { color: theme.colors.muted, fontSize: 12, paddingVertical: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  rowOn: { backgroundColor: theme.colors.cream, marginHorizontal: -6, paddingHorizontal: 6, borderRadius: 8 },
  dot: { width: 7, height: 7, borderRadius: 7 },
  dotLocal: { backgroundColor: theme.colors.accent },
  dotStop: { backgroundColor: theme.colors.warn },
  body: { flex: 1, minWidth: 0 },
  title: { color: theme.colors.ink, fontSize: 12, fontWeight: "800" },
  sub: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
});
