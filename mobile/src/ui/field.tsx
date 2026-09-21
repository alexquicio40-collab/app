import { theme } from "@/lib/theme";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { EyeIcon } from "./icons";

type FieldProps = TextInputProps & {
  label: string;
  error?: string;
  passwordToggle?: boolean;
};

export function Field({
  label,
  error,
  passwordToggle = false,
  secureTextEntry,
  ...props
}: FieldProps) {
  const [visible, setVisible] = useState(false);
  const isSecure = passwordToggle ? !visible : secureTextEntry;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          placeholderTextColor={theme.colors.muted}
          {...props}
          secureTextEntry={isSecure}
          style={[
            styles.input,
            passwordToggle ? styles.inputWithToggle : null,
            error ? styles.inputError : null,
          ]}
        />
        {passwordToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            hitSlop={8}
            onPress={() => setVisible((current) => !current)}
            style={styles.toggle}
          >
            <EyeIcon hidden={visible} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    color: theme.colors.ink,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  inputWithToggle: {
    paddingRight: 48,
  },
  toggle: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 13,
  },
});
