import { RoleHeader } from "@/features/dashboard/components/role-header";
import { AdminIcon, type AdminIconName } from "@/features/gerencia-dia/components/admin-icon";
import { LocalDetailSheet } from "@/features/locales/components/local-detail-sheet";
import { LocalPortada } from "@/features/locales/components/local-portada";
import { cardShadow, dash } from "@/features/operador-inicio/palette";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAsesorInicio } from "../hooks";
import type { AsesorKpis, AsesorMes, GestionItem, GestionKind } from "../types";

const KPI: {
  key: keyof AsesorKpis;
  label: string;
  icon: AdminIconName;
  bg: string;
  fg: string;
}[] = [
  { key: "localesActivos", label: "Locales activos", icon: "house", bg: "#E8F8EE", fg: "#148A46" },
  { key: "recojosCoordinar", label: "Recojos por coordinar", icon: "calendar", bg: "#E7F1FB", fg: "#1B6CB5" },
  { key: "seguimientos", label: "Seguimientos", icon: "bell", bg: "#FFF1E3", fg: "#E07A1A" },
  { key: "nuevosMes", label: "Nuevos este mes", icon: "chart", bg: "#F3E8FF", fg: "#7C3AED" },
];

const ACCESOS: {
  label: string;
  icon: AdminIconName;
  bg: string;
  href: string;
}[] = [
  { label: "Nuevo local", icon: "plus", bg: "#148A46", href: "/locales?crear=1" },
  { label: "Mis locales", icon: "house", bg: "#1B6CB5", href: "/locales" },
  { label: "Programación", icon: "calendar", bg: "#7C3AED", href: "/rutas?tab=programacion" },
  { label: "Visitas", icon: "pin", bg: "#E07A1A", href: "/rutas-mapa" },
  { label: "Seguimiento", icon: "bell", bg: "#E23B32", href: "/certificados" },
  { label: "Certificados", icon: "cert", bg: "#0EA5A4", href: "/certificados" },
];

export function AsesorInicioScreen() {
  const router = useRouter();
  const bottom = useContentBottomPad(18);
  const { data, locales, loading, error, reload } = useAsesorInicio();
  const [localId, setLocalId] = useState<string | null>(null);
  const local = localId ? locales.find((item) => item.id === localId) ?? null : null;

  return (
    <View style={styles.safe}>
      <RoleHeader />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && data != null}
            onRefresh={() => void reload()}
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
            <KpiStrip kpis={data.kpis} />
            <GestionCard
              items={data.gestion}
              total={data.gestionTotal}
              onTodos={() => router.push("/locales")}
              onVer={(item) => {
                if (item.localId) setLocalId(item.localId);
                else router.push("/locales");
              }}
              onProgramar={() => router.push("/rutas?tab=programacion")}
            />
            <AccesosCard onGo={(href) => router.push(href as never)} />
            <MesCard mes={data.mes} onDetalle={() => router.push("/reportes-kpi")} />
          </>
        ) : null}
      </ScrollView>
      <LocalDetailSheet local={local} canManage onClose={() => setLocalId(null)} />
    </View>
  );
}

function KpiStrip({ kpis }: { kpis: AsesorKpis }) {
  return (
    <View style={styles.kpiRow}>
      {KPI.map((item) => (
        <View key={item.key} style={[styles.kpi, { backgroundColor: item.bg }]}>
          <View style={styles.kpiHead}>
            <AdminIcon name={item.icon} color={item.fg} size={16} />
            <AdminIcon name="chevron" color={item.fg} size={12} />
          </View>
          <Text style={[styles.kpiNum, { color: item.fg }]}>{kpis[item.key]}</Text>
          <Text style={[styles.kpiLbl, { color: item.fg }]} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function GestionCard({
  items,
  total,
  onTodos,
  onVer,
  onProgramar,
}: {
  items: GestionItem[];
  total: number;
  onTodos: () => void;
  onVer: (item: GestionItem) => void;
  onProgramar: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cabecera}>
        <View style={styles.tituloRow}>
          <AdminIcon name="pin" color={dash.green} size={14} />
          <Text style={styles.titulo}>Mi gestión de hoy</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onTodos}>
          <Text style={styles.link}>Ver todos ({total})</Text>
        </Pressable>
      </View>

      {items.length === 0 ? (
        <Text style={styles.vacio}>Nada pendiente por coordinar hoy.</Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.local}>
            <View style={styles.localTop}>
              <LocalPortada
                uri={item.fotoUrl}
                size={44}
                radius={10}
                fallbackColor={kindSoft(item.kind)}
                fallbackIconColor={kindColor(item.kind)}
              />
              <View style={styles.localText}>
                <Text style={styles.localNombre} numberOfLines={1}>
                  {item.nombre}
                </Text>
                {item.distrito ? (
                  <View style={styles.metaRow}>
                    <AdminIcon name="pin" color={dash.muted} size={11} />
                    <Text style={styles.localDist} numberOfLines={1}>
                      {item.distrito}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.metaRow}>
                  <AdminIcon
                    name={item.kind === "coordinar" ? "warn" : item.kind === "seguimiento" ? "bell" : "phone"}
                    color={kindColor(item.kind)}
                    size={11}
                  />
                  <Text style={[styles.localEstado, { color: kindColor(item.kind) }]} numberOfLines={1}>
                    {item.detalle}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  {item.ultimoRecojo ? (
                    <>
                      <AdminIcon name="clock" color={dash.muted} size={11} />
                      <Text style={styles.localMeta}>Último {fechaCorta(item.ultimoRecojo)}</Text>
                    </>
                  ) : null}
                  <AdminIcon name="calendar" color={dash.muted} size={11} />
                  <Text style={styles.localMeta}>{item.frecuencia}</Text>
                  {item.volumen != null ? (
                    <>
                      <AdminIcon name="drop" color={dash.muted} size={11} />
                      <Text style={styles.localMeta}>Vol. {item.volumen}</Text>
                    </>
                  ) : null}
                </View>
              </View>
              <View style={styles.acciones}>
                {item.telefono ? (
                  <>
                    <Accion
                      label="Llamar"
                      icon="phone"
                      tone="fill"
                      onPress={() => void llamar(item.telefono)}
                    />
                    <Accion
                      label="WhatsApp"
                      icon="whatsapp"
                      tone="line"
                      onPress={() => void whatsapp(item.telefono)}
                    />
                  </>
                ) : null}
                <Accion label="Ver local" icon="pin" tone="ghost" onPress={() => onVer(item)} />
                {item.kind !== "seguimiento" ? (
                  <Accion label="Programar" icon="calendar" tone="ghost" onPress={onProgramar} />
                ) : null}
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function AccesosCard({ onGo }: { onGo: (href: string) => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.tituloRow}>
        <AdminIcon name="bolt" color={dash.green} size={14} />
        <Text style={styles.titulo}>Accesos rápidos</Text>
      </View>
      <View style={styles.accesos}>
        {ACCESOS.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={() => onGo(item.href)}
            style={styles.acceso}
          >
            <View style={[styles.accesoIcon, { backgroundColor: item.bg }]}>
              <AdminIcon name={item.icon} color="#FFFFFF" size={16} />
            </View>
            <Text style={styles.accesoLbl} numberOfLines={2}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function MesCard({ mes, onDetalle }: { mes: AsesorMes; onDetalle: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cabecera}>
        <View style={styles.tituloRow}>
          <AdminIcon name="target" color={dash.green} size={14} />
          <Text style={styles.titulo}>Este mes</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onDetalle}>
          <Text style={styles.link}>Ver detalle</Text>
        </Pressable>
      </View>
      <View style={styles.mesGrid}>
        <MesCell icon="house" label="Locales activos" value={String(mes.localesActivos)} />
        <MesCell icon="calendar" label="Sin programar" value={String(mes.sinProgramar)} />
        <MesCell icon="bell" label="Cert. pendientes" value={String(mes.certPendientes)} />
        <MesCell icon="cert" label="Cert. emitidos" value={String(mes.certEmitidosMes)} />
      </View>
    </View>
  );
}

function MesCell({
  icon,
  label,
  value,
}: {
  icon: AdminIconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.mesCell}>
      <AdminIcon name={icon} color={dash.green} size={14} />
      <Text style={styles.mesVal}>{value}</Text>
      <Text style={styles.mesLbl} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function Accion({
  label,
  icon,
  tone,
  onPress,
}: {
  label: string;
  icon: AdminIconName;
  tone: "fill" | "line" | "ghost";
  onPress: () => void;
}) {
  const color = tone === "fill" ? "#FFFFFF" : tone === "line" ? dash.green : dash.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.accion,
        tone === "fill" ? styles.accionFill : null,
        tone === "line" ? styles.accionLine : null,
        tone === "ghost" ? styles.accionGhost : null,
      ]}
    >
      <AdminIcon name={icon} color={color} size={12} />
      <Text
        style={[
          styles.accionText,
          tone === "fill" ? styles.accionTextFill : null,
          tone === "line" ? styles.accionTextLine : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function kindColor(kind: GestionKind) {
  if (kind === "confirmar") return "#1B6CB5";
  if (kind === "coordinar") return "#DC2626";
  return "#E07A1A";
}

function kindSoft(kind: GestionKind) {
  if (kind === "confirmar") return "#E7F1FB";
  if (kind === "coordinar") return "#FDECEC";
  return "#FFF1E3";
}

function fechaCorta(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}` : iso.slice(0, 10);
}

function digits(raw: string) {
  return raw.replace(/\D/g, "");
}

async function llamar(raw: string) {
  const phone = digits(raw);
  if (!phone) return;
  await Linking.openURL(`tel:${phone}`);
}

async function whatsapp(raw: string) {
  let phone = digits(raw);
  if (!phone) return;
  if (phone.startsWith("0")) phone = phone.slice(1);
  if (phone.length === 9) phone = `51${phone}`;
  await Linking.openURL(`https://wa.me/${phone}`);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F7F5" },
  content: { padding: 8, gap: 8 },
  loading: { paddingVertical: 48, alignItems: "center" },
  error: { color: "#DC2626", fontSize: 13, fontWeight: "700", textAlign: "center", paddingVertical: 20 },
  kpiRow: { flexDirection: "row", gap: 6 },
  kpi: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 8,
    gap: 2,
    ...cardShadow,
  },
  kpiHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kpiNum: { fontSize: 18, fontWeight: "800", letterSpacing: -0.4 },
  kpiLbl: { fontSize: 9, fontWeight: "700", lineHeight: 11 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 10, gap: 8, ...cardShadow },
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  tituloRow: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  titulo: { color: dash.ink, fontSize: 13, fontWeight: "800" },
  link: { color: dash.muted, fontSize: 11, fontWeight: "700" },
  vacio: { color: dash.muted, fontSize: 12, fontWeight: "600" },
  local: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: dash.line,
    paddingTop: 8,
    gap: 6,
  },
  localTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  localText: { flex: 1, minWidth: 0, gap: 3 },
  localNombre: { color: dash.ink, fontSize: 13, fontWeight: "800" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  localDist: { color: dash.muted, fontSize: 11, fontWeight: "600", flexShrink: 1 },
  localEstado: { fontSize: 11, fontWeight: "700", flexShrink: 1 },
  localMeta: { color: dash.muted, fontSize: 10, fontWeight: "600" },
  acciones: { width: 112, gap: 4 },
  accion: {
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  accionFill: { backgroundColor: dash.green },
  accionLine: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: dash.green },
  accionGhost: { backgroundColor: "#F3F6F4" },
  accionText: { fontSize: 10, fontWeight: "800" },
  accionTextFill: { color: "#FFFFFF" },
  accionTextLine: { color: dash.green },
  accesos: { flexDirection: "row", flexWrap: "wrap" },
  acceso: { width: "16.66%", alignItems: "center", gap: 4, paddingVertical: 2 },
  accesoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  accesoLbl: { color: dash.ink, fontSize: 9, fontWeight: "700", textAlign: "center", lineHeight: 11 },
  mesGrid: { flexDirection: "row", gap: 6 },
  mesCell: { flex: 1, minWidth: 0, alignItems: "center", gap: 2 },
  mesVal: { color: dash.ink, fontSize: 16, fontWeight: "800" },
  mesLbl: { color: dash.muted, fontSize: 9, fontWeight: "700", textAlign: "center" },
});
