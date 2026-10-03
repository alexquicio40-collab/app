import { kmLabel, minsLabel, velLabel } from "@/features/trazos/lib/format";
import type { TrazoKpis } from "@/features/trazos/types";
import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

export function TrazosKpis({ kpis }: { kpis: TrazoKpis }) {
  return (
    <View style={styles.row}>
      <Cell val={kmLabel(kpis.km)} lbl="Recorrido" />
      <Cell val={minsLabel(kpis.duracionMin)} lbl="Tiempo" />
      <Cell val={minsLabel(kpis.paradoMin)} lbl="Parado" />
      <Cell val={velLabel(kpis.velProm)} lbl="Vel. prom" />
      <Cell val={`${kpis.visitados}/${kpis.locales || 0}`} lbl="Locales" />
    </View>
  );
}

function Cell({ val, lbl }: { val: string; lbl: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.val} numberOfLines={1}>
        {val}
      </Text>
      <Text style={styles.lbl}>{lbl}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", paddingHorizontal: 2 },
  cell: { flex: 1, minWidth: 0, alignItems: "center" },
  val: { color: theme.colors.ink, fontSize: 11, fontWeight: "800" },
  lbl: { color: theme.colors.muted, fontSize: 9, fontWeight: "700" },
});
