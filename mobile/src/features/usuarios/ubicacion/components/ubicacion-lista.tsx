import { rolLabel } from "@/features/usuarios/lib/roles";
import { theme } from "@/lib/theme";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { hace } from "../lib/format";
import type { UsuarioPunto } from "../types";

type Props = {
  puntos: UsuarioPunto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function UbicacionLista({ puntos, selectedId, onSelect }: Props) {
  if (!puntos.length) {
    return <Text style={styles.empty}>Nadie tiene ubicación reciente.</Text>;
  }

  return (
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
      {puntos.map((item) => {
        const on = selectedId === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={[styles.row, on ? styles.rowOn : null]}
          >
            <View style={[styles.dot, item.vivo ? styles.dotOn : null]} />
            <View style={styles.body}>
              <Text style={styles.name} numberOfLines={1}>
                {item.nombre}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {rolLabel(item.rol)} · {item.vivo ? "en vivo" : hace(item.at)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: 132 },
  empty: { color: theme.colors.muted, fontSize: 12, paddingVertical: 10, paddingHorizontal: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 2,
  },
  rowOn: {
    backgroundColor: theme.colors.accentSoft,
    marginHorizontal: -6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: theme.colors.muted },
  dotOn: { backgroundColor: theme.colors.accent },
  body: { flex: 1, minWidth: 0 },
  name: { color: theme.colors.ink, fontSize: 13, fontWeight: "800" },
  meta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
});
