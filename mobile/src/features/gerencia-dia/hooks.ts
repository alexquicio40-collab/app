import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ampliarFuente, fetchGerenciaDia, fetchRutasFuera } from "./api";
import { acotarRango, buildAdminDash, type FuenteGerencia, type RangoPersonalizado } from "./lib/build";
import type { PeriodoAdmin } from "./types";
import { hoy, sumarDias } from "@/lib/fecha-lima";

export function useGerenciaDia() {
  const [fuente, setFuente] = useState<FuenteGerencia | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoAdmin>("hoy");
  const [rango, setRango] = useState<RangoPersonalizado>({ desde: hoy(), hasta: hoy() });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pedido = useRef("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setFuente(await fetchGerenciaDia());
      setError(null);
      pedido.current = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el día");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  useEffect(() => {
    if (!fuente || periodo !== "personalizado") return;
    const antes = rango.desde < fuente.coberturaDesde;
    const despues = rango.hasta > fuente.coberturaHasta;
    if (!antes && !despues) return;
    const key = `${rango.desde}|${rango.hasta}|${fuente.coberturaDesde}|${fuente.coberturaHasta}`;
    if (pedido.current === key) return;
    pedido.current = key;
    let vivo = true;
    void (async () => {
      const grupos = await Promise.all([
        antes ? fetchRutasFuera(rango.desde, sumarDias(fuente.coberturaDesde, -1)) : Promise.resolve([]),
        despues ? fetchRutasFuera(sumarDias(fuente.coberturaHasta, 1), rango.hasta) : Promise.resolve([]),
      ]);
      if (!vivo) return;
      setFuente((prev) => (prev ? ampliarFuente(prev, grupos.flat(), rango.desde, rango.hasta) : prev));
    })();
    return () => {
      vivo = false;
    };
  }, [fuente, periodo, rango.desde, rango.hasta]);

  const data = useMemo(
    () => (fuente ? buildAdminDash(fuente, periodo, rango) : null),
    [fuente, periodo, rango],
  );

  const elegirPeriodo = useCallback((next: PeriodoAdmin) => {
    setPeriodo(next);
  }, []);

  const elegirRango = useCallback((desde: string, hasta: string) => {
    setRango(acotarRango(desde, hasta));
    setPeriodo("personalizado");
  }, []);

  return { data, periodo, rango, elegirPeriodo, elegirRango, loading, error, reload };
}
