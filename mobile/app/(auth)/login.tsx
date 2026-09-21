import { useLoginForm } from "@/features/auth/hooks";
import { theme } from "@/lib/theme";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { CheckIcon } from "@/ui/icons";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const form = useLoginForm();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.center}>
          <View style={styles.card}>
            <View style={styles.brand}>
              <View style={styles.mark}>
                <View style={styles.pin} />
              </View>
              <Text style={styles.product}>Ubicación</Text>
              <Text style={styles.title}>Iniciar sesión</Text>
              <Text style={styles.subtitle}>Ingresa tus credenciales para continuar</Text>
            </View>

            {form.formError ? <Text style={styles.banner}>{form.formError}</Text> : null}

            <Field
              label="Usuario"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
              placeholder="tu usuario"
              value={form.username}
              onChangeText={form.setUsername}
              error={form.errors.username}
            />
            <Field
              label="Contraseña"
              passwordToggle
              autoComplete="password"
              placeholder="••••••••"
              value={form.password}
              onChangeText={form.setPassword}
              error={form.errors.password}
            />

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: form.rememberUser }}
              onPress={() => form.setRememberUser(!form.rememberUser)}
              style={styles.remember}
            >
              <View style={[styles.box, form.rememberUser ? styles.boxOn : null]}>
                {form.rememberUser ? <CheckIcon /> : null}
              </View>
              <Text style={styles.rememberLabel}>Recordar usuario</Text>
            </Pressable>

            <Button label="Ingresar" loading={form.loading} onPress={form.submit} />
          </View>
        </View>

        <Text style={styles.copyright}>© VEZPER S.A.C 2026</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    shadowColor: "#10231E",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  brand: {
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  pin: {
    width: 14,
    height: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  product: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.ink,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
  banner: {
    backgroundColor: theme.colors.dangerSoft,
    color: theme.colors.danger,
    borderRadius: theme.radius.sm,
    padding: 12,
    fontSize: 14,
    textAlign: "center",
  },
  remember: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  boxOn: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  rememberLabel: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "500",
  },
  copyright: {
    color: theme.colors.muted,
    fontSize: 12,
    letterSpacing: 0.4,
    textAlign: "center",
    paddingBottom: 16,
  },
});
