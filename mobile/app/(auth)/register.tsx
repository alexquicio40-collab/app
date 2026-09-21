import { AuthHeader } from "@/features/auth/components/auth-header";
import { useRegisterForm } from "@/features/auth/hooks";
import { theme } from "@/lib/theme";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { Screen } from "@/ui/screen";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function RegisterScreen() {
  const form = useRegisterForm();

  return (
    <Screen>
      <AuthHeader
        title="Crear cuenta"
        subtitle="Regístrate para empezar. Solo toma un momento."
      />

      <View style={styles.form}>
        {form.formError ? <Text style={styles.banner}>{form.formError}</Text> : null}

        <Field
          label="Nombre"
          autoComplete="name"
          placeholder="Tu nombre"
          value={form.name}
          onChangeText={form.setName}
          error={form.errors.name}
        />
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
          secureTextEntry
          autoComplete="password-new"
          placeholder="Mínimo 8 caracteres"
          value={form.password}
          onChangeText={form.setPassword}
          error={form.errors.password}
        />

        <Button label="Registrarme" loading={form.loading} onPress={form.submit} />
      </View>

      <Link href="/(auth)/login" asChild>
        <Button label="Ya tengo cuenta" variant="ghost" />
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: theme.space.md,
  },
  banner: {
    backgroundColor: theme.colors.dangerSoft,
    color: theme.colors.danger,
    borderRadius: theme.radius.sm,
    padding: 12,
    fontSize: 14,
  },
});
