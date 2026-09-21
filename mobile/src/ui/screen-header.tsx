import { HeaderAction, IconSignOut } from "@/ui/header-action";
import { theme } from "@/lib/theme";
import { useAuth } from "@/providers/auth-provider";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  compact?: boolean;
  onBack?: () => void;
  trailing?: ReactNode;
  showSignOut?: boolean;
};

export function ScreenHeader({
  title,
  subtitle,
  compact = false,
  onBack,
  trailing,
  showSignOut = true,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  return (
    <View
      style={[
        styles.bar,
        compact ? styles.barCompact : null,
        { paddingTop: insets.top + (compact ? 4 : 6) },
      ]}
    >
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={onBack}
          style={[styles.back, compact ? styles.backCompact : null]}
        >
          <Text style={styles.backText}>←</Text>
        </Pressable>
      ) : null}

      <View style={styles.copy}>
        {!compact ? <Text style={styles.brand}>BIOCLIM</Text> : null}
        <Text style={[styles.title, compact ? styles.titleCompact : null]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && !compact ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing}

      {showSignOut ? (
        <HeaderAction
          label="Cerrar sesión"
          icon={<IconSignOut color="#FFFFFF" />}
          onPress={signOut}
          tone="danger"
          compact={compact}
          accessibilityLabel="Cerrar sesión"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: theme.colors.accentDeep,
    paddingHorizontal: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
  },
  barCompact: {
    paddingBottom: 6,
  },
  back: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  backCompact: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: -1,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  brand: {
    color: theme.colors.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginTop: 2,
  },
  titleCompact: {
    fontSize: 17,
    marginTop: 0,
  },
  subtitle: {
    color: "#B7D4C8",
    fontSize: 12,
    marginTop: 1,
  },
});
