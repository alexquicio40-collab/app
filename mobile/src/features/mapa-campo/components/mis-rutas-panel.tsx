import { RouteBriefBar } from "@/features/routes/components/route-brief-bar";
import { routePagoHint, routeRecogeHint } from "@/features/mapa-campo/lib/route-hints";
import { estadoLabel } from "@/features/routes/lib/format";
import { normalizeEstado } from "@/features/routes/lib/permissions";
import type { RouteItem } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type MisRutasPanelProps = {
  routes: RouteItem[];
  selectedId: string | null;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  /** Un solo CTA: inicia (pendiente) o reanuda navegación (en curso). */
  onStart: (route: RouteItem) => void;
  onFinalize?: (route: RouteItem) => void;
};

function canResume(route: RouteItem) {
  const estado = normalizeEstado(route.estado);
  return estado === "en_proceso" || estado === "en_ruta";
}

function isRutaActiva(route: RouteItem) {
  const estado = normalizeEstado(route.estado);
  return estado !== "completada" && estado !== "cancelada";
}

/** Panel inferior del mapa: rutas del día. Un solo botón Iniciar. */
export function MisRutasPanel({
  routes,
  selectedId,
  expanded,
  onToggle,
  onSelect,
  onStart,
  onFinalize,
}: MisRutasPanelProps) {
  const active = routes.filter(isRutaActiva);
  const pendientes = active.filter((r) => normalizeEstado(r.estado) === "pendiente").length;
  const enCurso = active.filter(canResume).length;
  const selected = active.find((r) => r.id === selectedId) ?? null;

  return (
    <View style={styles.wrap}>
      <Pressable onPress={onToggle} style={styles.head}>
        <Text style={styles.title} numberOfLines={1}>
          Rutas · {active.length}
          {pendientes || enCurso
            ? ` · ${pendientes} pend. · ${enCurso} curso`
            : ""}
        </Text>
        <Text style={styles.toggle}>{expanded ? "▾" : "▴"}</Text>
      </Pressable>

      {expanded ? (
        active.length === 0 ? (
          <Text style={styles.empty}>Sin rutas pendientes</Text>
        ) : (
          <View style={styles.body}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.row}
            >
              {active.map((route) => {
                const active = route.id === selectedId;
                const startable = route.estado === "pendiente" || canResume(route);
                const finishable = canResume(route);
                const pickup = routeRecogeHint(route);
                const pago = routePagoHint(route);

                return (
                  <Pressable
                    key={route.id}
                    onPress={() => onSelect(route.id)}
                    style={[styles.card, active ? styles.cardOn : null]}
                  >
                    <Text style={styles.orden} numberOfLines={1}>
                      {route.orden != null ? `#${route.orden}` : "—"} ·{" "}
                      {estadoLabel(route.estado)}
                    </Text>
                    <Text style={styles.name} numberOfLines={1}>
                      {route.localNombre}
                    </Text>
                    {pickup ? (
                      <Text style={styles.pickup} numberOfLines={1}>
                        Recogerás · {pickup}
                      </Text>
                    ) : null}
                    {pago ? (
                      <Text style={styles.pago} numberOfLines={1}>
                        Pagarás · {pago}
                      </Text>
                    ) : null}

                    <View style={styles.actions}>
                      {startable ? (
                        <Pressable
                          onPress={() => onStart(route)}
                          style={[styles.btn, styles.btnStart]}
                        >
                          <Text style={styles.btnStartText}>Iniciar</Text>
                        </Pressable>
                      ) : null}
                      {finishable && onFinalize ? (
                        <Pressable
                          onPress={() => onFinalize(route)}
                          style={[styles.btn, styles.btnEnd]}
                        >
                          <Text style={styles.btnEndText}>Fin</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {selected ? (
              <View style={styles.brief}>
                <RouteBriefBar route={selected} />
              </View>
            ) : null}
          </View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    paddingVertical: 6,
    gap: 4,
  },
  head: {
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 28,
  },
  title: { flex: 1, color: theme.colors.ink, fontSize: 12, fontWeight: "900" },
  toggle: { color: theme.colors.accent, fontSize: 12, fontWeight: "800" },
  empty: {
    paddingHorizontal: 12,
    paddingBottom: 6,
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  body: { gap: 8, paddingBottom: 6 },
  row: { gap: 8, paddingHorizontal: 10 },
  card: {
    width: 168,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  cardOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  orden: { color: theme.colors.muted, fontSize: 9, fontWeight: "800" },
  name: { color: theme.colors.ink, fontSize: 13, fontWeight: "900" },
  pickup: { color: theme.colors.accent, fontSize: 10, fontWeight: "700" },
  pago: { color: "#1B5E20", fontSize: 10, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 6, marginTop: 6 },
  btn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: 8,
  },
  btnStart: { backgroundColor: theme.colors.accent },
  btnStartText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  btnEnd: {
    backgroundColor: theme.colors.warnSoft,
    borderWidth: 1,
    borderColor: "#E8C9A0",
  },
  btnEndText: { color: theme.colors.warn, fontSize: 11, fontWeight: "800" },
  brief: {
    paddingHorizontal: 10,
    gap: 6,
  },
});
