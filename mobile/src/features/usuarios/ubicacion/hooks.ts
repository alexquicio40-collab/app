import type { UsuarioItem } from "../types";
import { fetchPuntosUsuarios } from "./api";
import type { UsuarioPunto } from "./types";
import { useCallback, useEffect, useState } from "react";

const POLL_MS = 5000;

export function useUsuariosUbicacion(usuarios: UsuarioItem[]) {
  const [puntos, setPuntos] = useState<UsuarioPunto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (boot = false) => {
    if (boot) setLoading(true);
    try {
      const rows = await fetchPuntosUsuarios(usuarios);
      setPuntos(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las ubicaciones");
    } finally {
      setLoading(false);
    }
  }, [usuarios]);

  useEffect(() => {
    void load(true);
    const tick = setInterval(() => void load(false), POLL_MS);
    return () => clearInterval(tick);
  }, [load]);

  const vivos = puntos.filter((item) => item.vivo).length;

  return {
    puntos,
    selectedId,
    setSelectedId,
    vivos,
    loading,
    error,
    reload: () => load(true),
  };
}
