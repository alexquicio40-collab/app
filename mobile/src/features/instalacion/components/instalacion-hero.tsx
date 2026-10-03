import { theme } from "@/lib/theme";
import { BrandLogo } from "@/ui/brand-logo";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

type InstalacionHeroProps = {
  grantedCount: number;
  total: number;
};

export function InstalacionHero({ grantedCount, total }: InstalacionHeroProps) {
  const progress = total > 0 ? grantedCount / total : 0;
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withSpring(progress, { damping: 16, stiffness: 140, mass: 0.7 });
  }, [fill, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, fill.value)) * 100}%`,
  }));

  return (
    <Animated.View entering={FadeInDown.duration(560).springify().damping(18)} style={styles.wrap}>
      <View style={styles.brandRow}>
        <BrandLogo height={34} plated />
        <View style={styles.brandCopy}>
          <Text style={styles.brand}>BIOCLIM</Text>
          <Text style={styles.kicker}>VEZPER</Text>
        </View>
        <View style={styles.stepChip}>
          <Text style={styles.stepChipText}>Paso 1</Text>
        </View>
      </View>

      <Text style={styles.title}>Prepara tu dispositivo</Text>
      <Text style={styles.subtitle}>
        Activa ubicación, segundo plano, notificaciones y batería. Así el dispositivo no corta el seguimiento de ningún usuario.
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
