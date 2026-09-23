import { InstalacionHero } from "@/features/instalacion/components/instalacion-hero";
import { PermissionCard } from "@/features/instalacion/components/permission-card";
import { useInstalacionFlow } from "@/features/instalacion/hooks";
import { theme } from "@/lib/theme";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InstalacionScreen() {
  const goLogin = useCallback(() => {
    router.replace("/(auth)/login");
  }, []);

  const flow = useInstalacionFlow(goLogin);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[theme.colors.accentDeep, "#0A4638", "#0F2E28"]}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.88, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glowA} pointerEvents="none" />
      <View style={styles.glowB} pointerEvents="none" />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <InstalacionHero grantedCount={flow.grantedCount} total={flow.total} />

          <View style={styles.list}>
            {flow.booting ? (
              <View style={styles.bootCard}>
                <ActivityIndicator color={theme.colors.gold} />
                <Text style={styles.bootText}>Revisando permisos…</Text>
              </View>
            ) : (
              flow.rows.map((row) => (
                <PermissionCard
                  key={row.kind}
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

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              disabled={flow.busy || flow.booting}
              onPress={() => void flow.continueSetup()}
              style={({ pressed }) => [
                styles.cta,
                (flow.busy || flow.booting) && styles.ctaDisabled,
                pressed && !flow.busy ? styles.ctaPressed : null,
              ]}
            >
              {flow.busy ? (
                <ActivityIndicator color={theme.colors.accentDeep} />
              ) : (
                <Text style={styles.ctaLabel}>Permitir y continuar</Text>
              )}
            </Pressable>

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
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
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
