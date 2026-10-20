import { checkUsuarioExists, defaultFormFromUser } from "@/features/usuarios/api";
import { esRolCampo, FINALIZACION_FLAGS, ROL_OPTIONS, vinculoOptions } from "@/features/usuarios/lib/roles";
import type { UsuarioFormInput, UsuarioItem } from "@/features/usuarios/types";
import {
  FieldLabel,
  FieldRow,
  GhostButton,
  PrimaryButton,
  SelectField,
  TextField,
} from "@/features/routes/assign/components/form-kit";
import { theme } from "@/lib/theme";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type UsuarioFormSheetProps = {
  open: boolean;
  user: UsuarioItem | null;
  usuarios?: UsuarioItem[];
  saving?: boolean;
  onClose: () => void;
  onSave: (input: UsuarioFormInput) => Promise<void>;
};

export function UsuarioFormSheet({
  open,
  user,
  usuarios = [],
  saving = false,
  onClose,
  onSave,
}: UsuarioFormSheetProps) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<UsuarioFormInput>(defaultFormFromUser);
  const [error, setError] = useState<string | null>(null);
  const [loginHint, setLoginHint] = useState<string | null>(null);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patch = useCallback((next: Partial<UsuarioFormInput>) => {
    setForm((prev) => ({ ...prev, ...next }));
  }, []);

  useEffect(() => {
    if (!open) return;
    setForm(defaultFormFromUser(user));
    setError(null);
    setLoginHint(null);
  }, [open, user]);

  useEffect(() => {
    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
  }, []);

  const onUsuarioChange = (usuario: string) => {
    patch({ usuario });
    setLoginHint(null);
    if (checkTimer.current) clearTimeout(checkTimer.current);
    const trimmed = usuario.trim();
    if (trimmed.length < 2) return;
    checkTimer.current = setTimeout(() => {
      void checkUsuarioExists(trimmed, user?.id).then((exists) => {
        setLoginHint(exists ? "Este usuario ya está en uso" : "Usuario disponible");
      });
    }, 300);
  };

  const submit = async () => {
    const nombre = form.nombre.trim();
    const usuario = form.usuario.trim();
    if (nombre.length < 2 || usuario.length < 2) {
      setError("Nombre y usuario son obligatorios (mín. 2)");
      return;
    }
    if (!user && (!form.password || form.password.trim().length < 6)) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (user && form.password && form.password.trim().length > 0 && form.password.trim().length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (loginHint === "Este usuario ya está en uso") {
      setError("Elige otro nombre de usuario");
      return;
    }

    setError(null);
    await onSave({
      ...form,
      nombre,
      usuario,
      /** Crear siempre activo; editar conserva el valor del interruptor de la lista. */
      activo: user ? user.activo : true,
      password: form.password?.trim() || undefined,
      dni: esRolCampo(form.rol) ? form.dni : "",
      placa: esRolCampo(form.rol) ? form.placa : "",
      vinculadoUsuarioId: esRolCampo(form.rol) ? form.vinculadoUsuarioId : "",
    });
  };

  if (!open) return null;

  const isCampo = esRolCampo(form.rol);
  const vinculoLista = vinculoOptions(usuarios, user?.id);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <Text style={styles.title}>{user ? "Editar usuario" : "Nuevo usuario"}</Text>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.field}>
              <FieldLabel>Nombre *</FieldLabel>
              <TextField
                value={form.nombre}
                onChangeText={(nombre) => patch({ nombre })}
                placeholder="Nombre completo…"
              />
            </View>

            <FieldRow>
              <View style={styles.half}>
                <FieldLabel>Usuario (login) *</FieldLabel>
                <TextField
                  value={form.usuario}
                  onChangeText={onUsuarioChange}
                  placeholder="login…"
                />
                {loginHint ? (
                  <Text
                    style={[
                      styles.hint,
                      loginHint.includes("uso") ? styles.hintBad : styles.hintOk,
                    ]}
                  >
                    {loginHint}
                  </Text>
                ) : null}
              </View>
              <View style={styles.half}>
                <FieldLabel>{user ? "Nueva clave" : "Contraseña *"}</FieldLabel>
                <TextField
                  value={form.password ?? ""}
                  onChangeText={(password) => patch({ password })}
                  placeholder={user ? "Opcional…" : "Mín. 6"}
                  secureTextEntry
                />
              </View>
            </FieldRow>

            <SelectField
              label="Rol"
              value={form.rol}
              placeholder="Rol…"
              options={ROL_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
              onChange={(rol) => patch({ rol: rol || "operador" })}
            />

            {isCampo ? (
              <SelectField
                label="Vincular operador o chofer"
                value={form.vinculadoUsuarioId ?? ""}
                placeholder="Seleccionar…"
                searchable
                options={vinculoLista}
                onChange={(vinculadoUsuarioId) =>
                  patch({ vinculadoUsuarioId: vinculadoUsuarioId ?? "" })
                }
              />
            ) : null}

            {isCampo ? (
              <FieldRow>
                <View style={styles.half}>
                  <FieldLabel>DNI</FieldLabel>
                  <TextField
                    value={form.dni ?? ""}
                    onChangeText={(dni) => patch({ dni })}
                    placeholder="Documento…"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.half}>
                  <FieldLabel>Placa</FieldLabel>
                  <TextField
                    value={form.placa ?? ""}
                    onChangeText={(placa) => patch({ placa })}
                    placeholder="ABC-123"
                  />
                </View>
              </FieldRow>
            ) : null}

            {isCampo ? (
              <View style={styles.flags}>
                <Text style={styles.flagsTitle}>Requeridos al finalizar ruta</Text>
                <View style={styles.flagGrid}>
                  {FINALIZACION_FLAGS.map((flag) => {
                    const on = Boolean(form[flag.key]);
                    return (
                      <Pressable
                        key={flag.key}
                        onPress={() => patch({ [flag.key]: !on })}
                        style={[styles.flag, on ? styles.flagOn : null]}
                      >
                        <Text style={[styles.flagText, on ? styles.flagTextOn : null]}>
                          {on ? "●" : "○"} {flag.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <FieldRow>
              <View style={styles.half}>
                <PrimaryButton
                  label={user ? "Guardar cambios" : "Crear usuario"}
                  onPress={() => void submit()}
                  loading={saving}
                />
              </View>
              <View style={styles.half}>
                <GhostButton label="Cancelar" onPress={onClose} />
              </View>
            </FieldRow>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  dismiss: { flex: 0.08 },
  sheet: {
    flex: 1,
    maxHeight: "92%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 8,
    ...Platform.select({
      web: { maxWidth: 560, width: "100%", alignSelf: "center" },
      default: {},
    }),
  },
  handle: {
    alignSelf: "center",
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
    marginBottom: 6,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: { color: theme.colors.ink, fontSize: 16, fontWeight: "800" },
  close: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.cream,
  },
  closeText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  body: { gap: 10, paddingBottom: 16 },
  field: { gap: 3 },
  half: { flex: 1, minWidth: 0, gap: 3 },
  hint: { fontSize: 10, fontWeight: "700" },
  hintOk: { color: theme.colors.accent },
  hintBad: { color: theme.colors.danger },
  flags: { gap: 6 },
  flagsTitle: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  flagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  flag: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
  },
  flagOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  flagText: { color: theme.colors.muted, fontSize: 11, fontWeight: "700" },
  flagTextOn: { color: theme.colors.accent },
  error: { color: theme.colors.danger, fontSize: 12, fontWeight: "700" },
});
