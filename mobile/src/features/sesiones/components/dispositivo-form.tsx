import { theme } from "@/lib/theme";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { DispositivoInput } from "../types";

type Props = {
  busy?: boolean;
  onSubmit: (input: DispositivoInput) => Promise<void>;
};

export function DispositivoForm({ busy, onSubmit }: Props) {
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [plataforma, setPlataforma] = useState("");

  return (
    <View style={styles.wrap}>
      <TextInput
        value={nombre}
        onChangeText={setNombre}
        placeholder="Nombre"
        placeholderTextColor={theme.colors.muted}
        style={styles.input}
      />
      <TextInput
        value={codigo}
        onChangeText={setCodigo}
        placeholder="Código ABCD-EF12"
        placeholderTextColor={theme.colors.muted}
        autoCapitalize="characters"
        style={styles.input}
      />
      <View style={styles.row}>
        <TextInput
          value={plataforma}
          onChangeText={setPlataforma}
          placeholder="android / ios / web"
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="none"
          style={[styles.input, styles.flex]}
        />
        <Pressable
          disabled={busy || !nombre.trim() || !codigo.trim()}
          onPress={() => {
            void onSubmit({
              nombre: nombre.trim(),
              codigo: codigo.trim().toUpperCase(),
              plataforma: plataforma.trim() || "android",
            }).then(() => {
              setNombre("");
              setCodigo("");
              setPlataforma("");
            });
          }}
          style={styles.btn}
        >
          <Text style={styles.btnText}>Registrar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingTop: 8, gap: 6 },
  row: { flexDirection: "row", gap: 6 },
  flex: { flex: 1 },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: theme.colors.ink,
  },
  btn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  btnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
});
