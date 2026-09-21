import { theme } from "@/lib/theme";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";

type ButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  variant?: "primary" | "ghost";
};

export function Button({
  label,
  loading = false,
  variant = "primary",
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.ghost,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#FFFFFF" : theme.colors.ink} />
      ) : (
        <Text style={[styles.label, variant === "ghost" ? styles.ghostLabel : null]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.space.lg,
    marginTop: 4,
  },
  primary: {
    backgroundColor: theme.colors.accent,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  ghostLabel: {
    color: theme.colors.accent,
  },
});
