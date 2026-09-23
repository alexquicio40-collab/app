import { useInstalacionGate } from "@/features/instalacion";
import { theme } from "@/lib/theme";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function InstalacionLayout() {
  const gate = useInstalacionGate();

  if (!gate.ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={theme.colors.gold} />
      </View>
    );
  }

  if (gate.completed) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: theme.colors.accentDeep },
      }}
    />
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accentDeep,
  },
});
