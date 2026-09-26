import { RouteBriefBar } from "@/features/routes/components/route-brief-bar";
import { routePagoHint, routeRecogeHint } from "@/features/mapa-campo/lib/route-hints";
import { estadoLabel } from "@/features/routes/lib/format";
import { asEstado, isCerrado, isEnCurso, isRecolectado } from "@/features/routes/lib/estados-recojo";
import type { RouteItem } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { useRef } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type MisRutasPanelProps = {
  routes: RouteItem[];
  selectedId: string | null;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onOpen: (route: RouteItem) => void;
};

function isRutaActiva(route: RouteItem) {
  return !isRecolectado(route.estado) && !isCerrado(route.estado);
}

/** Listado inferior del mapa. Un toque selecciona; doble toque abre el detalle. */
export function MisRutasPanel({
  routes,
  selectedId,
  expanded,
  onToggle,
  onSelect,
  onOpen,
}: MisRutasPanelProps) {
  const lastTap = useRef<{ id: string; at: number } | null>(null);

  const pressRoute = (route: RouteItem) => {
    const now = Date.now();
    const prev = lastTap.current;
    if (prev && prev.id === route.id && now - prev.at < 320) {
      lastTap.current = null;
      onOpen(route);
      return;
    }
    lastTap.current = { id: route.id, at: now };
    onSelect(route.id);
  };

  const active = routes.filter(isRutaActiva);
  const pendientes = active.filter((item) => asEstado(item.estado) === "programado").length;
  const enCurso = active.filter((item) => isEnCurso(item.estado)).length;
  const selected = active.find((item) => item.id === selectedId) ?? null;

  return (
    <View style={styles.wrap}>
      <Pressable onPress={onToggle} style={styles.head}>
        <Text style={styles.title} numberOfLines={1}>
          Rutas · {active.length}
          {pendientes || enCurso ? ` · ${pendientes} pend. · ${enCurso} curso` : ""}
        </Text>
        <Text style={styles.toggle}>{expanded ? "▾" : "▴"}</Text>
      </Pressable>

      {expanded ? (
        active.length === 0 ? (
          <Text style={styles.empty}>Sin rutas pendientes</Text>
        ) : (
          <View style={styles.body}>
            <Text style={styles.hint}>Doble toque abre el detalle</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.row}
            >
              {active.map((route) => {
                const on = route.id === selectedId;
                const pickup = routeRecogeHint(route);
                const pago = routePagoHint(route);

                return (
                  <Pressable
                    key={route.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${route.localNombre}. Doble toque para el detalle`}
                    onPress={() => pressRoute(route)}
                    {...(Platform.OS === "web"
                      ? { onDoubleClick: () => onOpen(route) }
                      : null)}
                    style={[styles.card, on ? styles.cardOn : null]}
                  >
                    <Text style={styles.orden} numberOfLines={1}>
                      {route.orden != null ? `#${route.orden}` : "—"} · {estadoLabel(route.estado)}
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
  hint: { paddingHorizontal: 12, color: theme.colors.muted, fontSize: 10, fontWeight: "700" },
  empty: {
    paddingHorizontal: 12,
    paddingBottom: 6,
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  body: { gap: 6, paddingBottom: 6 },
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
  brief: { paddingHorizontal: 10 },
});
