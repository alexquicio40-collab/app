import { ActionIconButton, RouteActionBar, TrashIcon } from "@/features/routes/components/route-action-bar";
import { certLabel, certTone } from "@/features/locales/lib/format";
import type { LocalItem } from "@/features/locales/types";
import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

type LocalCardProps = {
  local: LocalItem;
  canManage: boolean;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function LocalCard({ local, canManage, onOpen, onEdit, onDelete }: LocalCardProps) {
  const tone = TONE[certTone(local.necesitaCertificacion)];

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [styles.main, pressed ? styles.pressed : null]}
      >
        <View style={styles.head}>
          <Text style={styles.title} numberOfLines={1}>
            {local.nombre}
          </Text>
          <View style={[styles.badge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.badgeText, { color: tone.fg }]} numberOfLines={1}>
              {certLabel(local.necesitaCertificacion, local.estadoCertificacion)}
            </Text>
          </View>
        </View>

        {local.direccion ? (
          <Text style={styles.address} numberOfLines={2}>
            {local.direccion}
          </Text>
        ) : (
          <Text style={styles.meta}>Sin dirección</Text>
        )}

        <Text style={styles.meta} numberOfLines={1}>
          {[
            local.ruc ? `RUC ${local.ruc}` : null,
            local.encargadoNombre || null,
            local.frecuencias.length ? local.frecuencias.join(" · ") : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Sin datos extra"}
        </Text>
      </Pressable>

      {canManage ? (
        <RouteActionBar>
          {onEdit ? (
            <ActionIconButton label="Editar" glyph="✎" tone="accent" onPress={onEdit} />
          ) : null}
          {onDelete ? (
            <ActionIconButton label="Eliminar" tone="danger" icon={<TrashIcon />} onPress={onDelete} />
          ) : null}
        </RouteActionBar>
      ) : null}
    </View>
  );
}

const TONE = {
  needs: { fg: theme.colors.gold, bg: theme.colors.goldSoft },
  none: { fg: theme.colors.danger, bg: theme.colors.dangerSoft },
} as const;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  main: { gap: 3 },
  pressed: { opacity: 0.92 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    flex: 1,
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  badge: {
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    maxWidth: 110,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  address: {
    color: theme.colors.muted,
    fontSize: 11,
    lineHeight: 14,
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "600",
  },
});
