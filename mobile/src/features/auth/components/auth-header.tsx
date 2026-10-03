import { theme } from "@/lib/theme";
import { BrandLogo } from "@/ui/brand-logo";
import { StyleSheet, Text, View } from "react-native";

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.wrap}>
      <BrandLogo height={76} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  title: {
    color: theme.colors.ink,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 16,
    lineHeight: 22,
  },
});
