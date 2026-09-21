import { StyleSheet, View } from "react-native";

type IconProps = { active?: boolean };

function tone(active?: boolean) {
  return active ? "#F3E6B8" : "#8AA89C";
}

export function HomeIcon({ active }: IconProps) {
  return (
    <View style={[styles.box, { borderColor: tone(active) }]}>
      <View style={[styles.roof, { backgroundColor: tone(active) }]} />
    </View>
  );
}

export function MapIcon({ active }: IconProps) {
  return (
    <View style={[styles.pin, { borderColor: tone(active) }]}>
      <View style={[styles.dot, { backgroundColor: tone(active) }]} />
    </View>
  );
}

/** Flota / operadores (distinto del pin de Mapa de campo). */
export function PeopleIcon({ active }: IconProps) {
  const color = tone(active);
  return (
    <View style={styles.people}>
      <View style={[styles.head, { borderColor: color }]} />
      <View style={[styles.body, { borderColor: color }]} />
    </View>
  );
}

export function RouteIcon({ active }: IconProps) {
  return (
    <View style={styles.route}>
      <View style={[styles.dash, { backgroundColor: tone(active) }]} />
      <View style={[styles.dash, styles.dashMid, { backgroundColor: tone(active) }]} />
      <View style={[styles.dash, { backgroundColor: tone(active) }]} />
    </View>
  );
}

export function GridIcon({ active }: IconProps) {
  const color = tone(active);
  return (
    <View style={styles.grid}>
      <View style={[styles.cell, { backgroundColor: color }]} />
      <View style={[styles.cell, { backgroundColor: color }]} />
      <View style={[styles.cell, { backgroundColor: color }]} />
      <View style={[styles.cell, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 16,
    height: 12,
    borderWidth: 1.6,
    borderRadius: 2,
    marginTop: 4,
  },
  roof: {
    position: "absolute",
    top: -5,
    left: -3,
    width: 20,
    height: 2,
    transform: [{ rotate: "0deg" }],
  },
  pin: {
    width: 14,
    height: 14,
    borderRadius: 14,
    borderWidth: 1.7,
    alignItems: "center",
    justifyContent: "center",
  },
  people: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  head: {
    width: 7,
    height: 7,
    borderRadius: 7,
    borderWidth: 1.6,
    marginBottom: 1,
  },
  body: {
    width: 12,
    height: 7,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.6,
    borderBottomWidth: 0,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 5,
  },
  route: {
    height: 16,
    width: 16,
    justifyContent: "space-between",
  },
  dash: {
    height: 2.4,
    borderRadius: 2,
    width: "100%",
  },
  dashMid: {
    width: "70%",
  },
  grid: {
    width: 16,
    height: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  cell: {
    width: 7,
    height: 7,
    borderRadius: 1.5,
  },
});
