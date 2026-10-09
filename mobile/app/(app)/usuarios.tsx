import { UsuarioCard } from "@/features/usuarios/components/usuario-card";
import { UsuarioFormSheet } from "@/features/usuarios/components/usuario-form-sheet";
import { UsuarioPermisosSheet } from "@/features/usuarios/components/usuario-permisos-sheet";
import { UsuariosTabs } from "@/features/usuarios/components/usuarios-tabs";
import { UsuariosToolbar } from "@/features/usuarios/components/usuarios-toolbar";
import { useUsuariosScreen } from "@/features/usuarios/hooks";
import { UsuariosUbicacion } from "@/features/usuarios/ubicacion";
import type { UsuariosTab } from "@/features/usuarios/ubicacion/types";
import { theme } from "@/lib/theme";
import { ScreenHeader } from "@/ui/screen-header";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function UsuariosScreen() {
  const screen = useUsuariosScreen();
  const bottomPad = useContentBottomPad(12);
  const [tab, setTab] = useState<UsuariosTab>("lista");

  const renderItem = useCallback(
    ({ item }: { item: (typeof screen.filtered)[number] }) => (
      <UsuarioCard
        user={item}
        onEdit={() => screen.openEdit(item.id)}
        onPermisos={() => void screen.openPermisos(item.id)}
        onDelete={() => void screen.removeUsuario(item)}
        onToggleActivo={() => void screen.toggleActivo(item)}
      />
    ),
    [screen],
  );

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Usuarios"
        compact
        trailing={
          screen.canManage ? (
            <Pressable onPress={screen.openCreate} style={styles.newBtn}>
              <Text style={styles.newBtnText}>+ Nuevo</Text>
            </Pressable>
          ) : null
        }
      />

      <UsuariosTabs tab={tab} onTab={setTab} />

      {tab === "ubicacion" ? (
        <UsuariosUbicacion usuarios={screen.usuarios} />
      ) : (
        <>
      <UsuariosToolbar
        filters={screen.filters}
        total={screen.usuarios.length}
        visible={screen.filtered.length}
        hasFilters={screen.hasFilters}
        onChange={screen.patchFilters}
        onClear={screen.clearFilters}
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
              <Text style={styles.emptyTitle}>Sin usuarios</Text>
              <Text style={styles.emptyText}>
                {screen.hasFilters
                  ? "Prueba limpiar los filtros"
                  : "Crea el primer usuario con + Nuevo"}
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
        </>
      )}

      <UsuarioFormSheet
        open={screen.formOpen}
        user={screen.editing}
        usuarios={screen.usuarios}
        saving={screen.mutating}
        onClose={screen.closeForm}
        onSave={screen.saveUsuario}
      />

      <UsuarioPermisosSheet
        open={screen.permisosOpen}
        user={screen.permisosUser}
        saving={screen.mutating}
        onClose={screen.closePermisos}
        onSave={screen.savePermisos}
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
  list: { paddingTop: 8, flexGrow: 1 },
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
