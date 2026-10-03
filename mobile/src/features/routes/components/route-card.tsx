import { ActionIconButton, RouteActionBar, TrashIcon } from "@/features/routes/components/route-action-bar";
import { StatusBadge } from "@/features/routes/components/status-badge";
import {
  canArriveRoute,
  canChangeStatus,
  canCloseRoute,
  canDeleteRoute,
  canEditRoute,
  canFinalizeRoute,
  canReprogramRoute,
  canSkipCollection,
  canStartRoute,
  isActionableRoute,
} from "@/features/routes/lib/permissions";
import { formatDate } from "@/features/routes/lib/format";
import type { RouteItem } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type RouteCardActions = {
  onOpen: () => void;
  onEdit?: () => void;
  onChangeStatus?: () => void;
  onDelete?: () => void;
  onStart?: () => void;
  onArrive?: () => void;
  onFinalize?: () => void;
  onSkip?: () => void;
  onReprogram?: () => void;
  onCloseRoute?: () => void;
};

type RouteCardProps = {
  route: RouteItem;
  actions: RouteCardActions;
};

export function RouteCard({ route, actions }: RouteCardProps) {
  const actionable = isActionableRoute(route);
  const showEdit = actionable && canEditRoute(route) && Boolean(actions.onEdit);
  const showStatus = actionable && canChangeStatus(route) && Boolean(actions.onChangeStatus);
  const showDelete = actionable && canDeleteRoute(route) && Boolean(actions.onDelete);
  const showStart = canStartRoute(route) && Boolean(actions.onStart);
  const showArrive = canArriveRoute(route) && Boolean(actions.onArrive);
  const showFinalize = canFinalizeRoute(route) && Boolean(actions.onFinalize);
  const showSkip = canSkipCollection(route) && Boolean(actions.onSkip);
  const showReprogram = canReprogramRoute(route) && Boolean(actions.onReprogram);
  const showClose = canCloseRoute(route) && Boolean(actions.onCloseRoute);
  const hasActions =
    showEdit ||
    showStatus ||
    showDelete ||
    showStart ||
    showArrive ||
    showFinalize ||
    showSkip ||
    showReprogram ||
    showClose;

  const hasQty =
    route.estado === "recolectado" && (route.litraje || route.baldesVacios || route.galonerasVacias);

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver ruta ${route.localNombre}`}
        onPress={actions.onOpen}
        style={({ pressed }) => [styles.main, pressed ? styles.pressed : null]}
      >
        <View style={styles.head}>
          <Text style={styles.title} numberOfLines={1}>
            {route.localNombre}
          </Text>
          <StatusBadge estado={route.estado} compact />
        </View>

        <Text style={styles.meta} numberOfLines={1}>
          #{route.id} · {route.conductorNombre} · {formatDate(route.fechaAsignacion)}
          {route.orden != null ? ` · #${route.orden}` : ""}
        </Text>

        {route.creadoPorNombre || route.editadoPorNombre ? (
          <Text style={styles.assign} numberOfLines={1}>
            {route.creadoPorNombre ? `Asignó ${route.creadoPorNombre}` : ""}
            {route.creadoPorNombre && route.editadoPorNombre ? " · " : ""}
            {route.editadoPorNombre ? `Editó ${route.editadoPorNombre}` : ""}
          </Text>
        ) : null}

        {route.localDireccion ? (
          <Text style={styles.address} numberOfLines={1}>
            {route.localDireccion}
          </Text>
        ) : null}

        {hasQty ? (
          <Text style={styles.qty} numberOfLines={1}>
            {[
              route.litraje ? `${route.litraje} L` : null,
              route.baldesVacios ? `${route.baldesVacios} baldes` : null,
              route.galonerasVacias ? `${route.galonerasVacias} gal.` : null,
              route.fotoGuia || route.fotoMercaderia || route.fotoPago ? "fotos" : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        ) : route.fotoGuia || route.fotoMercaderia || route.fotoPago ? (
          <Text style={styles.qty}>fotos</Text>
        ) : null}

        {(route.cantidadEnvases ||
          route.cantidadBidonesAzules ||
          route.cantidadBidonesBlancos ||
          route.metodosPago.length > 0) &&
        route.estado !== "recolectado" ? (
          <Text style={styles.pickup} numberOfLines={1}>
            {[
              route.tipoEnvase || null,
              route.cantidadEnvases ? `${route.cantidadEnvases} env.` : null,
              route.cantidadBidonesAzules ? `${route.cantidadBidonesAzules} azules` : null,
              route.cantidadBidonesBlancos ? `${route.cantidadBidonesBlancos} blancos` : null,
              route.metodosPago.length
                ? route.metodosPago.map((m) => m.nombre).join("/")
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        ) : null}
      </Pressable>

      {hasActions ? (
        <RouteActionBar>
          {showStart ? (
            <ActionIconButton label="En ruta" glyph="▶" tone="accent" onPress={actions.onStart!} />
          ) : null}
          {showArrive ? (
            <ActionIconButton label="Llegué" glyph="◎" tone="info" onPress={actions.onArrive!} />
          ) : null}
          {showFinalize ? (
            <ActionIconButton label="Recolectar" glyph="✓" tone="info" onPress={actions.onFinalize!} />
          ) : null}
          {showSkip ? (
            <ActionIconButton label="No recojo" glyph="✕" tone="danger" onPress={actions.onSkip!} />
          ) : null}
          {showReprogram ? (
            <ActionIconButton label="Reprogramar" glyph="↻" tone="accent" onPress={actions.onReprogram!} />
          ) : null}
          {showEdit ? (
            <ActionIconButton label="Editar" glyph="✎" tone="accent" onPress={actions.onEdit!} />
          ) : null}
          {showClose ? (
            <ActionIconButton label="Cerrar" glyph="⊘" tone="muted" onPress={actions.onCloseRoute!} />
          ) : null}
          {showStatus ? (
            <ActionIconButton
              label="Cambiar estado"
              glyph="↻"
              tone="info"
              onPress={actions.onChangeStatus!}
            />
          ) : null}
          {showDelete ? (
            <ActionIconButton
              label="Eliminar"
              tone="danger"
              icon={<TrashIcon />}
              onPress={actions.onDelete!}
            />
          ) : null}
        </RouteActionBar>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  main: {
    gap: 2,
  },
  pressed: {
    opacity: 0.92,
  },
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
  meta: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "600",
  },
  assign: {
    color: theme.colors.ink,
    fontSize: 10,
    fontWeight: "700",
  },
  address: {
    color: theme.colors.muted,
    fontSize: 10,
    lineHeight: 13,
  },
  qty: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
  pickup: {
    color: theme.colors.info,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
});
