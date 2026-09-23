import { useInstalacionGate } from "@/features/instalacion";
import { theme } from "@/lib/theme";
import { useAuth } from "@/providers/auth-provider";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

/**
 * Puerta de entrada: instalación → login → app.
 */
export default function RootIndex() {
  const auth = useAuth();
  const setup = useInstalacionGate();

  if (auth.status === "loading" || !setup.ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  if (!setup.completed) {
    return <Redirect href="/(instalacion)" />;
  }

  if (auth.status === "authenticated") {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.bg,
  },
});
