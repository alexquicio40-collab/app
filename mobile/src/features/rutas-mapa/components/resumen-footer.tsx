import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

type ResumenFooterProps = {
  visibles: number;
  total: number;
  conductorLabel: string | null;
};

export function ResumenFooter({ visibles, total, conductorLabel }: ResumenFooterProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {conductorLabel ? conductorLabel : "Todas las rutas"}
      </Text>
      <Text style={styles.meta}>
        {visibles} en mapa
        {visibles !== total ? ` · ${total} asignadas` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: theme.colors.line,
    gap: 2,
  },
  title: { color: theme.colors.ink, fontSize: 13, fontWeight: "800" },
  meta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
});
