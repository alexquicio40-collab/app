import { formatPct, formatQty } from "@/features/reportes-kpi/lib/format";
import type { RutasConteo } from "@/features/reportes-kpi/types";
import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

type ReportRutasSectionProps = {
  rutas: RutasConteo;
};

export function ReportRutasSection({ rutas }: ReportRutasSectionProps) {
  const enRuta = rutas.enProceso + rutas.enRuta;
  const tone =
    rutas.cumplimientoPct >= 80 ? "good" : rutas.cumplimientoPct >= 50 ? "mid" : "bad";
  const barColor =
    tone === "good"
      ? theme.colors.accent
      : tone === "mid"
        ? theme.colors.warn
        : theme.colors.danger;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Resumen de rutas</Text>

      <View style={styles.grid}>
        <Stat label="Total" value={formatQty(rutas.total)} tone="ink" edge="tr" />
        <Stat label="Completadas" value={formatQty(rutas.completada)} tone="accent" edge="tr" />
        <Stat label="Pendientes" value={formatQty(rutas.pendiente)} tone="warn" edge="t" />
        <Stat label="En ruta" value={formatQty(enRuta)} tone="info" edge="r" />
        <Stat label="Canceladas" value={formatQty(rutas.cancelada)} tone="danger" edge="r" />
        <Stat label="Cumplim." value={formatPct(rutas.cumplimientoPct)} tone="gold" edge="none" />
      </View>

      <View style={styles.cumplimiento}>
        <View style={styles.cumplimientoHead}>
          <Text style={styles.cumplimientoTitle}>Cumplimiento</Text>
          <Text style={[styles.cumplimientoPct, { color: barColor }]}>
            {formatPct(rutas.cumplimientoPct)}
          </Text>
        </View>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.min(100, Math.max(0, rutas.cumplimientoPct))}%`,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
        <Text style={styles.hint}>Completadas vs. asignadas (sin contar canceladas)</Text>
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  tone,
  edge,
}: {
  label: string;
  value: string;
  tone: "ink" | "accent" | "warn" | "info" | "danger" | "gold";
  edge: "tr" | "t" | "r" | "none";
}) {
  const color =
    tone === "accent"
      ? theme.colors.accent
      : tone === "warn"
        ? theme.colors.warn
        : tone === "info"
          ? theme.colors.info
          : tone === "danger"
            ? theme.colors.danger
            : tone === "gold"
              ? theme.colors.gold
              : theme.colors.ink;

  return (
    <View
      style={[
        styles.cell,
        edge === "tr" || edge === "t" ? styles.borderBottom : null,
        edge === "tr" || edge === "r" ? styles.borderRight : null,
      ]}
    >
      <Text style={[styles.value, { color }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "33.333%",
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 2,
    alignItems: "flex-start",
  },
  borderRight: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: theme.colors.line,
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  value: { fontSize: 15, fontWeight: "900" },
  label: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  cumplimiento: {
    gap: 6,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
  },
  cumplimientoHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cumplimientoTitle: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "800",
  },
  cumplimientoPct: {
    fontSize: 14,
    fontWeight: "900",
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.cream,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  hint: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "600",
  },
});
