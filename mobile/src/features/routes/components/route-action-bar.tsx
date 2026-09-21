import { theme } from "@/lib/theme";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ActionTone = "accent" | "info" | "danger" | "muted";

type ActionIconButtonProps = {
  label: string;
  glyph?: string;
  icon?: ReactNode;
  tone?: ActionTone;
  onPress: () => void;
  disabled?: boolean;
};

const TONE = {
  accent: { fg: theme.colors.accent, bg: theme.colors.accentSoft, border: "#B7D4C8" },
  info: { fg: theme.colors.info, bg: theme.colors.infoSoft, border: "#B9CFE3" },
  danger: { fg: theme.colors.danger, bg: theme.colors.dangerSoft, border: "#E8B4B0" },
  muted: { fg: theme.colors.muted, bg: theme.colors.cream, border: theme.colors.line },
} as const;

/** Botón de acción compacto (glifo o icono View). */
export function ActionIconButton({
  label,
  glyph,
  icon,
  tone = "accent",
  onPress,
  disabled = false,
}: ActionIconButtonProps) {
  const colors = TONE[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: colors.bg, borderColor: colors.border },
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      {icon ?? <Text style={[styles.glyph, { color: colors.fg }]}>{glyph}</Text>}
    </Pressable>
  );
}

/** Tachito de basura dibujado (sin vector-icons). */
export function TrashIcon({ color = theme.colors.danger, size = 15 }: { color?: string; size?: number }) {
  const lidW = size * 0.72;
  const bodyW = size * 0.58;
  const bodyH = size * 0.52;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* asa */}
      <View
        style={{
          width: size * 0.28,
          height: size * 0.14,
          borderWidth: 1.4,
          borderColor: color,
          borderBottomWidth: 0,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          marginBottom: 1,
        }}
      />
      {/* tapa */}
      <View
        style={{
          width: lidW,
          height: 1.6,
          backgroundColor: color,
          borderRadius: 1,
          marginBottom: 1.5,
        }}
      />
      {/* cuerpo */}
      <View
        style={{
          width: bodyW,
          height: bodyH,
          borderWidth: 1.4,
          borderColor: color,
          borderRadius: 2,
          borderTopWidth: 0,
          alignItems: "center",
          justifyContent: "space-evenly",
          paddingVertical: 2,
        }}
      >
        <View style={{ width: 1.4, height: bodyH * 0.55, backgroundColor: color, borderRadius: 1 }} />
      </View>
    </View>
  );
}

export function RouteActionBar({ children }: { children: ReactNode }) {
  return <View style={styles.bar}>{children}</View>;
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
