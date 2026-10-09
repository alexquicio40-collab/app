import { fetchLocalesLite } from "@/features/locales/api";
import { emptyPermisosMenu } from "@/features/usuarios/api";
import { FINALIZACION_FLAGS, MENU_MODULOS } from "@/features/usuarios/lib/roles";
import type {
  MenuModuloKey,
  PermisosMenu,
  UsuarioItem,
  UsuarioPermisosInput,
} from "@/features/usuarios/types";
import { GhostButton, PrimaryButton } from "@/features/routes/assign/components/form-kit";
import { theme } from "@/lib/theme";
import { useEffect, useMemo, useState } from "react";
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

type UsuarioPermisosSheetProps = {
  open: boolean;
  user: UsuarioItem | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (input: UsuarioPermisosInput) => Promise<void>;
};

export function UsuarioPermisosSheet({
  open,
  user,
  saving = false,
  onClose,
  onSave,
}: UsuarioPermisosSheetProps) {
  const insets = useSafeAreaInsets();
  const [permisos, setPermisos] = useState<PermisosMenu>(emptyPermisosMenu);
  const [localesIds, setLocalesIds] = useState<string[]>([]);
  const [locales, setLocales] = useState<{ id: string; nombre: string }[]>([]);
  const [flags, setFlags] = useState({
    requiereLitraje: false,
    requiereBaldesVacios: false,
    requiereGalonerasVacias: false,
    requiereFotoGuia: false,
    requiereFotoMercaderia: false,
    requiereNotas: false,
  });

  useEffect(() => {
    if (!open || !user) return;
    setPermisos({ ...emptyPermisosMenu(), ...user.permisosMenu });
    setLocalesIds(user.localesIds ?? []);
    setFlags({
      requiereLitraje: user.requiereLitraje,
      requiereBaldesVacios: user.requiereBaldesVacios,
      requiereGalonerasVacias: user.requiereGalonerasVacias,
      requiereFotoGuia: user.requiereFotoGuia,
      requiereFotoMercaderia: user.requiereFotoMercaderia,
      requiereNotas: user.requiereNotas,
    });
    void fetchLocalesLite()
      .then((rows) => setLocales(rows.map((item) => ({ id: item.id, nombre: item.nombre }))))
      .catch(() => setLocales([]));
  }, [open, user]);

  const groups = useMemo(() => {
    const map = new Map<string, { key: MenuModuloKey; label: string; group: string }[]>();
    for (const item of MENU_MODULOS) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return [...map.entries()];
  }, []);

  const setGroup = (group: string, value: boolean) => {
    setPermisos((prev) => {
      const next = { ...prev };
      for (const item of MENU_MODULOS) {
        if (item.group === group) next[item.key] = value;
      }
      return next;
    });
  };

  const toggle = (key: MenuModuloKey) => {
    setPermisos((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!open || !user) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={styles.title}>Permisos</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {user.nombre}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {groups.map(([group, items]) => (
              <View key={group} style={styles.group}>
                <View style={styles.groupHead}>
                  <Text style={styles.groupTitle}>{group}</Text>
                  <View style={styles.groupActions}>
                    <Pressable onPress={() => setGroup(group, true)}>
                      <Text style={styles.link}>Todo</Text>
                    </Pressable>
                    <Pressable onPress={() => setGroup(group, false)}>
                      <Text style={styles.linkMuted}>Nada</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.chips}>
                  {items.map((item) => {
                    const on = permisos[item.key];
                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => toggle(item.key)}
                        style={[styles.chip, on ? styles.chipOn : null]}
                      >
                        <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>
                          {on ? "●" : "○"} {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

            <View style={styles.group}>
              <View style={styles.groupHead}>
                <Text style={styles.groupTitle}>Locales visibles</Text>
                <View style={styles.groupActions}>
                  <Pressable onPress={() => setLocalesIds(locales.map((item) => item.id))}>
                    <Text style={styles.link}>Todo</Text>
                  </Pressable>
                  <Pressable onPress={() => setLocalesIds([])}>
                    <Text style={styles.linkMuted}>Nada</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={styles.note}>
                Si no marcas ninguno, no hay restricción extra. Marca sólo los locales que este
                usuario puede ver.
              </Text>
              <View style={styles.chips}>
                {locales.map((item) => {
                  const on = localesIds.includes(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() =>
                        setLocalesIds((prev) =>
                          on ? prev.filter((id) => id !== item.id) : [...prev, item.id],
                        )
                      }
                      style={[styles.chip, on ? styles.chipOn : null]}
                    >
                      <Text style={[styles.chipText, on ? styles.chipTextOn : null]} numberOfLines={1}>
                        {on ? "●" : "○"} {item.nombre}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.group}>
              <Text style={styles.groupTitle}>Finalización de ruta</Text>
              {user.rol !== "operador" ? (
                <Text style={styles.note}>
                  Este usuario no es operador; igual puedes configurar los flags.
                </Text>
              ) : null}
              <View style={styles.chips}>
                {FINALIZACION_FLAGS.map((flag) => {
                  const on = flags[flag.key];
                  return (
                    <Pressable
                      key={flag.key}
                      onPress={() => setFlags((prev) => ({ ...prev, [flag.key]: !on }))}
                      style={[styles.chip, on ? styles.chipOn : null]}
                    >
                      <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>
                        {on ? "●" : "○"} {flag.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.actions}>
              <View style={styles.half}>
                <PrimaryButton
                  label="Guardar permisos"
                  onPress={() =>
                    void onSave({
                      permisosMenu: permisos,
                      localesIds,
                      ...flags,
                    })
                  }
                  loading={saving}
                />
              </View>
              <View style={styles.half}>
                <GhostButton label="Cancelar" onPress={onClose} />
              </View>
            </View>
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
    gap: 8,
  },
  headCopy: { flex: 1, minWidth: 0 },
  title: { color: theme.colors.ink, fontSize: 16, fontWeight: "800" },
  subtitle: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  close: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.cream,
  },
  closeText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  body: { gap: 14, paddingBottom: 20 },
  group: { gap: 8 },
  groupHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupTitle: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  groupActions: { flexDirection: "row", gap: 10 },
  link: { color: theme.colors.accent, fontSize: 11, fontWeight: "800" },
  linkMuted: { color: theme.colors.muted, fontSize: 11, fontWeight: "700" },
  note: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
  },
  chipOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  chipText: { color: theme.colors.muted, fontSize: 11, fontWeight: "700" },
  chipTextOn: { color: theme.colors.accent },
  actions: { flexDirection: "row", gap: 8 },
  half: { flex: 1 },
});
