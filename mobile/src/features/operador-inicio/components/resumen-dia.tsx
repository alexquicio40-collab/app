import { DashIcon, type IconName } from "@/features/operador-inicio/components/dash-icon";
import { litros, soles } from "@/features/operador-inicio/lib/format";
import { cardShadow, dash } from "@/features/operador-inicio/palette";
import type { OperadorInicio } from "@/features/operador-inicio/types";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ResumenDiaProps = {
  data: OperadorInicio;
  onMapa: () => void;
  onLocales: () => void;
  onRecojo: () => void;
  onCaja: () => void;
};

export function ResumenDia({ data, onMapa, onLocales, onRecojo, onCaja }: ResumenDiaProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.kickerRow}>
          <DashIcon name="clipboard" color={dash.ink} size={16} />
          <Text style={styles.kicker}>Resumen del día</Text>
        </View>
        <Text style={styles.updated}>Actualizado: {data.actualizado}</Text>
      </View>

      <View style={styles.metrics}>
        <Metric value={litros(data.litros)} label="Recolectados" />
        <Metric value={String(data.atendidos)} label="Locales" />
        <Metric value={data.tiempo} label="Tiempo ruta" />
        <Metric value={soles(data.gastos)} label="Gastos hoy" />
      </View>

      <View style={styles.row}>
        <Acceso
          icon="map"
          tint={dash.green}
          soft={dash.greenSoft}
          title="Ver mapa"
          subtitle="Ruta completa"
          onPress={onMapa}
        />
        <Acceso
          icon="list"
          tint={dash.blue}
          soft={dash.blueSoft}
          title="Lista de locales"
          subtitle={`${data.locales} locales`}
          onPress={onLocales}
        />
        <Acceso
          icon="camera"
          tint={dash.orange}
          soft={dash.orangeSoft}
          title="Registrar recojo"
          subtitle="Foto, litros y notas"
          onPress={onRecojo}
        />
        <Acceso
          icon="receipt"
          tint="#5C4BD6"
          soft="#EEEDFC"
          title="Caja del día"
          subtitle="Pagos y gastos"
          onPress={onCaja}
        />
      </View>
    </View>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </Text>
      <Text style={styles.metricLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {label}
      </Text>
    </View>
  );
}

function Acceso({
  icon,
  tint,
  soft,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  tint: string;
  soft: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.acceso, pressed ? styles.pressed : null]}
    >
      <View style={[styles.accesoIcon, { backgroundColor: soft }]}>
        <DashIcon name={icon} color={tint} size={18} />
      </View>
      <Text style={styles.accesoTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.accesoSub} numberOfLines={2}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 2,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  kicker: {
    color: dash.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  updated: {
    color: dash.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  metrics: {
    flexDirection: "row",
    gap: 8,
  },
  metric: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    backgroundColor: dash.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dash.line,
    paddingVertical: 8,
    paddingHorizontal: 3,
    minHeight: 52,
    ...cardShadow,
  },
  metricValue: {
    color: dash.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  metricLabel: {
    color: dash.muted,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 6,
  },
  acceso: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 2,
    backgroundColor: dash.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: dash.line,
    paddingHorizontal: 6,
    paddingVertical: 8,
    ...cardShadow,
  },
  pressed: {
    opacity: 0.86,
  },
  accesoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  accesoTitle: {
    color: dash.ink,
    fontSize: 12,
    lineHeight: 15,
    height: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  accesoSub: {
    color: dash.muted,
    fontSize: 10,
    lineHeight: 13,
    height: 26,
    fontWeight: "600",
    textAlign: "center",
  },
});
