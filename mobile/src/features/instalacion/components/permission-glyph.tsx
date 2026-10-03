import { theme } from "@/lib/theme";
import { StyleSheet, View } from "react-native";
import type { PermissionAccent } from "../types";

const TONE: Record<PermissionAccent, { bg: string; fg: string }> = {
  location: { bg: theme.colors.accentSoft, fg: theme.colors.accent },
  locationBg: { bg: theme.colors.infoSoft, fg: theme.colors.info },
  notifications: { bg: theme.colors.warnSoft, fg: theme.colors.warn },
  battery: { bg: theme.colors.goldSoft, fg: theme.colors.gold },
  camera: { bg: theme.colors.infoSoft, fg: theme.colors.info },
  photos: { bg: theme.colors.goldSoft, fg: theme.colors.gold },
};

/** Glifos geométricos (sin emojis) alineados al lenguaje visual de la app. */
export function PermissionGlyph({ accent }: { accent: PermissionAccent }) {
  const tone = TONE[accent];

  if (accent === "location" || accent === "locationBg") {
    return (
      <View style={[styles.mark, { backgroundColor: tone.bg }]}>
        <View style={[styles.pinBody, { backgroundColor: tone.fg }]} />
        <View style={[styles.pinDot, { backgroundColor: tone.bg }]} />
      </View>
    );
  }

  if (accent === "notifications") {
    return (
      <View style={[styles.mark, { backgroundColor: tone.bg }]}>
        <View style={[styles.bell, { borderColor: tone.fg }]} />
        <View style={[styles.bellDot, { backgroundColor: tone.fg }]} />
      </View>
    );
  }

  if (accent === "battery") {
    return (
      <View style={[styles.mark, { backgroundColor: tone.bg }]}>
        <View style={[styles.batt, { borderColor: tone.fg }]}>
          <View style={[styles.battFill, { backgroundColor: tone.fg }]} />
        </View>
        <View style={[styles.battTip, { backgroundColor: tone.fg }]} />
      </View>
    );
  }

  if (accent === "camera") {
    return (
      <View style={[styles.mark, { backgroundColor: tone.bg }]}>
        <View style={[styles.camBody, { borderColor: tone.fg }]}>
          <View style={[styles.camLens, { backgroundColor: tone.fg }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.mark, { backgroundColor: tone.bg }]}>
      <View style={[styles.frame, { borderColor: tone.fg }]}>
        <View style={[styles.frameCorner, { backgroundColor: tone.fg }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pinBody: {
    width: 16,
    height: 22,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  pinDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    top: 18,
  },
  bell: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.4,
  },
  bellDot: {
    position: "absolute",
    bottom: 12,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  batt: {
    width: 20,
    height: 12,
    borderRadius: 3,
    borderWidth: 2.2,
    padding: 1.5,
    justifyContent: "center",
  },
  battFill: { width: 10, height: 5, borderRadius: 1 },
  battTip: {
    position: "absolute",
    right: 12,
    width: 3,
    height: 6,
    borderRadius: 1,
  },
  camBody: {
    width: 28,
    height: 20,
    borderRadius: 5,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  camLens: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  frame: {
    width: 26,
    height: 22,
    borderRadius: 4,
    borderWidth: 2.5,
    overflow: "hidden",
  },
  frameCorner: {
    position: "absolute",
    right: 3,
    top: 3,
    width: 7,
    height: 7,
    borderRadius: 1,
    opacity: 0.85,
  },
});
