import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

export function LiveWidget({ online, operadores }: { online: number; operadores: number }) {
  const max = Math.max(operadores, 1);
  const pct = Math.round((online / max) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.ringWrap}>
        <View style={styles.glow} />
        <View style={styles.track} />
        <View style={[styles.arc, pct === 0 ? styles.arcOff : null]} />
        <View style={styles.hole}>
          <Text style={styles.value}>{online}</Text>
          <Text style={styles.unit}>en línea</Text>
        </View>
      </View>
      <View style={styles.side}>
        <Text style={styles.kicker}>Cobertura en vivo</Text>
        <Text style={styles.title}>Operadores en campo</Text>
        <View style={styles.meter}>
          <View style={[styles.fill, { width: `${Math.max(pct, 6)}%` }, pct === 0 ? styles.fillOff : null]} />
        </View>
        <Text style={styles.caption}>
          {online} conectados de {operadores} operadores
        </Text>
        <Text style={styles.pct}>{pct}% cobertura</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#083D30",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  ringWrap: {
    width: 108,
    height: 108,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: theme.colors.accentSoft,
  },
  track: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 11,
    borderColor: "#D7E8E1",
    backgroundColor: theme.colors.surface,
  },
  arc: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 11,
    borderTopColor: theme.colors.accent,
    borderRightColor: theme.colors.gold,
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
    transform: [{ rotate: "-18deg" }],
  },
  arcOff: {
    opacity: 0.22,
  },
  hole: {
    alignItems: "center",
  },
  value: {
    color: theme.colors.ink,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -1,
  },
  unit: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  side: {
    flex: 1,
    gap: 5,
  },
  kicker: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  meter: {
    height: 9,
    borderRadius: 9,
    backgroundColor: theme.colors.accentSoft,
    overflow: "hidden",
    marginTop: 6,
  },
  fill: {
    height: "100%",
    backgroundColor: theme.colors.accent,
    borderRadius: 9,
  },
  fillOff: {
    backgroundColor: "#B7CBC3",
  },
  caption: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  pct: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
});
