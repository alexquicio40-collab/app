import { inicialNombre } from "@/features/usuarios/lib/filters";
import { rolLabel, rolTone } from "@/features/usuarios/lib/roles";
import type { UsuarioItem } from "@/features/usuarios/types";
import {
  ActionIconButton,
  RouteActionBar,
  TrashIcon,
} from "@/features/routes/components/route-action-bar";
import { theme } from "@/lib/theme";
import { StyleSheet, Switch, Text, View } from "react-native";

type UsuarioCardProps = {
  user: UsuarioItem;
  onEdit: () => void;
  onPermisos: () => void;
  onDelete: () => void;
  onToggleActivo: () => void;
};

/** Activo/inactivo solo con el interruptor; editar solo con el botón. */
export function UsuarioCard({
  user,
  onEdit,
  onPermisos,
  onDelete,
  onToggleActivo,
}: UsuarioCardProps) {
  const tone = rolTone(user.rol);

  return (
    <View style={[styles.card, !user.activo ? styles.cardOff : null]}>
      <View style={styles.head}>
        <View style={[styles.avatar, { backgroundColor: `${tone}22` }]}>
          <Text style={[styles.avatarText, { color: tone }]}>{inicialNombre(user.nombre)}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={1}>
            {user.nombre}
          </Text>
          <Text style={styles.login} numberOfLines={1}>
            @{user.usuario || "sin-login"}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${tone}18`, borderColor: `${tone}44` }]}>
          <Text style={[styles.badgeText, { color: tone }]}>{rolLabel(user.rol)}</Text>
        </View>
      </View>

      {user.dni || user.placa ? (
        <Text style={styles.meta} numberOfLines={1}>
          {[user.dni ? `DNI ${user.dni}` : null, user.placa ? `Placa ${user.placa}` : null]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <RouteActionBar>
          <ActionIconButton label="Permisos" glyph="☰" tone="accent" onPress={onPermisos} />
          <ActionIconButton label="Editar" glyph="✎" tone="accent" onPress={onEdit} />
          <ActionIconButton
            label="Eliminar"
            tone="danger"
            icon={<TrashIcon />}
            onPress={onDelete}
          />
        </RouteActionBar>

        <View style={styles.switchWrap}>
          <Text style={styles.switchLabel}>{user.activo ? "Activo" : "Inactivo"}</Text>
          <Switch
            value={user.activo}
            onValueChange={onToggleActivo}
            trackColor={{ false: theme.colors.line, true: theme.colors.accentSoft }}
            thumbColor={user.activo ? theme.colors.accent : "#f4f3f4"}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    gap: 8,
  },
  cardOff: { opacity: 0.72 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "900" },
  copy: { flex: 1, minWidth: 0, gap: 1 },
  name: { color: theme.colors.ink, fontSize: 14, fontWeight: "800" },
  login: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: "800" },
  meta: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  switchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  switchLabel: { color: theme.colors.muted, fontSize: 10, fontWeight: "700" },
});
