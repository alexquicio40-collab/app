import type { ModuleKey } from "@/features/dashboard/types";
import { theme } from "@/lib/theme";
import { StyleSheet, View } from "react-native";

export const MODULE_TONES: Record<
  ModuleKey,
  { bg: string; fg: string; kind: "pin" | "list" | "box" | "sheet" | "coin" | "dot" | "bars" }
> = {
  mapa: { bg: theme.colors.accentSoft, fg: theme.colors.accent, kind: "pin" },
  rutas: { bg: theme.colors.infoSoft, fg: theme.colors.info, kind: "list" },
  hoja_ruta: { bg: theme.colors.goldSoft, fg: theme.colors.gold, kind: "sheet" },
  rutas_mapa: { bg: theme.colors.accentSoft, fg: theme.colors.accent, kind: "pin" },
  locales: { bg: "#F4E9C4", fg: theme.colors.gold, kind: "box" },
  asignar_rutas: { bg: theme.colors.infoSoft, fg: theme.colors.info, kind: "list" },
  certificados: { bg: theme.colors.warnSoft, fg: theme.colors.warn, kind: "sheet" },
  pagos: { bg: "#F4E9C4", fg: theme.colors.gold, kind: "coin" },
  usuarios: { bg: theme.colors.accentSoft, fg: theme.colors.accent, kind: "dot" },
  sesiones: { bg: theme.colors.warnSoft, fg: theme.colors.warn, kind: "coin" },
  operadores: { bg: theme.colors.accentSoft, fg: theme.colors.accent, kind: "pin" },
  planta: { bg: theme.colors.accentSoft, fg: theme.colors.accent, kind: "box" },
  historial: { bg: theme.colors.infoSoft, fg: theme.colors.info, kind: "bars" },
  estadisticas: { bg: "#F4E9C4", fg: theme.colors.gold, kind: "bars" },
  reportes: { bg: theme.colors.warnSoft, fg: theme.colors.warn, kind: "sheet" },
};

export function ModuleMark({ moduleKey }: { moduleKey: ModuleKey }) {
  const tone = MODULE_TONES[moduleKey];

  return (
    <View style={[styles.tile, { backgroundColor: tone.bg }]}>
      {tone.kind === "pin" ? <View style={[styles.pin, { borderColor: tone.fg }]} /> : null}
      {tone.kind === "list" ? (
        <View style={styles.stack}>
          <View style={[styles.line, { backgroundColor: tone.fg, width: 16 }]} />
          <View style={[styles.line, { backgroundColor: tone.fg, width: 11 }]} />
          <View style={[styles.line, { backgroundColor: tone.fg, width: 16 }]} />
        </View>
      ) : null}
      {tone.kind === "box" ? <View style={[styles.block, { borderColor: tone.fg }]} /> : null}
      {tone.kind === "sheet" ? (
        <View style={[styles.sheet, { borderColor: tone.fg }]}>
          <View style={[styles.line, { backgroundColor: tone.fg, width: 8 }]} />
        </View>
      ) : null}
      {tone.kind === "coin" ? <View style={[styles.coin, { borderColor: tone.fg }]} /> : null}
      {tone.kind === "dot" ? <View style={[styles.dot, { backgroundColor: tone.fg }]} /> : null}
      {tone.kind === "bars" ? (
        <View style={styles.bars}>
          <View style={[styles.bar, { height: 6, backgroundColor: tone.fg }]} />
          <View style={[styles.bar, { height: 11, backgroundColor: tone.fg }]} />
          <View style={[styles.bar, { height: 8, backgroundColor: tone.fg }]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pin: {
    width: 14,
    height: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
  stack: {
    gap: 3,
    alignItems: "flex-start",
  },
  line: {
    height: 2,
    borderRadius: 2,
  },
  block: {
    width: 14,
    height: 12,
    borderRadius: 3,
    borderWidth: 2,
  },
  sheet: {
    width: 13,
    height: 16,
    borderRadius: 3,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  coin: {
    width: 15,
    height: 15,
    borderRadius: 15,
    borderWidth: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 10,
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    height: 12,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});
