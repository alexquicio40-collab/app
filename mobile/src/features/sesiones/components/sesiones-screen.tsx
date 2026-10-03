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
  TextInput,
  View,
} from "react-native";
import { useSesionesScreen } from "../hooks";
import { DispositivoCard } from "./dispositivo-card";
import { DispositivoForm } from "./dispositivo-form";
import { SesionCard } from "./sesion-card";
import { SesionesTabs } from "./sesiones-tabs";

export function SesionesScreen() {
  const screen = useSesionesScreen();
  const bottomPad = useContentBottomPad(12);

  const renderSesion = useCallback(
    ({ item }: { item: (typeof screen.sesiones)[number] }) => (
      <SesionCard
        item={item}
        busy={screen.busy}
        onCerrar={() => void screen.onCerrar(item)}
        onCerrarTodas={() => void screen.onCerrarTodas(item)}
      />
    ),
    [screen],
  );

  const renderDisp = useCallback(
    ({ item }: { item: (typeof screen.dispositivos)[number] }) => (
      <DispositivoCard
        item={item}
        mio={item.huella === screen.huella}
        busy={screen.busy}
        onBloquear={() => void screen.onBloquear(item)}
        onAutorizar={() => void screen.onAutorizar(item)}
        onEliminar={() => void screen.onEliminar(item)}
      />
    ),
    [screen],
  );

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Sesiones" compact />
      {!screen.canManage ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Solo el administrador gestiona sesiones.</Text>
        </View>
      ) : (
        <>
          <SesionesTabs
            tab={screen.tab}
            activas={screen.activas}
            dispositivos={screen.totalDispositivos}
            soloActivas={screen.soloActivas}
            onTab={screen.setTab}
            onFiltro={() => screen.setSoloActivas((v) => !v)}
          />
          <TextInput
            value={screen.q}
            onChangeText={screen.setQ}
            placeholder="Buscar usuario, IP o huella"
            placeholderTextColor={theme.colors.muted}
            style={styles.search}
          />
          {screen.tab === "dispositivos" ? (
            <>
              <DispositivoForm busy={screen.busy} onSubmit={screen.onRegistrar} />
              {screen.huella ? (
                <Text style={styles.huella} selectable>
                  Este aparato · {screen.huella}
                </Text>
              ) : null}
            </>
          ) : null}
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
          ) : screen.tab === "sesiones" ? (
            <FlatList
              data={screen.sesiones}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderSesion}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomPad + 16 }}
              refreshControl={
                <RefreshControl refreshing={screen.refreshing} onRefresh={() => void screen.reload()} />
              }
              ListEmptyComponent={<Text style={styles.empty}>Sin sesiones.</Text>}
            />
          ) : (
            <FlatList
              data={screen.dispositivos}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderDisp}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomPad + 16 }}
              refreshControl={
                <RefreshControl refreshing={screen.refreshing} onRefresh={() => void screen.reload()} />
              }
              ListEmptyComponent={<Text style={styles.empty}>Sin dispositivos.</Text>}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 20 },
  muted: { color: theme.colors.muted, fontWeight: "600" },
  error: { color: theme.colors.danger, textAlign: "center" },
  retry: {
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  retryText: { color: "#FFFFFF", fontWeight: "800" },
  search: {
    marginHorizontal: 10,
    marginTop: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: theme.colors.ink,
  },
  huella: {
    marginHorizontal: 12,
    marginTop: 4,
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  empty: { textAlign: "center", color: theme.colors.muted, marginTop: 24, fontWeight: "600" },
});
