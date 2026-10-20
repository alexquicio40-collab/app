import { BitacoraVistaHost } from "@/features/bitacora/vista-host";
import { OfflineBar } from "@/lib/offline";
import { ProgramacionAlerta, ReprogramAviso } from "@/features/programacion-alerta";
import { canSeeMapaCampo, canSeeOperadores } from "@/lib/role-nav";
import { theme } from "@/lib/theme";
import { useAuth } from "@/providers/auth-provider";
import { BrandLogo } from "@/ui/brand-logo";
import { FloatingTabBar } from "@/ui/floating-tab-bar";
import { Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function AppLayout() {
  const { status, user } = useAuth();
  const rol = user?.rol;
  const showOperadores = canSeeOperadores(rol);
  const showMapa = canSeeMapaCampo(rol);

  if (status !== "authenticated") {
    return (
      <View style={styles.boot}>
        <BrandLogo height={88} />
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <OfflineBar />
      <View style={styles.tabs}>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: theme.colors.bg },
          freezeOnBlur: true,
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Inicio" }} />
        <Tabs.Screen
          name="operadores"
          options={{ title: "Operadores", href: showOperadores ? undefined : null }}
        />
        <Tabs.Screen
          name="mapa"
          options={{ title: "Mapa", href: showMapa ? undefined : null, freezeOnBlur: false }}
        />
        <Tabs.Screen name="rutas" options={{ title: "Rutas" }} />
        <Tabs.Screen name="modulos" options={{ title: "Módulos" }} />
        <Tabs.Screen name="locales" options={{ href: null, freezeOnBlur: false }} />
        <Tabs.Screen name="rutas-mapa" options={{ href: null }} />
        <Tabs.Screen name="usuarios" options={{ href: null }} />
        <Tabs.Screen name="sesiones" options={{ href: null }} />
        <Tabs.Screen name="conductores" options={{ href: null }} />
        <Tabs.Screen name="planta" options={{ href: null }} />
        <Tabs.Screen name="certificados" options={{ href: null, freezeOnBlur: false }} />
        <Tabs.Screen name="pagos" options={{ href: null }} />
        <Tabs.Screen name="reportes-kpi" options={{ href: null }} />
        <Tabs.Screen name="reportes" options={{ href: null }} />
        <Tabs.Screen name="historial" options={{ href: null }} />
        <Tabs.Screen name="hoja-ruta" options={{ href: null }} />
      </Tabs>
      </View>
      <BitacoraVistaHost />
      <ProgramacionAlerta />
      <ReprogramAviso />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: { flex: 1 },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    backgroundColor: theme.colors.bg,
  },
});
