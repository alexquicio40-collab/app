import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ActionButtonsProps = {
  onShare: () => void;
  onCall: () => void;
  onNavigate: () => void;
};

export function OperatorActionButtons({ onShare, onCall, onNavigate }: ActionButtonsProps) {
  return (
    <View style={styles.row}>
      <Action label="Compartir" onPress={onShare} tone="accent" />
      <Action label="Llamar" onPress={onCall} tone="info" />
      <Action label="Cómo llegar" onPress={onNavigate} tone="gold" />
    </View>
  );
}

function Action({
  label,
  onPress,
  tone,
}: {
  label: string;
  onPress: () => void;
  tone: "accent" | "info" | "gold";
}) {
  const colors =
    tone === "info"
      ? { bg: theme.colors.infoSoft, fg: theme.colors.info, border: "#B9CFE3" }
      : tone === "gold"
        ? { bg: theme.colors.goldSoft, fg: theme.colors.gold, border: "#E0C98A" }
        : { bg: theme.colors.accentSoft, fg: theme.colors.accent, border: "#B7D4C8" };

  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, { backgroundColor: colors.bg, borderColor: colors.border }]}
    >
      <Text style={[styles.btnText, { color: colors.fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { fontSize: 11, fontWeight: "800" },
});
