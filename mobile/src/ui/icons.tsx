import { theme } from "@/lib/theme";
import { StyleSheet, View } from "react-native";

export function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <View style={styles.eyeBox} accessibilityElementsHidden>
      <View style={styles.eyeLid} />
      <View style={styles.eyePupil} />
      {hidden ? <View style={styles.eyeSlash} /> : null}
    </View>
  );
}

export function CheckIcon() {
  return (
    <View style={styles.checkBox} accessibilityElementsHidden>
      <View style={styles.checkMark} />
    </View>
  );
}

const styles = StyleSheet.create({
  eyeBox: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeLid: {
    width: 18,
    height: 11,
    borderRadius: 11,
    borderWidth: 1.7,
    borderColor: theme.colors.muted,
  },
  eyePupil: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: theme.colors.ink,
  },
  eyeSlash: {
    position: "absolute",
    width: 1.7,
    height: 20,
    borderRadius: 1,
    backgroundColor: theme.colors.ink,
    transform: [{ rotate: "45deg" }],
  },
  checkBox: {
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    width: 6,
    height: 10,
    marginTop: -2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },
});
