import { theme } from "@/lib/theme";
import { Stack } from "expo-router";

const AUTH_STACK = {
  headerShown: false,
  animation: "fade" as const,
  contentStyle: { backgroundColor: theme.colors.bg },
};

export default function AuthLayout() {
  return <Stack screenOptions={AUTH_STACK} />;
}
