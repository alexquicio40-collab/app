import { PlantaCard } from "@/features/planta/components/planta-card";
import { PlantaDetailSheet } from "@/features/planta/components/planta-detail-sheet";
import { PlantaFormSheet } from "@/features/planta/components/planta-form-sheet";
import { PlantaSummary } from "@/features/planta/components/planta-summary";
import { PlantaToolbar } from "@/features/planta/components/planta-toolbar";
import { usePlantaScreen } from "@/features/planta/hooks";
import { theme } from "@/lib/theme";
import { ScreenHeader } from "@/ui/screen-header";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function PlantaScreen() {
  const screen = usePlantaScreen();
  const bottomPad = useContentBottomPad(12);

  const renderItem = useCallback(
    ({ item }: { item: (typeof screen.filtered)[number] }) => (
      <PlantaCard
        item={item}
        canManage={screen.canManage}
        onOpen={() => screen.openDetail(item.id)}
        onEdit={screen.canManage ? () => screen.openEdit(item.id) : undefined}
        onDelete={screen.canManage ? () => void screen.removeRegistro(item) : undefined}
      />
    ),
    [screen],
  );

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Planta"
        compact
        trailing={
          screen.canManage ? (
            <Pressable onPress={screen.openCreate} style={styles.newBtn}>
              <Text style={styles.newBtnText}>+ Nuevo</Text>
            </Pressable>
          ) : null
        }
      />

      <PlantaToolbar
        filters={screen.filters}
        asesores={screen.asesores}
        total={screen.registros.length}
        visible={screen.filtered.length}
        hasFilters={screen.hasFilters}
        onChange={screen.patchFilters}
        onClear={screen.clearFilters}
      />

      <PlantaSummary
        count={screen.filtered.length}
        litros={screen.totals.litros}
        baldes={screen.totals.baldes}
        galoneras={screen.totals.galoneras}
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
        <FlatList
          data={screen.filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 24 }]}
          refreshControl={
            <RefreshControl
              refreshing={screen.refreshing}
              onRefresh={() => void screen.reload()}
              tintColor={theme.colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Sin registros</Text>
              <Text style={styles.emptyText}>
                {screen.hasFilters
                  ? "Prueba limpiar los filtros"
                  : "Registra el primer ingreso a planta"}
              </Text>
              {screen.hasFilters ? (
                <Pressable onPress={screen.clearFilters} style={styles.retry}>
                  <Text style={styles.retryText}>Limpiar filtros</Text>
                </Pressable>
              ) : null}
            </View>
          }
        />
      )}

      <PlantaFormSheet
        open={screen.formOpen}
        item={screen.editing}
        asesores={screen.asesores}
        saving={screen.mutating}
        onClose={screen.closeForm}
        onSave={screen.saveRegistro}
      />

      <PlantaDetailSheet
        item={screen.selected}
        canManage={screen.canManage}
        onClose={screen.closeDetail}
        onEdit={
          screen.selected && screen.canManage
            ? () => screen.openEdit(screen.selected!.id)
            : undefined
        }
        onDelete={
          screen.selected && screen.canManage
            ? () => void screen.removeRegistro(screen.selected!)
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  newBtn: {
    backgroundColor: theme.colors.gold,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 2,
  },
  newBtnText: {
    color: theme.colors.accentDeep,
    fontSize: 12,
    fontWeight: "800",
  },
  list: { paddingTop: 6, flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  retry: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
  },
  retryText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  empty: {
    paddingTop: 48,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 18,
  },
});
