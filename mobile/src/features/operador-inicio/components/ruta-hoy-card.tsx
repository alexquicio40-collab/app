import { DashIcon, type IconName } from "@/features/operador-inicio/components/dash-icon";
import { litros } from "@/features/operador-inicio/lib/format";
import { cardShadow, dash } from "@/features/operador-inicio/palette";
import type { OperadorInicio } from "@/features/operador-inicio/types";
import { Pressable, StyleSheet, Text, View } from "react-native";

type RutaHoyCardProps = {
  data: OperadorInicio;
  onOpenRuta: () => void;
  onAccion: () => void;
};

export function RutaHoyCard({ data, onOpenRuta, onAccion }: RutaHoyCardProps) {
  const enabled = data.accion !== "ninguna";

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.kickerRow}>
          <DashIcon name="book" color={dash.ink} size={16} />
          <Text style={styles.kicker}>Ruta de hoy</Text>
        </View>
        <View style={styles.dateChip}>
          <DashIcon name="calendar" color={dash.muted} size={14} />
          <Text style={styles.date}>{data.fecha}</Text>
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={onOpenRuta} style={styles.titleRow}>
        <Text style={styles.title}>{data.titulo}</Text>
        <View style={[styles.pill, pillTone(data.estado)]}>
          <Text style={[styles.pillText, pillTextTone(data.estado)]}>{data.estadoLabel}</Text>
        </View>
        <View style={styles.chevron}>
          <DashIcon name="chevron" color="#9AA8A2" size={18} />
        </View>
      </Pressable>

      <View style={styles.stats}>
        <Stat icon="house" tint={dash.green} value={String(data.locales)} label="Locales" />
        <Stat icon="drop" tint={dash.blue} value={litros(data.litros)} label="Recolectado" />
        <Stat icon="route" tint={dash.green} value={`${data.atendidos}/${data.locales}`} label="Atendidos" />
        <Stat icon="clock" tint={dash.orange} value={`${data.avance}%`} label="Avance" />
      </View>

      <View style={styles.split}>
        <Pressable accessibilityRole="button" onPress={onOpenRuta} style={styles.truck}>
          <DashIcon name="truck" color={dash.green} size={28} />
          <View style={styles.truckText}>
            <Text style={styles.meta}>Camión</Text>
            <View style={styles.plateRow}>
              <Text style={styles.strong} numberOfLines={1}>
                {data.placa || "Sin placa"}
              </Text>
              <DashIcon name="chevron" color="#9AA8A2" size={14} />
            </View>
          </View>
        </Pressable>
        <View style={styles.carga}>
          <View style={styles.cargaHead}>
            <DashIcon name="barrel" color={dash.muted} size={18} />
            <Text style={styles.meta}>Carga del día</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${data.avance}%` }]} />
          </View>
          <View style={styles.cargaFoot}>
            <Text style={styles.cargaText} numberOfLines={1}>
              {data.cargaTexto}
            </Text>
            <Text style={styles.pct}>{data.avance}%</Text>
          </View>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !enabled }}
        disabled={!enabled}
        onPress={onAccion}
        style={[styles.cta, enabled ? null : styles.ctaOff]}
      >
        <View style={styles.play}>
          <DashIcon name="play" color="#FFFFFF" size={14} />
        </View>
        <View style={styles.ctaText}>
          <Text style={styles.ctaTitle}>{data.accionTitulo}</Text>
          <Text style={styles.ctaSub} numberOfLines={1}>
            {data.accionDetalle}
          </Text>
        </View>
        <DashIcon name="chevron" color="#FFFFFF" size={18} />
      </Pressable>
    </View>
  );
}

function Stat({ icon, tint, value, label }: { icon: IconName; tint: string; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <DashIcon name={icon} color={tint} size={22} />
      <View style={styles.statText}>
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function pillTone(estado: OperadorInicio["estado"]) {
  if (estado === "completada") return { backgroundColor: dash.greenSoft };
  if (estado === "programada") return { backgroundColor: dash.orangeSoft };
  if (estado === "sin_ruta") return { backgroundColor: "#EEF2F0" };
  return { backgroundColor: dash.greenSoft };
}

function pillTextTone(estado: OperadorInicio["estado"]) {
  if (estado === "programada") return { color: dash.orange };
  if (estado === "sin_ruta") return { color: dash.muted };
  return { color: dash.greenDeep };
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dash.card,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: dash.line,
    ...cardShadow,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  kicker: {
    color: dash.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 1,
  },
  date: {
    color: dash.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: dash.ink,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  chevron: {
    marginLeft: "auto",
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  stats: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: dash.line,
  },
  stat: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    color: dash.muted,
    fontSize: 10,
    fontWeight: "600",
  },
  statValue: {
    color: dash.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  split: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: dash.line,
  },
  truck: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "36%",
  },
  truckText: {
    flex: 1,
    gap: 0,
  },
  plateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  meta: {
    color: dash.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  strong: {
    color: dash.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  carga: {
    flex: 1,
    gap: 4,
  },
  cargaHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cargaFoot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  pct: {
    color: dash.green,
    fontSize: 12,
    fontWeight: "800",
  },
  track: {
    height: 8,
    borderRadius: 99,
    backgroundColor: "#E7F3EC",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: dash.green,
  },
  cargaText: {
    color: dash.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  cta: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: dash.green,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ctaOff: {
    backgroundColor: "#9BB5A8",
  },
  play: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    flex: 1,
    gap: 1,
  },
  ctaTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  ctaSub: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    fontWeight: "600",
  },
});
