import type { RoutesCounts } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

type RoutesSummaryProps = {
  total: number;
  counts: RoutesCounts;
};

export function RoutesSummary({ total, counts }: RoutesSummaryProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.total}>{total} ruta{total === 1 ? "" : "s"}</Text>
      <View style={styles.chips}>
        <Count label="Prog" value={counts.programado} color={theme.colors.warn} bg={theme.colors.warnSoft} />
        <Count label="Ruta" value={counts.enCurso} color={theme.colors.info} bg={theme.colors.infoSoft} />
        <Count label="Rec" value={counts.recolectado} color={theme.colors.accent} bg={theme.colors.accentSoft} />
      </View>
    </View>
  );
}

function Count({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color }]}>
        {label} {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  total: {
    color: theme.colors.ink,
    fontSize: 11,
    fontWeight: "800",
  },
  chips: {
    flexDirection: "row",
    gap: 4,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 9,
    fontWeight: "700",
  },
});
