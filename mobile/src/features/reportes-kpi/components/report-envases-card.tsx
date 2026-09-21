import { formatQty } from "@/features/reportes-kpi/lib/format";
import type { EnvasesTotales } from "@/features/reportes-kpi/types";
import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

type ReportEnvasesCardProps = {
  total: EnvasesTotales;
  rutas: EnvasesTotales;
  planta: EnvasesTotales;
  showRutas: boolean;
  showPlanta: boolean;
};

export function ReportEnvasesCard({
  total,
  rutas,
  planta,
  showRutas,
  showPlanta,
}: ReportEnvasesCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Envases acumulados</Text>

      <View style={styles.hero}>
        <Metric label="Litraje" value={formatQty(total.litros)} tone="accent" />
        <Metric label="Baldes vacíos" value={formatQty(total.baldes)} tone="info" />
        <Metric label="Galoneras" value={formatQty(total.galoneras)} tone="gold" />
      </View>

      {showRutas || showPlanta ? (
        <View style={styles.breakdown}>
          {showRutas ? (
            <Breakdown
              title="Por rutas"
              litros={rutas.litros}
              baldes={rutas.baldes}
              galoneras={rutas.galoneras}
              tone="info"
            />
          ) : null}
          {showPlanta ? (
            <Breakdown
              title="Por planta"
              litros={planta.litros}
              baldes={planta.baldes}
              galoneras={planta.galoneras}
              tone="accent"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "accent" | "info" | "gold";
}) {
  const color =
    tone === "info" ? theme.colors.info : tone === "gold" ? theme.colors.gold : theme.colors.accent;

  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Breakdown({
  title,
  litros,
  baldes,
  galoneras,
  tone,
}: {
  title: string;
  litros: number;
  baldes: number;
  galoneras: number;
  tone: "info" | "accent";
}) {
  const bar = tone === "info" ? theme.colors.info : theme.colors.accent;
  return (
    <View style={styles.breakItem}>
      <View style={[styles.breakDot, { backgroundColor: bar }]} />
      <View style={styles.breakCopy}>
        <Text style={styles.breakTitle}>{title}</Text>
        <Text style={styles.breakMeta}>
          {formatQty(litros)} L · {formatQty(baldes)} baldes · {formatQty(galoneras)} gal.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    gap: 12,
  },
  title: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  hero: {
    flexDirection: "row",
    gap: 6,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 3,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.cream,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  metricLabel: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  breakdown: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 2,
  },
  breakItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  breakDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  breakCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  breakTitle: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "800",
  },
  breakMeta: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 14,
  },
});
