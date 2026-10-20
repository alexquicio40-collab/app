import { portadaLocal } from "@/features/locales/api";
import { LocalPortada } from "@/features/locales/components/local-portada";
import { ActionIconButton, RouteActionBar, TrashIcon } from "@/features/routes/components/route-action-bar";
import { certLabel, certTone } from "@/features/locales/lib/format";
import { canSeePrecios, formatPrecios } from "@/features/locales/lib/precios";
import { prioridadMeta } from "@/features/locales/lib/prioridad";
import type { LocalItem } from "@/features/locales/types";
import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

type LocalCardProps = {
  local: LocalItem;
  canManage: boolean;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  readonly?: boolean;
};

export function LocalCard({
  local,
  canManage,
  onOpen,
  onEdit,
  onDelete,
  readonly = false,
}: LocalCardProps) {
  const tone = TONE[certTone(local.necesitaCertificacion)];
  const prioridad = prioridadMeta(local.prioridad);

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [styles.main, pressed ? styles.pressed : null]}
      >
        <View style={styles.row}>
        <LocalPortada uri={portadaLocal(local)} size={48} radius={10} />
        <View style={styles.body}>
        <View style={styles.head}>
          <Text style={styles.title} numberOfLines={1}>
            {local.nombre}
          </Text>
          <View style={[styles.dot, { backgroundColor: prioridad.color }]} />
          <View style={[styles.badge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.badgeText, { color: tone.fg }]} numberOfLines={1}>
              {certLabel(local.necesitaCertificacion, local.estadoCertificacion)}
            </Text>
          </View>
        </View>
        {readonly ? (
          <View style={styles.readonlyBadge}>
            <Text style={styles.readonlyBadgeText}>
              Solo consulta{local.asesorBioClim ? ` · ${local.asesorBioClim}` : ""}
            </Text>
          </View>
        ) : local.restringido ? (
          <View style={styles.restrictBadge}>
            <Text style={styles.restrictBadgeText}>Local restringido</Text>
          </View>
        ) : null}

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

        {canSeePrecios(local, canManage) ? (
          <Text style={styles.price} numberOfLines={1}>
            {formatPrecios(local)}
            {canManage && !local.operadoresVenPrecio ? " · oculto" : ""}
          </Text>
        ) : null}
        </View>
        </View>
      </Pressable>

      {onEdit || onDelete ? (
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
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  body: { flex: 1, minWidth: 0, gap: 3 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 10,
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
  restrictBadge: {
    alignSelf: "flex-start",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: theme.colors.dangerSoft,
  },
  restrictBadgeText: {
    color: theme.colors.danger,
    fontSize: 9,
    fontWeight: "800",
  },
  readonlyBadge: {
    alignSelf: "flex-start",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: theme.colors.infoSoft,
  },
  readonlyBadgeText: {
    color: theme.colors.info,
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
  price: {
    color: theme.colors.ink,
    fontSize: 10,
    fontWeight: "800",
  },
});
