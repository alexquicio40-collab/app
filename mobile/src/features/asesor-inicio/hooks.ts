import { createDefaultHistorialFilters, createDefaultPendientesFilters } from "@/features/certificados/lib/format";
import { fetchHistorial, fetchPendientes } from "@/features/certificados/api";
import { fetchLocales } from "@/features/locales/api";
import type { LocalItem } from "@/features/locales/types";
import { fetchRecordatoriosHoy } from "@/features/programacion-alerta/api";
import { matchAsesorTag } from "@/lib/scope-user";
import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useState } from "react";
import { buildAsesorDash, localesDelAsesor } from "./lib/build";
import type { AsesorDash } from "./types";

export function useAsesorInicio() {
  const { user } = useAuth();
  const [data, setData] = useState<AsesorDash | null>(null);
  const [locales, setLocales] = useState<LocalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (fresh = true) => {
      if (fresh) setLoading(true);
      setError(null);
      try {
        const [allLocales, recs, pendientes, historial] = await Promise.all([
          fetchLocales({ force: !fresh, includeFotos: false }),
          fetchRecordatoriosHoy().catch(() => ({ items: [] })),
          fetchPendientes(createDefaultPendientesFilters()).catch(() => []),
          fetchHistorial(createDefaultHistorialFilters()).catch(() => []),
        ]);
        const mine = localesDelAsesor(allLocales, user);
        const ids = new Set(mine.map((item) => item.id));
        const nombres = new Set(mine.map((item) => item.nombre.trim().toLowerCase()));
        const recOwn = recs.items.filter((item) => nombres.has(item.localNombre.trim().toLowerCase()));
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
        setLocales(mine);
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
