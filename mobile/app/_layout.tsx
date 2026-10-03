import { GpsFondoHost } from "@/features/gps-fondo/host";
import { InstalacionProvider, useInstalacionGate } from "@/features/instalacion";
import { RecojoSyncHost } from "@/features/recojo-offline/host";
import { LicenciaProvider, useLicenciaGate } from "@/features/sesiones/licencia-gate";
import { theme } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { BrandLogo } from "@/ui/brand-logo";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const ROOT_STACK = {
  headerShown: false,
  animation: "fade" as const,
  contentStyle: { backgroundColor: theme.colors.bg },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GpsFondoHost />
        <RecojoSyncHost />
        <InstalacionProvider>
          <LicenciaProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </LicenciaProvider>
        </InstalacionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const auth = useAuth();
  const setup = useInstalacionGate();
  const licencia = useLicenciaGate();

  if (auth.status === "loading" || !setup.ready || !licencia.ready) {
    return (
      <View style={styles.boot}>
        <BrandLogo height={88} />
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  const showInstall = !setup.completed;
  const showLicencia = setup.completed && !licencia.autorizado && auth.status !== "authenticated";
  const showApp = setup.completed && licencia.autorizado && auth.status === "authenticated";
  const showAuth = setup.completed && licencia.autorizado && !showApp;

  return (
    <Stack screenOptions={ROOT_STACK}>
      <Stack.Protected guard={showInstall}>
        <Stack.Screen name="instalacion" />
      </Stack.Protected>
      <Stack.Protected guard={showLicencia}>
        <Stack.Screen name="licencia" />
      </Stack.Protected>
      <Stack.Protected guard={showAuth}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={showApp}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    backgroundColor: theme.colors.bg,
  },
});
