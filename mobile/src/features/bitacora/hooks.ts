import { isAdministrador } from "@/lib/role-nav";
import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchBitacora, peekBitacora } from "./api";
import { agruparPorDia, rangoPeriodo } from "./lib/format";
import type { BitacoraEvento, BitacoraFiltros, BitacoraResumen } from "./types";

function emptyResumen(): BitacoraResumen {
  return {
    total: 0,
    crear: 0,
    editar: 0,
    eliminar: 0,
    ver: 0,
    registrar: 0,
    ingresar: 0,
    salir: 0,
    cerrar: 0,
    autorizar: 0,
    bloquear: 0,
  };
}

export function useBitacoraScreen() {
  const { user } = useAuth();
  const canAccess = isAdministrador(user?.rol);

  const [filtros, setFiltros] = useState<BitacoraFiltros>({
    periodo: "hoy",
    modulo: null,
    accion: null,
    q: "",
  });
  const [qDraft, setQDraft] = useState("");
  const [eventos, setEventos] = useState<BitacoraEvento[]>(() => {
    const rangoHoy = rangoPeriodo("hoy");
    return peekBitacora({ desde: rangoHoy.desde, hasta: rangoHoy.hasta })?.eventos ?? [];
  });
  const [resumen, setResumen] = useState<BitacoraResumen>(() => {
    const rangoHoy = rangoPeriodo("hoy");
    return peekBitacora({ desde: rangoHoy.desde, hasta: rangoHoy.hasta })?.resumen ?? emptyResumen();
  });
  const [loading, setLoading] = useState(() => {
    const rangoHoy = rangoPeriodo("hoy");
    return !peekBitacora({ desde: rangoHoy.desde, hasta: rangoHoy.hasta });
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<BitacoraEvento | null>(null);

  const rango = useMemo(() => rangoPeriodo(filtros.periodo), [filtros.periodo]);

  const load = useCallback(
    async (silent = false) => {
      if (!canAccess) {
        setLoading(false);
        return;
      }
      const query = {
        desde: rango.desde,
        hasta: rango.hasta,
        modulo: filtros.modulo,
        accion: filtros.accion,
        q: filtros.q,
      };
      const cached = peekBitacora(query);
      if (cached) {
        setEventos(cached.eventos);
        setResumen(cached.resumen);
        setLoading(false);
      } else if (!silent) {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await fetchBitacora(query, { force: silent });
        setEventos(data.eventos);
        setResumen(data.resumen);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar la bitácora");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [canAccess, filtros.accion, filtros.modulo, filtros.q, rango.desde, rango.hasta],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setFiltros((prev) => (prev.q === qDraft ? prev : { ...prev, q: qDraft }));
    }, 320);
    return () => clearTimeout(timer);
  }, [qDraft]);

  useEffect(() => {
    void load();
  }, [load]);

  const grupos = useMemo(() => agruparPorDia(eventos), [eventos]);

  return {
    canAccess,
    filtros: { ...filtros, q: qDraft },
    setPeriodo: (periodo: BitacoraFiltros["periodo"]) =>
      setFiltros((prev) => ({ ...prev, periodo })),
    setModulo: (modulo: string | null) => setFiltros((prev) => ({ ...prev, modulo })),
    setAccion: (accion: string | null) => setFiltros((prev) => ({ ...prev, accion })),
    setQ: setQDraft,
    grupos,
    resumen,
    loading,
    refreshing,
    error,
    detalle,
    openDetalle: setDetalle,
    closeDetalle: () => setDetalle(null),
    reload: () => {
      setRefreshing(true);
      return load(true);
    },
  };
}
