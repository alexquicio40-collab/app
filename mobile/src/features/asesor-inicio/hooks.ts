import { fetchHistorial, fetchPendientes } from "@/features/certificados/api";
import {
  createDefaultHistorialFilters,
  createDefaultPendientesFilters,
} from "@/features/certificados/lib/format";
import { fetchLocales, peekLocalesCache } from "@/features/locales/api";
import type { LocalItem } from "@/features/locales/types";
import { fetchRecordatoriosHoy } from "@/features/programacion-alerta/api";
import { hoy } from "@/lib/fecha-lima";
import { matchAsesorTag } from "@/lib/scope-user";
import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useState } from "react";
import { buildAsesorDash, localesDelAsesor } from "./lib/build";
import type { AsesorDash } from "./types";

export function useAsesorInicio() {
  const { user } = useAuth();
  const [locales, setLocales] = useState<LocalItem[]>(() => {
    const cached = peekLocalesCache();
    return cached?.length ? localesDelAsesor(cached, user) : [];
  });
  const [data, setData] = useState<AsesorDash | null>(() => {
    const cached = peekLocalesCache();
    if (!cached?.length) return null;
    return buildAsesorDash(localesDelAsesor(cached, user), [], [], []);
  });
  const [loading, setLoading] = useState(() => !peekLocalesCache()?.length);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (fresh = true) => {
      const cached = peekLocalesCache();
      if (cached?.length) {
        const mine = localesDelAsesor(cached, user);
        setLocales(mine);
        setData(buildAsesorDash(mine, [], [], []));
        setLoading(false);
      } else if (fresh) {
        setLoading(true);
      }
      setError(null);
      try {
        const allLocales = await fetchLocales({
          force: !fresh,
          includeFotos: false,
          onPartial: (partial) => {
            const mine = localesDelAsesor(partial, user);
            setLocales(mine);
            setData(buildAsesorDash(mine, [], [], []));
            setLoading(false);
          },
        });
        const mine = localesDelAsesor(allLocales, user);
        setLocales(mine);
        setData(buildAsesorDash(mine, [], [], []));
        setLoading(false);

        const mes = hoy().slice(0, 8) + "01";
        const [recs, pendientes, historial] = await Promise.all([
          fetchRecordatoriosHoy().catch(() => ({ items: [] })),
          fetchPendientes(createDefaultPendientesFilters()).catch(() => []),
          fetchHistorial({
            ...createDefaultHistorialFilters(),
            fechaDesde: mes,
            fechaHasta: hoy(),
          }).catch(() => []),
        ]);
        const ids = new Set(mine.map((item) => item.id));
        const nombres = new Set(mine.map((item) => item.nombre.trim().toLowerCase()));
        const recOwn = recs.items.filter((item) =>
          nombres.has(item.localNombre.trim().toLowerCase()),
        );
        const pendOwn = pendientes.filter(
          (item) =>
            matchAsesorTag(item.asesorBioClim, user) ||
            ids.has(item.id) ||
            nombres.has(item.nombre.trim().toLowerCase()),
        );
        const histOwn = historial.filter(
          (item) =>
            (item.usuarioId && user?.id != null && String(item.usuarioId) === String(user.id)) ||
            (item.localId ? ids.has(item.localId) : false) ||
            nombres.has(item.localNombre.trim().toLowerCase()) ||
            matchAsesorTag(item.usuarioNombre, user),
        );
        setData(buildAsesorDash(mine, recOwn, pendOwn, histOwn));
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el inicio");
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    data,
    locales,
    loading,
    error,
    reload: () => load(false),
  };
}
