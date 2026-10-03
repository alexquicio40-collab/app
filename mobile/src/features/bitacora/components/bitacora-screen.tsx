import { theme } from "@/lib/theme";
import { ScreenHeader } from "@/ui/screen-header";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useBitacoraScreen } from "../hooks";
import { diaTitulo } from "../lib/format";
import { BitacoraDetalleSheet } from "./bitacora-detalle-sheet";
import { BitacoraFilters } from "./bitacora-filters";
import { BitacoraKpis } from "./bitacora-kpis";
import { BitacoraRow } from "./bitacora-row";

export function BitacoraScreen() {
  const screen = useBitacoraScreen();
  const bottomPad = useContentBottomPad(12);

  const renderItem = useCallback(
    ({ item }: { item: (typeof screen.grupos)[number]["items"][number] }) => (
      <BitacoraRow item={item} onPress={() => screen.openDetalle(item)} />
    ),
    [screen],
  );

  if (!screen.canAccess) {
    return (
      <View style={styles.safe}>
        <ScreenHeader title="Reportes" compact />
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Solo administración</Text>
          <Text style={styles.emptyText}>La bitácora de todos los módulos la ve el administrador.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Reportes" compact />
      <BitacoraKpis resumen={screen.resumen} />
      <BitacoraFilters
        filtros={screen.filtros}
        onPeriodo={screen.setPeriodo}
        onAccion={screen.setAccion}
        onModulo={screen.setModulo}
        onQ={screen.setQ}
      />

      {screen.loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : screen.error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{screen.error}</Text>
          <Pressable onPress={() => void screen.reload()} style={styles.retry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <SectionList
          sections={screen.grupos.map((grupo) => ({
            title: diaTitulo(grupo.dia),
            data: grupo.items,
          }))}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <Text style={styles.day}>{section.title}</Text>
          )}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomPad + 16, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={screen.refreshing} onRefresh={() => void screen.reload()} />
          }
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Bitácora en blanco</Text>
              <Text style={styles.emptyText}>
                Desde ahora se anota lo que cada usuario crea, edita, borra, ve y registra en todos los
                módulos.
              </Text>
            </View>
          }
        />
      )}

      <BitacoraDetalleSheet item={screen.detalle} onClose={screen.closeDetalle} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 24 },
  day: {
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 4,
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  error: { color: theme.colors.danger, textAlign: "center", fontWeight: "700" },
  retry: {
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  retryText: { color: "#FFFFFF", fontWeight: "800" },
  empty: { paddingTop: 48, alignItems: "center", gap: 8, paddingHorizontal: 28 },
  emptyTitle: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
});
