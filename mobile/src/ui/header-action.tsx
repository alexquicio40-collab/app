import { theme } from "@/lib/theme";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type HeaderActionTone = "ghost" | "danger" | "soft";

type HeaderActionProps = {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  tone?: HeaderActionTone;
  compact?: boolean;
  accessibilityLabel?: string;
};

/** Botón de acción del header (Actualizar, Limpiar, Cerrar sesión). */
export function HeaderAction({
  label,
  icon,
  onPress,
  tone = "ghost",
  compact = false,
  accessibilityLabel,
}: HeaderActionProps) {
  const toneStyle =
    tone === "danger" ? styles.danger : tone === "soft" ? styles.soft : styles.ghost;
  const textStyle =
    tone === "danger" ? styles.dangerText : tone === "soft" ? styles.softText : styles.ghostText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        compact ? styles.btnCompact : null,
        toneStyle,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.icon}>{icon}</View>
      <Text style={[styles.label, compact ? styles.labelCompact : null, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function IconRefresh({ color = "#fff" }: { color?: string }) {
  return <Text style={[styles.glyph, { color }]}>↻</Text>;
}

export function IconClear({ color = "#fff" }: { color?: string }) {
  return <Text style={[styles.glyph, { color }]}>↺</Text>;
}

export function IconSignOut({ color = "#fff" }: { color?: string }) {
  return (
    <View style={styles.signOutGlyph}>
      <View style={[styles.signOutDoor, { borderColor: color }]} />
      <Text style={[styles.signOutArrow, { color }]}>→</Text>
    </View>
  );
}

export function IconCard({ color = "#fff" }: { color?: string }) {
  return (
    <View style={[styles.cardGlyph, { borderColor: color }]}>
      <View style={[styles.cardStripe, { backgroundColor: color }]} />
    </View>
  );
}

export function IconCash({ color = "#fff" }: { color?: string }) {
  return (
    <View style={[styles.cashGlyph, { borderColor: color }]}>
      <Text style={[styles.cashText, { color }]}>S/</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    maxWidth: 148,
  },
  btnCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
  },
  pressed: { opacity: 0.88 },
  ghost: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  soft: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  danger: {
    backgroundColor: theme.colors.danger,
    borderWidth: 1,
    borderColor: "#9B1C1C",
  },
  icon: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    flexShrink: 1,
  },
  labelCompact: {
    fontSize: 10,
  },
  ghostText: { color: "#FFFFFF" },
  softText: { color: "#FFFFFF" },
  dangerText: { color: "#FFFFFF" },
  glyph: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 14,
  },
  signOutGlyph: {
    width: 14,
    height: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  signOutDoor: {
    width: 7,
    height: 10,
    borderWidth: 1.5,
    borderRadius: 1.5,
  },
  signOutArrow: {
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 10,
    marginLeft: -1,
  },
  cardGlyph: {
    width: 14,
    height: 10,
    borderWidth: 1.5,
    borderRadius: 2,
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  cardStripe: {
    height: 1.5,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  cashGlyph: {
    width: 16,
    height: 12,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  cashText: {
    fontSize: 7,
    fontWeight: "900",
    lineHeight: 8,
  },
});
