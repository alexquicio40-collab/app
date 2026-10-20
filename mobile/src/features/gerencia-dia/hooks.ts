import { peekRoutes } from "@/features/routes/api";
import { hoy, sumarDias } from "@/lib/fecha-lima";
import { createStore } from "@/lib/fast-data";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ampliarFuente, fetchGerenciaDia, fetchRutasFuera } from "./api";
import { acotarRango, buildAdminDash, type FuenteGerencia, type RangoPersonalizado } from "./lib/build";
import type { PeriodoAdmin } from "./types";

const gerenciaStore = createStore<FuenteGerencia>("gerencia-dia");

function seedFuente(): FuenteGerencia {
  const cached = gerenciaStore.peek();
  if (cached) return cached;
  const fecha = hoy();
  return {
    hoy: fecha,
    rutas: peekRoutes({ fecha }) ?? [],
    certificados: null,
    metaMensual: null,
    coberturaDesde: fecha,
    coberturaHasta: fecha,
  };
}

export function useGerenciaDia() {
  const [fuente, setFuente] = useState<FuenteGerencia>(seedFuente);
  const [periodo, setPeriodo] = useState<PeriodoAdmin>("hoy");
  const [rango, setRango] = useState<RangoPersonalizado>({ desde: hoy(), hasta: hoy() });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pedido = useRef("");

  const reload = useCallback(async () => {
    const cached = gerenciaStore.peek();
    if (cached) {
      setFuente(cached);
      setLoading(false);
    }
    try {
      const next = await fetchGerenciaDia({
        onPartial: (partial) => {
          setFuente(partial);
          setLoading(false);
        },
      });
      gerenciaStore.remember(next);
      setFuente(next);
      setError(null);
      pedido.current = "";
    } catch (err) {
      if (!gerenciaStore.peek()) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el día");
      }
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
      setFuente((prev) => {
        if (!prev) return prev;
        const next = ampliarFuente(prev, grupos.flat(), rango.desde, rango.hasta);
        gerenciaStore.remember(next);
        return next;
      });
    })();
    return () => {
      vivo = false;
    };
  }, [fuente, periodo, rango.desde, rango.hasta]);

  const data = useMemo(
    () => buildAdminDash(fuente, periodo, rango),
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
