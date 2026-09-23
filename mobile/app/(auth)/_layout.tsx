import { useInstalacionGate } from "@/features/instalacion";
import { theme } from "@/lib/theme";
import { useAuth } from "@/providers/auth-provider";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function AuthLayout() {
  const { status } = useAuth();
  const setup = useInstalacionGate();

  if (status === "loading" || !setup.ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  if (!setup.completed) {
    return <Redirect href="/(instalacion)" />;
  }

  if (status === "authenticated") {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    />
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
