import { InstalacionProvider, useInstalacionGate } from "@/features/instalacion";
import { theme } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
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
        <InstalacionProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </InstalacionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const auth = useAuth();
  const setup = useInstalacionGate();

  if (auth.status === "loading" || !setup.ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  const showInstall = !setup.completed;
  const showApp = setup.completed && auth.status === "authenticated";
  const showAuth = setup.completed && !showApp;

  return (
    <Stack screenOptions={ROOT_STACK}>
      <Stack.Protected guard={showInstall}>
        <Stack.Screen name="instalacion" />
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
    backgroundColor: theme.colors.bg,
  },
});
