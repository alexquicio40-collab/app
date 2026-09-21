import { theme } from "@/lib/theme";
import { Button } from "@/ui/button";
import { Screen } from "@/ui/screen";
import { Link, Stack } from "expo-router";
import { StyleSheet, Text } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen>
        <Text style={styles.title}>Página no encontrada</Text>
        <Text style={styles.subtitle}>Vuelve al inicio para continuar.</Text>
        <Link href="/" asChild>
          <Button label="Ir al inicio" />
        </Link>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.colors.ink,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 16,
  },
});
