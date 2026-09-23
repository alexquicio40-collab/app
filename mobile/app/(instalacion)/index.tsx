import { InstalacionHero } from "@/features/instalacion/components/instalacion-hero";
import { PermissionCard } from "@/features/instalacion/components/permission-card";
import { useInstalacionFlow } from "@/features/instalacion/hooks";
import { theme } from "@/lib/theme";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  ReduceMotion,
  ReducedMotionConfig,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InstalacionScreen() {
  const goLogin = useCallback(() => {
    router.replace("/(auth)/login");
  }, []);

  const flow = useInstalacionFlow(goLogin);

  const ready = !flow.booting && flow.grantedCount === flow.total;

  return (
    <View style={styles.root}>
      <ReducedMotionConfig mode={ReduceMotion.Never} />
      <LinearGradient
        colors={[theme.colors.accentDeep, "#0A4638", "#0F2E28"]}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.88, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <AmbientGlow style={styles.glowA} drift={22} delay={0} />
      <AmbientGlow style={styles.glowB} drift={-16} delay={700} />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <InstalacionHero grantedCount={flow.grantedCount} total={flow.total} />

          <View style={styles.list}>
            {flow.booting ? (
              <Animated.View entering={FadeIn.duration(280)} style={styles.bootCard}>
                <ActivityIndicator color={theme.colors.gold} />
                <Text style={styles.bootText}>Revisando permisos…</Text>
              </Animated.View>
            ) : (
              flow.rows.map((row, index) => (
                <PermissionCard
                  key={row.kind}
                  index={index}
                  row={row}
                  active={flow.activeKind === row.kind}
                  onPress={
                    flow.busy
                      ? undefined
                      : () => {
                          void flow.requestOne(row.kind);
                        }
                  }
                />
              ))
            )}
          </View>

          <Animated.View
            entering={FadeInUp.delay(420).duration(520).springify().damping(18)}
            style={styles.footer}
          >
            <ContinueButton
              busy={flow.busy}
              disabled={flow.busy || flow.booting}
              ready={ready}
              onPress={() => void flow.continueSetup()}
            />

            <Pressable
              accessibilityRole="button"
              disabled={flow.busy}
              onPress={() => void flow.skipSetup()}
              style={styles.skip}
            >
              <Text style={styles.skipText}>Continuar sin configurar</Text>
            </Pressable>

            <Text style={styles.note}>
              Puedes cambiar estos permisos más tarde en Ajustes del sistema.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function AmbientGlow({
  style,
  drift,
  delay,
}: {
  style: object;
  drift: number;
  delay: number;
}) {
  const shift = useSharedValue(0);

  useEffect(() => {
    shift.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 4600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 4600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, shift]);

  const anim = useAnimatedStyle(() => ({
    opacity: 0.75 + shift.value * 0.25,
    transform: [{ translateY: shift.value * drift }, { scale: 1 + shift.value * 0.08 }],
  }));

  return <Animated.View pointerEvents="none" style={[style, anim]} />;
}

function ContinueButton({
  busy,
  disabled,
  ready,
  onPress,
}: {
  busy: boolean;
  disabled: boolean;
  ready: boolean;
  onPress: () => void;
}) {
  const sheen = useSharedValue(-1.2);
  const pulse = useSharedValue(1);

  useEffect(() => {
    sheen.value = withRepeat(
      withTiming(1.2, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      false,
    );
  }, [sheen]);

  useEffect(() => {
    pulse.value = ready
      ? withRepeat(
          withSequence(
            withTiming(1.025, { duration: 900, easing: Easing.inOut(Easing.sin) }),
            withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false,
        )
      : withTiming(1, { duration: 220 });
  }, [pulse, ready]);

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sheen.value * 220 }, { rotate: "18deg" }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={pulseStyle}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.cta,
          disabled && styles.ctaDisabled,
          pressed && !busy ? styles.ctaPressed : null,
        ]}
      >
        {!busy ? <Animated.View pointerEvents="none" style={[styles.sheen, sheenStyle]} /> : null}
        {busy ? (
          <ActivityIndicator color={theme.colors.accentDeep} />
        ) : (
          <Text style={styles.ctaLabel}>Permitir y continuar</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.accentDeep,
  },
  glowA: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(201,162,39,0.14)",
    top: -60,
    right: -80,
  },
  glowB: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(220,238,231,0.08)",
    bottom: 80,
    left: -70,
  },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 18,
    flexGrow: 1,
  },
  list: { gap: 10 },
  bootCard: {
    minHeight: 120,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  bootText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    marginTop: "auto",
    gap: 2,
    paddingTop: 10,
  },
  cta: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.gold,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    overflow: "hidden",
  },
  sheen: {
    position: "absolute",
    width: 46,
    height: 90,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.992 }] },
  ctaDisabled: { opacity: 0.55 },
  ctaLabel: {
    color: theme.colors.accentDeep,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  skip: {
    alignItems: "center",
    paddingVertical: 14,
  },
  skipText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "700",
  },
  note: {
    textAlign: "center",
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
    paddingHorizontal: 12,
  },
});
