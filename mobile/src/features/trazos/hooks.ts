import { fetchHistorialGps } from "@/features/trazos/api";
import { armarTrazo } from "@/features/trazos/lib/build";
import { colorOperador } from "@/features/trazos/lib/colores";
import { horaLima, minsLabel } from "@/features/trazos/lib/format";
import { rumbo } from "@/features/trazos/lib/geo";
import { snapACalles } from "@/features/trazos/lib/snap";
import type { HistorialResumen, TrazoCapa, TrazoDia, TrazoEvento, TrazoMapPayload } from "@/features/trazos/types";
import { fetchConductores, fetchRoutes } from "@/features/routes/api";
import type { ConductorOption } from "@/features/routes/types";
import { hoy } from "@/lib/fecha-lima";
import { seesAllUsers } from "@/lib/scope-user";
import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useMemo, useState } from "react";

function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function capaDe(
  built: TrazoDia,
  color: string,
): Promise<TrazoCapa> {
  const snapped = await snapACalles(built.waypoints);
  return {
    id: built.usuarioId,
    nombre: built.usuarioNombre,
    color,
    path: snapped.path,
    trazo: {
      ...built,
      kpis: { ...built.kpis, km: snapped.km || built.kpis.km },
    },
  };
}

export function useTrazosScreen() {
  const { user } = useAuth();
  const puedeElegir = seesAllUsers(user?.rol) || (user?.rol ?? "").toLowerCase() === "asesor" || (user?.rol ?? "").toLowerCase() === "gerente";
  const propioId = user?.id != null ? String(user.id) : null;

  const [fecha, setFecha] = useState(hoy);
  const [filtroId, setFiltroId] = useState<string | null>(null);
  const [conductores, setConductores] = useState<ConductorOption[]>([]);
  const [resumenes, setResumenes] = useState<HistorialResumen[]>([]);
  const [capas, setCapas] = useState<TrazoCapa[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cursor, setCursor] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextFecha = fecha, conductorId: string | null = filtroId) => {
      setLoading(true);
      setError(null);
      try {
        const wanted = puedeElegir ? conductorId : propioId;
        const [ops, days, rutas] = await Promise.all([
          puedeElegir ? fetchConductores().catch(() => [] as ConductorOption[]) : Promise.resolve([]),
          fetchHistorialGps({
            fecha: nextFecha,
            conductorId: puedeElegir ? null : propioId,
          }),
          fetchRoutes({
            fecha: nextFecha,
            conductorId: wanted || undefined,
          }).catch(() => []),
        ]);
        const activos = ops.filter((item) => item.activo !== false);
        const activosIds = new Set(activos.map((item) => item.id));
        setConductores(activos);
        setResumenes(
          days
            .filter((item) => !activosIds.size || activosIds.has(item.resumen.usuarioId))
            .map((item) => item.resumen),
        );

        const pool = (wanted
          ? days.filter((item) => item.resumen.usuarioId === wanted)
          : days
        ).filter((item) => !activosIds.size || activosIds.has(item.resumen.usuarioId));
        if (!pool.length) {
          setCapas([]);
          setCursor(1);
          return;
        }

        const built = pool.map((pick) => {
          const nombre =
            pick.resumen.usuarioNombre ||
            ops.find((item) => item.id === pick.resumen.usuarioId)?.nombre ||
            user?.name ||
            "Operador";
          return armarTrazo({
            usuarioId: pick.resumen.usuarioId || wanted || propioId || "",
            usuarioNombre: nombre,
            fecha: nextFecha,
            puntos: pick.puntos,
            rutas: rutas.filter(
              (item) => !pick.resumen.usuarioId || item.conductorId === pick.resumen.usuarioId,
            ),
          });
        });

        const next: TrazoCapa[] = [];
        for (let i = 0; i < built.length; i += 3) {
          const chunk = built.slice(i, i + 3);
          const parts = await Promise.all(
            chunk.map((item, offset) => capaDe(item, colorOperador(i + offset))),
          );
          next.push(...parts);
        }
        setCapas(next);
        setCursor(1);
        setSelectedId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el historial");
        setCapas([]);
      } finally {
        setLoading(false);
      }
    },
    [fecha, filtroId, puedeElegir, propioId, user?.name],
  );

  useEffect(() => {
    void load(fecha, puedeElegir ? filtroId : propioId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, filtroId, propioId]);

  const setFechaDate = useCallback((date: Date) => {
    setFecha(toIso(date));
  }, []);

  const selectConductor = useCallback((id: string | null) => {
    setFiltroId(id);
  }, []);

  const operadores = useMemo(() => {
    const permitidos = new Set(conductores.map((item) => item.id));
    const map = new Map<string, ConductorOption>();
    for (const item of conductores) map.set(item.id, item);
    for (const item of resumenes) {
      if (!item.usuarioId || (permitidos.size && !permitidos.has(item.usuarioId))) continue;
      const prev = map.get(item.usuarioId);
      map.set(item.usuarioId, {
        id: item.usuarioId,
        nombre: item.usuarioNombre || prev?.nombre || "Operador",
        activo: true,
      });
    }
    return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [conductores, resumenes]);

  const unica = capas.length === 1 ? capas[0]! : null;
  const trazo = unica?.trazo ?? null;
  const verTodos = puedeElegir && !filtroId;

  const eventos: TrazoEvento[] = useMemo(() => {
    if (verTodos) {
      return capas
        .map((capa) => ({
          id: capa.id,
          kind: "local" as const,
          titulo: capa.nombre,
          detalle: `${capa.trazo.kpis.km.toFixed(capa.trazo.kpis.km < 10 ? 1 : 0)} km · ${capa.trazo.kpis.puntos} pts GPS`,
          at: capa.trazo.inicio ?? 0,
          minutos: capa.trazo.kpis.duracionMin,
        }))
        .sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
    }
    if (!trazo) return [];
    const rows: TrazoEvento[] = [];
    for (const item of trazo.locales) {
      rows.push({
        id: item.id,
        kind: "local",
        titulo: `${item.orden}. ${item.nombre}`,
        detalle: item.llego
          ? `Llegó ${horaLima(item.llego)} · ${minsLabel(item.minutos)}`
          : "Sin paso GPS",
        at: item.llego ?? Number.MAX_SAFE_INTEGER,
        minutos: item.minutos,
      });
    }
    for (const item of trazo.paradas) {
      if (item.localId) continue;
      rows.push({
        id: item.id,
        kind: "parada",
        titulo: "Parado",
        detalle: `${horaLima(item.desde)} – ${horaLima(item.hasta)} · ${minsLabel(item.minutos)}`,
        at: item.desde,
        minutos: item.minutos,
      });
    }
    return rows.sort((a, b) => a.at - b.at);
  }, [verTodos, capas, trazo]);

  const kpis = useMemo(() => {
    if (unica) return unica.trazo.kpis;
    return {
      puntos: capas.reduce((sum, item) => sum + item.trazo.kpis.puntos, 0),
      km: capas.reduce((sum, item) => sum + item.trazo.kpis.km, 0),
      duracionMin: capas.reduce((sum, item) => Math.max(sum, item.trazo.kpis.duracionMin), 0),
      paradoMin: capas.reduce((sum, item) => sum + item.trazo.kpis.paradoMin, 0),
      moviendoMin: capas.reduce((sum, item) => sum + item.trazo.kpis.moviendoMin, 0),
      velMax: capas.reduce((sum, item) => Math.max(sum, item.trazo.kpis.velMax), 0),
      velProm: capas.length
        ? capas.reduce((sum, item) => sum + item.trazo.kpis.velProm, 0) / capas.length
        : 0,
      paradas: capas.reduce((sum, item) => sum + item.trazo.kpis.paradas, 0),
      locales: capas.reduce((sum, item) => sum + item.trazo.kpis.locales, 0),
      visitados: capas.reduce((sum, item) => sum + item.trazo.kpis.visitados, 0),
    };
  }, [unica, capas]);

  const mapPayload: TrazoMapPayload = useMemo(() => {
    const track = unica?.path ?? [];
    const idx = Math.max(0, Math.min(track.length - 1, Math.round(cursor * Math.max(track.length - 1, 0))));
    const here = track[idx];
    const prev = track[Math.max(0, idx - 1)];
    const focus = unica?.trazo ?? null;
    return {
      path: track,
      rutas: capas
        .filter((item) => item.path.length > 1)
        .map((item) => ({
          id: item.id,
          color: item.color,
          path: item.path,
          nombre: item.nombre,
        })),
      waypoints: focus?.waypoints ?? [],
      segmentos: [],
      paradas: (focus?.paradas ?? []).map((item) => ({
        id: item.id,
        lat: item.lat,
        lng: item.lng,
        label: item.localNombre || "Parada",
        minutos: item.minutos,
      })),
      locales: (focus?.locales ?? []).map((item) => ({
        id: item.id,
        lat: item.lat,
        lng: item.lng,
        orden: item.orden,
        label: item.nombre,
        visitado: item.llego != null,
      })),
      inicio: track[0] ?? null,
      fin: track.length > 1 ? track[track.length - 1]! : null,
      cursor:
        unica && here
          ? {
              lat: here.lat,
              lng: here.lng,
              kmh: 0,
              heading: prev ? rumbo(prev, here) : 0,
            }
          : null,
      selectedId,
    };
  }, [capas, unica, cursor, selectedId]);

  const cursorPunto = trazo?.puntos[
    Math.max(0, Math.min((trazo.puntos.length || 1) - 1, Math.round(cursor * ((trazo.puntos.length || 1) - 1))))
  ] ?? null;

  const operadorNombre = filtroId
    ? operadores.find((item) => item.id === filtroId)?.nombre
      ?? capas[0]?.nombre
      ?? null
    : verTodos
      ? "Todos"
      : capas[0]?.nombre ?? null;

  return {
    fecha,
    setFechaDate,
    puedeElegir,
    operadores,
    resumenes,
    selectedConductorId: filtroId,
    selectConductor,
    operadorNombre,
    verTodos,
    capas,
    trazo,
    kpis,
    eventos,
    mapPayload,
    selectedId,
    setSelectedId,
    cursor,
    setCursor,
    cursorPunto,
    loading,
    error,
    reload: () => load(fecha, puedeElegir ? filtroId : propioId),
  };
}
