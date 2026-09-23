import { theme } from "@/lib/theme";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type InstalacionHeroProps = {
  grantedCount: number;
  total: number;
};

export function InstalacionHero({ grantedCount, total }: InstalacionHeroProps) {
  const progress = total > 0 ? grantedCount / total : 0;
  const fill = useSharedValue(0);
  const sonar = useSharedValue(0);
  const core = useSharedValue(1);

  useEffect(() => {
    fill.value = withSpring(progress, { damping: 16, stiffness: 140, mass: 0.7 });
  }, [fill, progress]);

  useEffect(() => {
    sonar.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    core.value = withRepeat(
      withTiming(1.18, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [core, sonar]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, fill.value)) * 100}%`,
  }));

  const sonarStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - sonar.value),
    transform: [{ scale: 0.72 + sonar.value * 0.85 }],
  }));

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: core.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(560).springify().damping(18)} style={styles.wrap}>
      <View style={styles.brandRow}>
        <View style={styles.markWrap}>
          <Animated.View style={[styles.sonar, sonarStyle]} />
          <View style={styles.mark}>
            <View style={styles.markRing} />
            <Animated.View style={[styles.markCore, coreStyle]} />
          </View>
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.brand}>Ubicación</Text>
          <Text style={styles.kicker}>BIOCLIM · VEZPER</Text>
        </View>
        <View style={styles.stepChip}>
          <Text style={styles.stepChipText}>Paso 1</Text>
        </View>
      </View>

      <Text style={styles.title}>Prepara tu dispositivo</Text>
      <Text style={styles.subtitle}>
        Activa los permisos para navegar, registrar visitas y adjuntar evidencias en campo.
      </Text>

      <View style={styles.progressBlock}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, fillStyle]} />
        </View>
        <Text style={styles.progressMeta}>
          {grantedCount} de {total} listos
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    paddingBottom: 4,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  markWrap: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  sonar: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: theme.colors.gold,
  },
  mark: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  markRing: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(201,162,39,0.35)",
  },
  markCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.gold,
  },
  brandCopy: { flex: 1, gap: 1 },
  brand: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  kicker: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  stepChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  stepChipText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.7,
    lineHeight: 34,
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
    maxWidth: 340,
  },
  progressBlock: {
    marginTop: 10,
    gap: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: theme.colors.gold,
  },
  progressMeta: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
  },
});
