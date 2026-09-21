import { isOnRoute, timeAgo } from "@/features/map/hooks";
import type { LiveOperator } from "@/features/map/types";
import { theme } from "@/lib/theme";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

type OperatorListProps = {
  operators: LiveOperator[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

export function OperatorList({ operators, selectedId, onSelect }: OperatorListProps) {
  if (operators.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {operators.map((item) => {
        const on = isOnRoute(item);
        const selected = selectedId === item.id;
        return (
          <Pressable key={item.id} onPress={() => onSelect(item.id)} style={[styles.card, selected ? styles.cardOn : null]}>
            <Text style={styles.status}>{on ? "En ruta" : "En línea"}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.meta}>
              {Math.round(item.speed)} km/h · {timeAgo(item.timestamp)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingHorizontal: 12,
  },
  card: {
    width: 148,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  cardOn: {
    backgroundColor: theme.colors.accentSoft,
  },
  status: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  name: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
});
