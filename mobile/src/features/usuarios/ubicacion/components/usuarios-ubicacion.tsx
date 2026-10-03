import type { UsuarioItem } from "../../types";
import { useUsuariosUbicacion } from "../hooks";
import { UbicacionLista } from "./ubicacion-lista";
import { UbicacionMap } from "./ubicacion-map";
import { theme } from "@/lib/theme";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export function UsuariosUbicacion({ usuarios }: { usuarios: UsuarioItem[] }) {
  const screen = useUsuariosUbicacion(usuarios);

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        <UbicacionMap
          puntos={screen.puntos}
          selectedId={screen.selectedId}
          onSelect={screen.setSelectedId}
        />
        {screen.loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.accent} />
          </View>
        ) : null}
      </View>

      <View style={styles.sheet}>
        <View style={styles.head}>
          <Text style={styles.title}>Puntos GPS</Text>
          <Text style={styles.meta}>
            {screen.vivos} en vivo · {screen.puntos.length} con ubicación
          </Text>
        </View>
        {screen.error ? (
          <Pressable onPress={() => void screen.reload()}>
            <Text style={styles.err}>{screen.error} · Reintentar</Text>
          </Pressable>
        ) : (
          <UbicacionLista
            puntos={screen.puntos}
            selectedId={screen.selectedId}
            onSelect={screen.setSelectedId}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 420 },
  stage: { flex: 1, minHeight: 280, position: "relative" },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 4,
  },
  head: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  title: { color: theme.colors.ink, fontSize: 12, fontWeight: "800" },
  meta: { color: theme.colors.muted, fontSize: 11, fontWeight: "700" },
  err: { color: theme.colors.danger, fontSize: 12, fontWeight: "700", paddingVertical: 8 },
});
