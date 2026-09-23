import { canSeeMapaCampo, canSeeOperadores } from "@/lib/role-nav";
import { theme } from "@/lib/theme";
import { useAuth } from "@/providers/auth-provider";
import { FloatingTabBar } from "@/ui/floating-tab-bar";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function AppLayout() {
  const { status, user } = useAuth();
  const rol = user?.rol;
  const showOperadores = canSeeOperadores(rol);
  const showMapa = canSeeMapaCampo(rol);

  if (status === "loading") {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  if (status === "guest") {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen
        name="operadores"
        options={{ title: "Operadores", href: showOperadores ? undefined : null }}
      />
      <Tabs.Screen
        name="mapa"
        options={{ title: "Mapa", href: showMapa ? undefined : null }}
      />
      <Tabs.Screen name="rutas" options={{ title: "Rutas" }} />
      <Tabs.Screen name="modulos" options={{ title: "Módulos" }} />
      <Tabs.Screen name="locales" options={{ href: null }} />
      <Tabs.Screen name="rutas-mapa" options={{ href: null }} />
      <Tabs.Screen name="usuarios" options={{ href: null }} />
      <Tabs.Screen name="conductores" options={{ href: null }} />
      <Tabs.Screen name="planta" options={{ href: null }} />
      <Tabs.Screen name="certificados" options={{ href: null }} />
      <Tabs.Screen name="pagos" options={{ href: null }} />
      <Tabs.Screen name="reportes-kpi" options={{ href: null }} />
      <Tabs.Screen name="hoja-ruta" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.bg,
  },
});
