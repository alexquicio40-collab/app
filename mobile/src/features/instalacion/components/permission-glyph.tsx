import { theme } from "@/lib/theme";
import { StyleSheet, View } from "react-native";
import type { PermissionDef } from "../types";

type Accent = PermissionDef["accent"];

const TONE: Record<Accent, { bg: string; fg: string }> = {
  location: { bg: theme.colors.accentSoft, fg: theme.colors.accent },
  camera: { bg: theme.colors.infoSoft, fg: theme.colors.info },
  photos: { bg: theme.colors.goldSoft, fg: theme.colors.gold },
};

/** Glifos geométricos (sin emojis) alineados al lenguaje visual de la app. */
export function PermissionGlyph({ accent }: { accent: Accent }) {
  const tone = TONE[accent];

  if (accent === "location") {
    return (
      <View style={[styles.mark, { backgroundColor: tone.bg }]}>
        <View style={[styles.pinBody, { backgroundColor: tone.fg }]} />
        <View style={[styles.pinDot, { backgroundColor: tone.bg }]} />
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
