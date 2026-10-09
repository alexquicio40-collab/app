import { RutaDetalleSheet } from "@/features/mapa-campo/components/ruta-detalle-sheet";
import { RoleHeader } from "@/features/dashboard/components/role-header";
import { AvisosSheet } from "@/features/operador-inicio/components/avisos-sheet";
import { DashIcon } from "@/features/operador-inicio/components/dash-icon";
import { GpsBanner } from "@/features/operador-inicio/components/gps-banner";
import { ResumenDia } from "@/features/operador-inicio/components/resumen-dia";
import { RutaHoyCard } from "@/features/operador-inicio/components/ruta-hoy-card";
import { SiguienteLocalCard } from "@/features/operador-inicio/components/siguiente-local-card";
import { useOperadorInicio } from "@/features/operador-inicio/hooks";
import { dash } from "@/features/operador-inicio/palette";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

export function OperadorInicioScreen() {
  const router = useRouter();
  const bottom = useContentBottomPad(18);
  const { data, rutas, loading, error, reload } = useOperadorInicio();
  const [avisosOpen, setAvisosOpen] = useState(false);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const detalle = detalleId ? rutas.find((item) => item.id === detalleId) ?? null : null;

  const irMapa = () => router.push("/mapa");
  const irRutas = () => router.push("/rutas");
  const irCaja = () => router.push("/hoja-ruta");
  const onAccion = () => {
    if (!data || data.accion === "ninguna") return;
    if (data.accion === "caja") irCaja();
    else irMapa();
  };

  return (
    <View style={styles.safe}>
      <View style={styles.phone}>
      <RoleHeader
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              (data?.avisos.length ?? 0) > 0
                ? `${data?.avisos.length} locales pendientes`
                : "Avisos de la ruta"
            }
            onPress={() => setAvisosOpen(true)}
            style={styles.bell}
          >
            <DashIcon name="bell" color="#FFFFFF" size={20} />
            {(data?.avisos.length ?? 0) > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {(data?.avisos.length ?? 0) > 9 ? "9+" : String(data?.avisos.length)}
                </Text>
              </View>
            ) : null}
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={loading && data != null}
            onRefresh={() => void reload(false)}
            tintColor={dash.green}
            colors={[dash.green]}
          />
        }
      >
        {error && !data ? <Text style={styles.error}>{error}</Text> : null}
        {!data && loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={dash.green} />
          </View>
        ) : null}
        {data ? (
          <>
            <RutaHoyCard data={data} onOpenRuta={irRutas} onAccion={onAccion} />
            <SiguienteLocalCard
              local={data.siguiente}
              onOpen={() => {
                if (data.siguiente) setDetalleId(data.siguiente.rutaId);
              }}
            />
            <ResumenDia data={data} onMapa={irMapa} onLocales={irRutas} onRecojo={irMapa} onCaja={irCaja} />
            <GpsBanner
              activo={data.gpsActivo}
              titulo={data.gpsTitulo}
              detalle={data.gpsDetalle}
              onMapa={irMapa}
            />
          </>
        ) : null}
      </ScrollView>
      <AvisosSheet open={avisosOpen} avisos={data?.avisos ?? []} onClose={() => setAvisosOpen(false)} />
      <RutaDetalleSheet route={detalle} onClose={() => setDetalleId(null)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#E7EEE9",
    alignItems: "center",
  },
  phone: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    backgroundColor: dash.canvas,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  loading: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: "#9B2C2C",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 18,
  },
  bell: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: "#E23B32",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
});
