import { isOnRoute, timeAgo } from "@/features/map/hooks";
import type { LiveOperator } from "@/features/map/types";
import { theme } from "@/lib/theme";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type OperadoresRailProps = {
  operators: LiveOperator[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onOpenDetail: (operator: LiveOperator) => void;
};

export function OperadoresRail({
  operators,
  selectedId,
  onSelect,
  onOpenDetail,
}: OperadoresRailProps) {
  if (!operators.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Sin operadores en línea</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {operators.map((item) => {
        const on = isOnRoute(item);
        const selected = selectedId === item.id;
        const initial = item.name.trim().charAt(0).toUpperCase() || "O";
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            onLongPress={() => onOpenDetail(item)}
            delayLongPress={280}
            style={[styles.card, selected ? styles.cardOn : null, on ? styles.cardRoute : null]}
          >
            <View style={styles.top}>
              <View style={[styles.avatar, on ? styles.avatarRoute : null]}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={[styles.pill, on ? styles.pillRoute : styles.pillLive]}>
                <Text style={[styles.pillText, on ? styles.pillTextRoute : null]}>
                  {on ? "En ruta" : "En línea"}
                </Text>
              </View>
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.meta}>
              {Math.round(item.speed)} km/h · {timeAgo(item.timestamp)}
            </Text>
            <Text style={styles.hint}>Mantén para detalle</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 12 },
  empty: {
    marginHorizontal: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1.5,
    borderColor: theme.colors.line,
  },
  emptyText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700", textAlign: "center" },
  card: {
    width: 156,
    borderRadius: 16,
    padding: 10,
    gap: 4,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
  },
  cardOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  cardRoute: {
    borderColor: theme.colors.gold,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.cream,
  },
  avatarRoute: { backgroundColor: theme.colors.goldSoft },
  avatarText: { color: theme.colors.accent, fontSize: 13, fontWeight: "900" },
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillLive: { backgroundColor: theme.colors.accentSoft },
  pillRoute: { backgroundColor: theme.colors.goldSoft },
  pillText: { color: theme.colors.accent, fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  pillTextRoute: { color: theme.colors.gold },
  name: { color: theme.colors.ink, fontSize: 14, fontWeight: "900" },
  meta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  hint: { color: theme.colors.muted, fontSize: 9, fontWeight: "700", marginTop: 2 },
});
