import { estadoLabel } from "@/features/routes/lib/format";
import type { RouteItem } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type MisRutasPanelProps = {
  routes: RouteItem[];
  selectedId: string | null;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onNavigate: (route: RouteItem) => void;
  onStart?: (route: RouteItem) => void;
  onFinalize?: (route: RouteItem) => void;
};

/** Panel compacto: el mapa es el protagonista. */
export function MisRutasPanel({
  routes,
  selectedId,
  expanded,
  onToggle,
  onSelect,
  onNavigate,
  onStart,
  onFinalize,
}: MisRutasPanelProps) {
  const pendientes = routes.filter((r) => r.estado === "pendiente").length;
  const enCurso = routes.filter(
    (r) => r.estado === "en_proceso" || r.estado === "en_ruta",
  ).length;

  return (
    <View style={styles.wrap}>
      <Pressable onPress={onToggle} style={styles.head}>
        <Text style={styles.title} numberOfLines={1}>
          Rutas · {routes.length}
          {pendientes || enCurso
            ? ` · ${pendientes} pend. · ${enCurso} curso`
            : ""}
        </Text>
        <Text style={styles.toggle}>{expanded ? "▾" : "▴"}</Text>
      </Pressable>

      {expanded ? (
        routes.length === 0 ? (
          <Text style={styles.empty}>Sin rutas hoy</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {routes.map((route) => {
              const active = route.id === selectedId;
              const canStart = route.estado === "pendiente";
              const canFinish =
                route.estado === "en_proceso" || route.estado === "en_ruta";
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
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => onNavigate(route)}
                      style={[styles.btn, styles.btnNav]}
                    >
                      <Text style={styles.btnNavText}>Nav</Text>
                    </Pressable>
                    {canStart && onStart ? (
                      <Pressable
                        onPress={() => onStart(route)}
                        style={[styles.btn, styles.btnStart]}
                      >
                        <Text style={styles.btnStartText}>Iniciar</Text>
                      </Pressable>
                    ) : null}
                    {canFinish && onFinalize ? (
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
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    paddingVertical: 6,
    gap: 4,
  },
  head: {
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 28,
  },
  title: { color: theme.colors.ink, fontSize: 12, fontWeight: "900" },
  toggle: { color: theme.colors.accent, fontSize: 12, fontWeight: "800" },
  empty: {
    paddingHorizontal: 10,
    paddingBottom: 4,
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  row: { gap: 6, paddingHorizontal: 8, paddingBottom: 4 },
  card: {
    width: 148,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
  },
  cardOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  orden: { color: theme.colors.muted, fontSize: 9, fontWeight: "800" },
  name: { color: theme.colors.ink, fontSize: 12, fontWeight: "900" },
  actions: { flexDirection: "row", gap: 4, marginTop: 4 },
  btn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  btnNav: { backgroundColor: theme.colors.accent },
  btnNavText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  btnStart: { backgroundColor: theme.colors.goldSoft },
  btnStartText: { color: theme.colors.gold, fontSize: 10, fontWeight: "800" },
  btnEnd: { backgroundColor: theme.colors.warnSoft },
  btnEndText: { color: theme.colors.warn, fontSize: 10, fontWeight: "800" },
});
