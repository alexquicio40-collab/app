import { ProgramacionAlerta } from "@/features/programacion-alerta";
import { canSeeMapaCampo, canSeeOperadores } from "@/lib/role-nav";
import { theme } from "@/lib/theme";
import { useAuth } from "@/providers/auth-provider";
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
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
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
      <ProgramacionAlerta />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.bg,
  },
});
