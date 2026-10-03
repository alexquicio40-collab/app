import { RoleHeader } from "@/features/dashboard/components/role-header";
import { fechaCabecera } from "@/features/operador-inicio/lib/format";
import { cardShadow, dash } from "@/features/operador-inicio/palette";
import { sumarDias } from "@/lib/fecha-lima";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { createElement, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useGerenciaDia } from "../hooks";
import type { RangoPersonalizado } from "../lib/build";
import type { AdminDash, AlertaAdmin, DeltaAdmin, MovimientoAdmin, PeriodoAdmin } from "../types";
import { AdminIcon, type AdminIconName } from "./admin-icon";
import { MiniFlotaMap } from "./mini-flota-map";

const PERIODOS: { id: PeriodoAdmin; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "personalizado", label: "Rango" },
];

export function GerenciaDiaScreen() {
  const router = useRouter();
  const bottom = useContentBottomPad(18);
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const scroll = useRef<ScrollView>(null);
  const { data, periodo, rango, elegirPeriodo, elegirRango, loading, error, reload } = useGerenciaDia();

  return (
    <View style={styles.safe}>
      <RoleHeader />
      <ScrollView
        ref={scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading && data != null} onRefresh={() => void reload()} tintColor={dash.green} colors={[dash.green]} />
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
            <PeriodoBar fecha={data.fecha} periodo={periodo} rango={rango} onPeriodo={elegirPeriodo} onRango={elegirRango} />
            <Indicadores data={data} />
            <View style={wide ? styles.duo : styles.stack}>
              <View style={wide ? styles.col : undefined}>
                <CamionesCard data={data} onMapa={() => router.push("/operadores")} />
              </View>
              <View style={[styles.stack, wide ? styles.col : undefined]}>
                <EstadoCard data={data} onVer={() => router.push("/rutas")} />
                <RendimientoCard data={data} onVer={() => router.push("/operadores")} />
              </View>
            </View>
            <View style={wide ? styles.duo : styles.stack}>
              <View style={wide ? styles.col : undefined}>
                <MovimientosCard data={data} onVer={() => router.push("/rutas")} />
              </View>
              <View style={[styles.stack, wide ? styles.col : undefined]}>
                <TopCard data={data} onVer={() => router.push("/locales")} />
                <AlertasCard data={data} onVer={() => router.push("/rutas")} />
              </View>
            </View>
            <Acciones
              onRutas={() => router.push("/rutas")}
              onLocales={() => router.push("/locales")}
              onCamiones={() => router.push("/operadores")}
              onCertificados={() => router.push("/certificados")}
              onReportes={() => router.push("/reportes-kpi")}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function PeriodoBar({
  fecha,
  periodo,
  rango,
  onPeriodo,
  onRango,
}: {
  fecha: string;
  periodo: PeriodoAdmin;
  rango: RangoPersonalizado;
  onPeriodo: (periodo: PeriodoAdmin) => void;
  onRango: (desde: string, hasta: string) => void;
}) {
  return (
    <View style={styles.periodoWrap}>
      <View style={styles.periodoCard}>
        <View style={styles.fechaRow}>
          <AdminIcon name="calendar" color={dash.muted} size={14} />
          <Text style={styles.fecha} numberOfLines={1}>{tituloPeriodo(fecha, periodo, rango)}</Text>
        </View>
        <View style={styles.chips}>
          {PERIODOS.map((item) => {
            const on = item.id === periodo;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => onPeriodo(item.id)}
                style={[styles.chip, on ? styles.chipOn : null]}
              >
                <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {periodo === "personalizado" ? <RangoPicker rango={rango} onChange={onRango} /> : null}
    </View>
  );
}

function Indicadores({ data }: { data: AdminDash }) {
  const sufijo = data.periodo === "hoy" ? " hoy" : "";
  const items: KpiItem[] = [
    {
      icon: "drop",
      color: dash.green,
      etiqueta: `Recolectado${sufijo}`,
      valor: `${cifra(data.litros)} L`,
      delta: data.deltaLitros,
    },
    {
      icon: "house",
      color: dash.green,
      etiqueta: "Locales atendidos",
      valor: `${data.localesAtendidos} / ${data.localesPeriodo}`,
      nota: `${data.cobertura}% de cobertura`,
    },
    {
      icon: "truck",
      color: dash.green,
      etiqueta: "Camiones activos",
      valor: String(data.camionesActivos),
      nota: `${data.camionesEnRuta} en ruta`,
      delta: data.deltaCamiones,
    },
    {
      icon: "cart",
      color: dash.green,
      etiqueta: `Compras${sufijo}`,
      valor: `S/ ${cifra(data.compras)}`,
      delta: data.deltaCompras,
    },
    {
      icon: "bars",
      color: dash.green,
      etiqueta: "Movimiento de volumen",
      valor: `${cifra(data.volumenMes)} L`,
      nota: textoMeta(data.volumenMes, data.metaMensual),
    },
    {
      icon: "cert",
      color: dash.green,
      etiqueta: "Certificados emitidos",
      valor: data.certificados == null ? "—" : String(data.certificados),
      nota: data.certificados == null ? "Sin datos" : undefined,
      delta: data.deltaCertificados,
    },
    {
      icon: "users",
      color: dash.green,
      etiqueta: "Locales activos",
      valor: String(data.localesEnMes),
      nota: data.localesNuevos > 0 ? `${data.localesNuevos} nuevos` : "Sin locales nuevos",
    },
    {
      icon: "warn",
      color: "#EF4444",
      etiqueta: `Incidencias${sufijo}`,
      valor: String(data.incidencias),
      nota: data.incidenciasAltas > 0 ? `${data.incidenciasAltas} críticas` : "Sin críticas",
      notaRoja: data.incidenciasAltas > 0,
      delta: data.deltaIncidencias,
    },
  ];

  return (
    <View style={styles.kpiGrid}>
      {[items.slice(0, 4), items.slice(4, 8)].map((row, index) => (
        <View key={index} style={styles.kpiRow}>
          {row.map((item) => (
            <View key={item.etiqueta} style={styles.kpi}>
              <Kpi {...item} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

type KpiItem = {
  icon: AdminIconName;
  color: string;
  etiqueta: string;
  valor: string;
  nota?: string;
  notaRoja?: boolean;
  delta?: DeltaAdmin | null;
};

function Kpi({ icon, color, etiqueta, valor, nota, notaRoja, delta }: KpiItem) {
  return (
    <>
      <View style={styles.kpiHead}>
        <AdminIcon name={icon} color={color} size={15} />
        <Text style={styles.kpiEtiqueta} numberOfLines={2}>{etiqueta}</Text>
      </View>
      <Text style={styles.kpiValor} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{valor}</Text>
      {nota ? (
        <View style={styles.kpiNotaRow}>
          {notaRoja ? <View style={styles.puntoRojo} /> : null}
          <Text style={[styles.kpiNota, notaRoja ? styles.rojo : null]}>{nota}</Text>
        </View>
      ) : null}
      {delta ? (
        <Text style={[styles.kpiDelta, delta.sube ? styles.verde : styles.rojo]}>
          {delta.sube ? "↑" : "↓"} {delta.texto}
        </Text>
      ) : null}
    </>
  );
}

function CamionesCard({ data, onMapa }: { data: AdminDash; onMapa: () => void }) {
  return (
    <View style={styles.card}>
      <Cabecera titulo="Camiones en ruta" onPress={onMapa} />
      <View style={styles.mapa}>
        <MiniFlotaMap camiones={data.camiones} />
        <Pressable accessibilityRole="button" onPress={onMapa} style={styles.mapaBtn}>
          <AdminIcon name="map" color={dash.ink} size={14} />
          <Text style={styles.mapaBtnText}>Ver mapa completo</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EstadoCard({ data, onVer }: { data: AdminDash; onVer: () => void }) {
  const partes = [
    { etiqueta: "Atendidos", valor: data.estado.atendidos, color: "#22C55E" },
    { etiqueta: "Pendientes", valor: data.estado.pendientes, color: "#F5A524" },
    { etiqueta: "No atendidos", valor: data.estado.noAtendidos, color: "#EF4444" },
    { etiqueta: "Reprogramados", valor: data.estado.reprogramados, color: "#60A5FA" },
  ];
  return (
    <View style={styles.card}>
      <Cabecera titulo="Estado de locales" onPress={onVer} />
      <View style={styles.estadoRow}>
        <Anillo total={data.estado.total} partes={partes} />
        <View style={styles.leyenda}>
          {partes.map((item) => (
            <View key={item.etiqueta} style={styles.leyendaItem}>
              <View style={[styles.punto, { backgroundColor: item.color }]} />
              <Text style={styles.leyendaText}>{item.etiqueta}</Text>
              <Text style={styles.leyendaNum}>{item.valor}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function Anillo({ total, partes }: { total: number; partes: { valor: number; color: string }[] }) {
  const size = 88;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const suma = partes.reduce((sum, item) => sum + item.valor, 0);
  let offset = 0;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cx} r={r} stroke="#E8EEEA" strokeWidth={stroke} fill="none" />
        {partes.map((item) => {
          if (item.valor <= 0 || suma <= 0) return null;
          const len = (item.valor / suma) * c;
          const node = (
            <Circle
              key={item.color}
              cx={cx}
              cy={cx}
              r={r}
              stroke={item.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${len} ${Math.max(0, c - len)}`}
              strokeDashoffset={c / 4 - offset}
            />
          );
          offset += len;
          return node;
        })}
      </Svg>
      <View style={styles.anilloCentro}>
        <Text style={styles.anilloNum}>{total}</Text>
        <Text style={styles.anilloLabel}>Locales</Text>
      </View>
    </View>
  );
}

function RendimientoCard({ data, onVer }: { data: AdminDash; onVer: () => void }) {
  const lista = data.camiones.slice(0, 4);
  return (
    <View style={styles.card}>
      <Cabecera titulo="Rendimiento por camión" onPress={onVer} />
      {lista.length === 0 ? <Text style={styles.vacio}>Sin camiones en este periodo</Text> : null}
      {lista.map((item) => (
        <View key={item.id} style={styles.barraItem}>
          <View style={styles.barraTop}>
            <View style={styles.barraNombre}>
              <AdminIcon name="truck" color={dash.green} size={15} />
              <Text style={styles.itemTitulo} numberOfLines={1}>{item.nombre}</Text>
            </View>
            <Text style={styles.itemMeta}>{cifra(item.litros)} L</Text>
          </View>
          <View style={styles.barraLinea}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${item.avance}%` }]} />
            </View>
            <Text style={styles.barraPct}>{item.avance}%</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function MovimientosCard({ data, onVer }: { data: AdminDash; onVer: () => void }) {
  return (
    <View style={styles.card}>
      <Cabecera titulo="Últimos movimientos" onPress={onVer} />
      {data.movimientos.length === 0 ? <Text style={styles.vacio}>Sin movimientos en este periodo</Text> : null}
      {data.movimientos.map((item) => (
        <MovimientoFila key={item.id} item={item} />
      ))}
    </View>
  );
}

function MovimientoFila({ item }: { item: MovimientoAdmin }) {
  const color = item.icono === "warn" ? "#EF4444" : item.icono === "pin" ? dash.blue : dash.green;
  return (
    <View style={styles.fila}>
      <View style={[styles.filaIcon, { backgroundColor: item.icono === "warn" ? "#FDECEC" : "#EAF6EE" }]}>
        <AdminIcon name={item.icono} color={color} size={15} />
      </View>
      <View style={styles.filaTexto}>
        <Text style={styles.itemTitulo} numberOfLines={1}>{item.titulo}</Text>
        <Text style={styles.itemSub} numberOfLines={1}>{item.detalle}</Text>
      </View>
      <View style={styles.filaDerecha}>
        <Text style={styles.hora}>{item.hora}</Text>
        {item.litros != null ? <Text style={styles.itemMeta}>{cifra(item.litros)} L</Text> : null}
      </View>
    </View>
  );
}

function TopCard({ data, onVer }: { data: AdminDash; onVer: () => void }) {
  const titulo = data.periodo === "hoy" ? "Top 5 locales (Litros hoy)" : "Top 5 locales";
  return (
    <View style={styles.card}>
      <Cabecera titulo={titulo} onPress={onVer} />
      {data.topLocales.length === 0 ? <Text style={styles.vacio}>Sin litros recolectados en este periodo</Text> : null}
      {data.topLocales.map((item, index) => (
        <View key={item.id} style={styles.fila}>
          <Text style={styles.rank}>{index + 1}</Text>
          <Text style={[styles.itemTitulo, styles.flex]} numberOfLines={1}>{item.nombre}</Text>
          <Text style={styles.itemMeta}>{cifra(item.litros)} L</Text>
        </View>
      ))}
    </View>
  );
}

function AlertasCard({ data, onVer }: { data: AdminDash; onVer: () => void }) {
  return (
    <View style={styles.card}>
      <Cabecera titulo="Alertas y pendientes" onPress={onVer} />
      {data.alertas.length === 0 ? <Text style={styles.vacio}>Sin alertas en este periodo</Text> : null}
      {data.alertas.map((item) => (
        <AlertaFila key={item.id} item={item} />
      ))}
    </View>
  );
}

function AlertaFila({ item }: { item: AlertaAdmin }) {
  const color = item.tono === "peligro" ? "#EF4444" : item.tono === "aviso" ? "#F5A524" : dash.blue;
  return (
    <View style={styles.fila}>
      <AdminIcon name="warn" color={color} size={16} />
      <View style={styles.filaTexto}>
        <Text style={styles.itemTitulo} numberOfLines={1}>{item.titulo}</Text>
        <Text style={styles.itemSub} numberOfLines={1}>{item.detalle}</Text>
      </View>
      <Text style={styles.hora}>{item.hora}</Text>
    </View>
  );
}

function Acciones({
  onRutas,
  onLocales,
  onCamiones,
  onCertificados,
  onReportes,
}: {
  onRutas: () => void;
  onLocales: () => void;
  onCamiones: () => void;
  onCertificados: () => void;
  onReportes: () => void;
}) {
  const items: { titulo: string; sub: string; icon: AdminIconName; color: string; onPress: () => void }[] = [
    { titulo: "Gestionar rutas", sub: "Asignar y programar", icon: "home", color: dash.green, onPress: onRutas },
    { titulo: "Gestionar locales", sub: "Ver y editar", icon: "building", color: dash.green, onPress: onLocales },
    { titulo: "Control de camiones", sub: "Seguimiento GPS", icon: "truck", color: "#6D28D9", onPress: onCamiones },
    { titulo: "Emitir certificados", sub: "Generar y enviar", icon: "cert", color: dash.orange, onPress: onCertificados },
    { titulo: "Ver reportes", sub: "Ver estadísticas", icon: "chart", color: dash.greenDeep, onPress: onReportes },
  ];
  return (
    <View style={styles.card}>
      <View style={styles.accionesHead}>
        <AdminIcon name="bolt" color={dash.ink} size={16} />
        <Text style={styles.secTitulo}>Acciones rápidas</Text>
      </View>
      <View style={styles.accionesRow}>
        {items.map((item) => (
          <Pressable key={item.titulo} accessibilityRole="button" onPress={item.onPress} style={styles.accion}>
            <AdminIcon name={item.icon} color={item.color} size={22} />
            <Text style={styles.accionTitulo} numberOfLines={2}>{item.titulo}</Text>
            <Text style={styles.accionSub} numberOfLines={2}>{item.sub}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Cabecera({ titulo, onPress }: { titulo: string; onPress: () => void }) {
  return (
    <View style={styles.cabecera}>
      <Text style={styles.secTitulo}>{titulo}</Text>
      <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
        <Text style={styles.link}>Ver todos</Text>
      </Pressable>
    </View>
  );
}

function RangoPicker({ rango, onChange }: { rango: RangoPersonalizado; onChange: (desde: string, hasta: string) => void }) {
  const [picking, setPicking] = useState<"desde" | "hasta" | null>(null);
  const apply = (which: "desde" | "hasta", next: string) => {
    if (which === "desde") onChange(next, rango.hasta);
    else onChange(rango.desde, next);
  };
  const onPick = (event: DateTimePickerEvent, date?: Date) => {
    const which = picking;
    if (Platform.OS === "android") setPicking(null);
    if (!which || event.type === "dismissed" || !date) return;
    apply(which, toIso(date));
    if (Platform.OS === "ios") setPicking(null);
  };

  return (
    <View style={styles.rango}>
      {Platform.OS === "web" ? (
        <>
          <DiaWeb titulo="Desde" value={rango.desde} onChange={(value) => apply("desde", value)} />
          <DiaWeb titulo="Hasta" value={rango.hasta} onChange={(value) => apply("hasta", value)} />
        </>
      ) : (
        <>
          <Pressable accessibilityRole="button" onPress={() => setPicking("desde")} style={styles.dia}>
            <Text style={styles.diaLabel}>Desde</Text>
            <Text style={styles.diaValor}>{corto(rango.desde)}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setPicking("hasta")} style={styles.dia}>
            <Text style={styles.diaLabel}>Hasta</Text>
            <Text style={styles.diaValor}>{corto(rango.hasta)}</Text>
          </Pressable>
        </>
      )}
      {picking && Platform.OS === "android" ? (
        <DateTimePicker value={parseDay(picking === "desde" ? rango.desde : rango.hasta)} mode="date" display="default" onChange={onPick} />
      ) : null}
      {picking && Platform.OS === "ios" ? (
        <Modal transparent animationType="fade" onRequestClose={() => setPicking(null)}>
          <Pressable style={styles.backdrop} onPress={() => setPicking(null)}>
            <Pressable style={styles.sheet} onPress={() => undefined}>
              <DateTimePicker value={parseDay(picking === "desde" ? rango.desde : rango.hasta)} mode="date" display="spinner" onChange={onPick} />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

function DiaWeb({ titulo, value, onChange }: { titulo: string; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.dia}>
      <Text style={styles.diaLabel}>{titulo}</Text>
      {createElement("input", {
        type: "date",
        "aria-label": titulo,
        value,
        onChange: (event: { target: { value: string } }) => {
          const next = event.target.value;
          if (/^\d{4}-\d{2}-\d{2}$/.test(next)) onChange(next);
        },
        style: {
          border: "none",
          background: "transparent",
          color: dash.ink,
          fontSize: 14,
          fontWeight: "700",
          fontFamily: "inherit",
          width: 124,
          height: 22,
          padding: 0,
        },
      })}
    </View>
  );
}

function tituloPeriodo(fecha: string, periodo: PeriodoAdmin, rango: RangoPersonalizado) {
  if (periodo === "hoy") {
    const full = fechaCabecera(new Date(`${fecha}T12:00:00-05:00`));
    return full.replace(/\s+\d{4}$/, "");
  }
  if (periodo === "mes") {
    const mes = new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric", timeZone: "America/Lima" }).format(new Date(`${fecha}T12:00:00-05:00`));
    return mes.charAt(0).toUpperCase() + mes.slice(1);
  }
  if (periodo === "semana") {
    const lunes = lunesDe(fecha);
    return `${corto(lunes)} – ${corto(sumarDias(lunes, 6))}`;
  }
  return rango.desde === rango.hasta ? corto(rango.desde) : `${corto(rango.desde)} – ${corto(rango.hasta)}`;
}

function lunesDe(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return sumarDias(iso, -((weekday + 6) % 7));
}

function corto(iso: string) {
  return new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", timeZone: "America/Lima" })
    .format(new Date(`${iso}T12:00:00-05:00`))
    .replace(".", "");
}

function textoMeta(volumenLitros: number, meta: number | null) {
  if (meta == null || meta <= 0) return "Sin meta";
  const pct = Math.round((volumenLitros / 1000 / meta) * 100);
  return `${pct}% de meta`;
}

function cifra(value: number) {
  return Math.round(value).toLocaleString("es-PE");
}

function parseDay(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F7F5" },
  content: { padding: 8, gap: 8 },
  loading: { paddingVertical: 48, alignItems: "center" },
  error: { color: "#DC2626", fontSize: 14, textAlign: "center", paddingVertical: 24 },
  periodoWrap: { gap: 6 },
  periodoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    ...cardShadow,
  },
  fechaRow: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1, minWidth: 0, maxWidth: "42%" },
  fecha: { color: dash.ink, fontSize: 12, fontWeight: "700", flexShrink: 1 },
  chips: { flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 0, marginLeft: "auto" },
  chip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: "#F3F6F4" },
  chipOn: { backgroundColor: dash.green },
  chipText: { color: dash.muted, fontSize: 11, fontWeight: "700" },
  chipTextOn: { color: "#FFFFFF" },
  rango: { flexDirection: "row", gap: 6 },
  dia: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, ...cardShadow },
  diaLabel: { color: dash.muted, fontSize: 10, fontWeight: "700" },
  diaValor: { color: dash.ink, fontSize: 12, fontWeight: "800" },
  kpiGrid: { gap: 6 },
  kpiRow: { flexDirection: "row", alignItems: "stretch", gap: 6 },
  kpi: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 7,
    ...cardShadow,
  },
  kpiHead: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  kpiEtiqueta: { color: dash.muted, fontSize: 10, lineHeight: 12, fontWeight: "600", flexShrink: 1 },
  kpiValor: { color: dash.ink, fontSize: 16, fontWeight: "800", letterSpacing: -0.4, textAlign: "center", alignSelf: "stretch" },
  kpiNotaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  kpiNota: { color: dash.muted, fontSize: 10, fontWeight: "600" },
  kpiDelta: { fontSize: 10, fontWeight: "700", marginTop: 1 },
  puntoRojo: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#EF4444" },
  verde: { color: dash.green },
  rojo: { color: "#DC2626" },
  duo: { flexDirection: "row", alignItems: "stretch", gap: 8 },
  stack: { gap: 8 },
  col: { flex: 1, minWidth: 0, gap: 8 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 10, gap: 8, ...cardShadow },
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  secTitulo: { color: dash.ink, fontSize: 13, fontWeight: "800", flexShrink: 1 },
  link: { color: dash.muted, fontSize: 12, fontWeight: "600" },
  mapa: { height: 168, borderRadius: 10, backgroundColor: "#EAF3ED", overflow: "hidden" },
  mapaBtn: {
    position: "absolute",
    left: 8,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    ...cardShadow,
  },
  mapaBtnText: { color: dash.ink, fontSize: 12, fontWeight: "700" },
  estadoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  anilloCentro: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  anilloNum: { color: dash.ink, fontSize: 18, fontWeight: "800" },
  anilloLabel: { color: dash.muted, fontSize: 10, fontWeight: "700" },
  leyenda: { flex: 1, gap: 5 },
  leyendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  punto: { width: 7, height: 7, borderRadius: 4 },
  leyendaText: { flex: 1, color: dash.ink, fontSize: 12, fontWeight: "600" },
  leyendaNum: { color: dash.ink, fontSize: 12, fontWeight: "800" },
  barraItem: { gap: 4 },
  barraTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  barraNombre: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  barraLinea: { flexDirection: "row", alignItems: "center", gap: 6 },
  track: { flex: 1, height: 6, borderRadius: 999, backgroundColor: "#E7EEEA", overflow: "hidden" },
  fill: { height: 6, borderRadius: 999, backgroundColor: dash.green },
  barraPct: { color: dash.muted, fontSize: 11, fontWeight: "700", width: 32, textAlign: "right" },
  fila: { flexDirection: "row", alignItems: "center", gap: 8 },
  filaIcon: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  filaTexto: { flex: 1 },
  filaDerecha: { alignItems: "flex-end" },
  itemTitulo: { color: dash.ink, fontSize: 12, fontWeight: "700" },
  itemSub: { color: dash.muted, fontSize: 11, fontWeight: "600" },
  itemMeta: { color: dash.ink, fontSize: 12, fontWeight: "800" },
  hora: { color: dash.muted, fontSize: 11, fontWeight: "700" },
  rank: { width: 16, color: dash.muted, fontSize: 13, fontWeight: "700" },
  flex: { flex: 1 },
  vacio: { color: dash.muted, fontSize: 13, fontWeight: "600" },
  accionesHead: { flexDirection: "row", alignItems: "center", gap: 5 },
  accionesRow: { flexDirection: "row", alignItems: "stretch", gap: 4 },
  accion: { flex: 1, minWidth: 0, alignItems: "center", gap: 2, paddingVertical: 2 },
  accionTitulo: { color: dash.ink, fontSize: 10, fontWeight: "800", textAlign: "center", lineHeight: 13 },
  accionSub: { color: dash.muted, fontSize: 9, fontWeight: "600", textAlign: "center", lineHeight: 11 },
  backdrop: { flex: 1, backgroundColor: "rgba(15, 23, 20, 0.35)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 12 },
});
