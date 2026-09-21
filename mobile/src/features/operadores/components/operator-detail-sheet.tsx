import {
  hasPagarasInfo,
  PagarasPanel,
} from "@/features/routes/components/pagaras-panel";
import {
  hasRecogeraInfo,
  RecogerasPanel,
} from "@/features/routes/components/recogeras-panel";
import { theme } from "@/lib/theme";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { OperatorDetailState, OperatorRouteDetail } from "../types";
import { OperatorActionButtons } from "./operator-action-buttons";

type OperatorDetailSheetProps = {
  open: boolean;
  loading: boolean;
  detail: OperatorDetailState | null;
  isAdmin: boolean;
  timeAgo: (value: string) => string;
  onClose: () => void;
  onShare: (route: OperatorRouteDetail) => void;
  onCall: (phone: string) => void;
  onNavigate: (route: OperatorRouteDetail) => void;
};

export function OperatorDetailSheet({
  open,
  loading,
  detail,
  isAdmin,
  timeAgo,
  onClose,
  onShare,
  onCall,
  onNavigate,
}: OperatorDetailSheetProps) {
  const insets = useSafeAreaInsets();
  if (!open || !detail) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={styles.kicker}>
                {detail.onRoute ? "En ruta" : "En línea"} · {Math.round(detail.speed)} km/h
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {detail.operatorName}
              </Text>
              <Text style={styles.meta}>{timeAgo(detail.timestamp)}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text style={styles.loadingText}>Cargando rutas activas…</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              {!detail.routes.length ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>Sin rutas en progreso</Text>
                  <Text style={styles.emptyCopy}>
                    Este operador no tiene una ruta activa en este momento.
                  </Text>
                </View>
              ) : (
                detail.routes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isAdmin={isAdmin}
                    onShare={() => onShare(route)}
                    onCall={() => onCall(route.encargadoTelefono || route.asesorTelefono)}
                    onNavigate={() => onNavigate(route)}
                  />
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function RouteCard({
  route,
  isAdmin,
  onShare,
  onCall,
  onNavigate,
}: {
  route: OperatorRouteDetail;
  isAdmin: boolean;
  onShare: () => void;
  onCall: () => void;
  onNavigate: () => void;
}) {
  const estado =
    route.estado === "en_proceso"
      ? "En proceso"
      : route.estado === "en_ruta"
        ? "En ruta"
        : route.estado;

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.cardCopy}>
          <Text style={styles.local} numberOfLines={2}>
            {route.localNombre}
          </Text>
          <View style={styles.estadoPill}>
            <Text style={styles.estadoText}>{estado}</Text>
          </View>
        </View>
      </View>

      {hasRecogeraInfo(route) ? <RecogerasPanel route={route} compact /> : null}
      {hasPagarasInfo(route.metodosPago) ? (
        <PagarasPanel metodos={route.metodosPago} compact />
      ) : null}

      {isAdmin ? (
        <OperatorActionButtons onShare={onShare} onCall={onCall} onNavigate={onNavigate} />
      ) : null}

      <InfoGrid
        pairs={[
          { label: "Horario", value: route.horario },
          {
            label: "Certificación",
            value: route.necesitaCertificacion ? "Necesita" : "No necesita",
          },
          { label: "Dirección", value: route.localDireccion || "—" },
          {
            label: "Coordenadas",
            value:
              route.latitud != null && route.longitud != null
                ? `${route.latitud.toFixed(5)}, ${route.longitud.toFixed(5)}`
                : "—",
          },
          {
            label: "Asesor",
            value: [route.asesorNombre, route.asesorTelefono].filter(Boolean).join(" · ") || "—",
          },
          {
            label: "Encargado",
            value:
              [route.encargadoNombre, route.encargadoTelefono].filter(Boolean).join(" · ") || "—",
          },
          { label: "Referencia", value: route.referencia || "Sin referencia" },
        ]}
      />

      {route.fotos.length ? (
        <Text style={styles.fotos}>{route.fotos.length} foto(s) del local</Text>
      ) : null}
    </View>
  );
}

function InfoGrid({ pairs }: { pairs: { label: string; value: string }[] }) {
  return (
    <View style={styles.grid}>
      {pairs.map((item) => (
        <View key={item.label} style={styles.pair}>
          <Text style={styles.pairLabel}>{item.label}</Text>
          <Text style={styles.pairValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  dismiss: { flex: 0.12 },
  sheet: {
    maxHeight: "88%",
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
  head: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  headCopy: { flex: 1, minWidth: 0, gap: 2 },
  kicker: {
    color: theme.colors.gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: { color: theme.colors.ink, fontSize: 17, fontWeight: "900" },
  meta: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  close: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.cream,
  },
  closeText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  center: { paddingVertical: 40, alignItems: "center", gap: 10 },
  loadingText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  body: { gap: 12, paddingBottom: 20 },
  empty: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    padding: 16,
    gap: 4,
  },
  emptyTitle: { color: theme.colors.ink, fontSize: 14, fontWeight: "900" },
  emptyCopy: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  card: {
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    padding: 12,
  },
  cardHead: { flexDirection: "row", alignItems: "flex-start" },
  cardCopy: { flex: 1, gap: 6 },
  local: { color: theme.colors.ink, fontSize: 15, fontWeight: "900" },
  estadoPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#FFF1E6",
  },
  estadoText: { color: theme.colors.warn, fontSize: 11, fontWeight: "800" },
  grid: { gap: 8 },
  pair: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  pairLabel: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  pairValue: { color: theme.colors.ink, fontSize: 12, fontWeight: "700" },
  fotos: { color: theme.colors.accent, fontSize: 11, fontWeight: "800" },
});
