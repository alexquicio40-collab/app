import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";
import {
  autorizarDispositivo,
  bloquearDispositivo,
  cerrarSesionRemota,
  cerrarSesionesUsuario,
  eliminarDispositivo,
  fetchDispositivos,
  fetchSesiones,
  peekDispositivos,
  peekSesiones,
  registrarDispositivo,
} from "./api";
import { getDispositivo } from "./lib/dispositivo";
import { matchQuery } from "./lib/format";
import type { DispositivoInput, DispositivoItem, SesionItem, SesionesTab } from "./types";

function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}: ${message}`);
  else Alert.alert(title, message);
}

async function confirm(title: string, message: string) {
  if (Platform.OS === "web") return window.confirm(`${title}\n${message}`);
  return new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: "Sí", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

export function useSesionesScreen() {
  const { user } = useAuth();
  const canManage = (user?.rol ?? "").toLowerCase() === "administrador";

  const [tab, setTab] = useState<SesionesTab>("sesiones");
  const [q, setQ] = useState("");
  const [soloActivas, setSoloActivas] = useState(true);
  const [sesiones, setSesiones] = useState<SesionItem[]>(() => peekSesiones() ?? []);
  const [dispositivos, setDispositivos] = useState<DispositivoItem[]>(() => peekDispositivos() ?? []);
  const [huella, setHuella] = useState("");
  const [loading, setLoading] = useState(() => !peekSesiones() && !peekDispositivos());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    const cachedSes = peekSesiones();
    const cachedDevs = peekDispositivos();
    if (cachedSes) setSesiones(cachedSes);
    if (cachedDevs) setDispositivos(cachedDevs);
    if (cachedSes || cachedDevs) setLoading(false);
    else if (!silent) setLoading(true);
    setError(null);
    try {
      const [ses, devs, yo] = await Promise.all([
        fetchSesiones({ force: silent }),
        fetchDispositivos({ force: silent }),
        getDispositivo(),
      ]);
      setSesiones(ses);
      setDispositivos(devs);
      setHuella(yo.huella);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canManage]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => {
    setRefreshing(true);
    return load(true);
  }, [load]);

  const query = q.trim().toLowerCase();
  const sesionesFiltradas = useMemo(
    () =>
      sesiones.filter((item) => {
        if (soloActivas && !item.abierta) return false;
        return matchQuery([item.usuario, item.login, item.dispositivo, item.ip].join(" "), query);
      }),
    [query, sesiones, soloActivas],
  );
  const dispositivosFiltrados = useMemo(
    () =>
      dispositivos.filter((item) =>
        matchQuery([item.nombre, item.usuario, item.plataforma, item.huella, item.codigo].join(" "), query),
      ),
    [dispositivos, query],
  );

  const run = useCallback(
    async (fn: () => Promise<unknown>, ok: string) => {
      if (busy) return;
      setBusy(true);
      try {
        await fn();
        await load(true);
      } catch (err) {
        notify("Sesiones", err instanceof Error ? err.message : ok);
      } finally {
        setBusy(false);
      }
    },
    [busy, load],
  );

  const onCerrar = useCallback(
    async (item: SesionItem) => {
      if (item.mia) {
        notify("Sesiones", "No puedes cerrar la sesión que estás usando");
        return;
      }
      if (!(await confirm("Cerrar sesión", `¿Cerrar la sesión de ${item.usuario}?`))) return;
      await run(() => cerrarSesionRemota(item.id), "Sesión cerrada");
    },
    [run],
  );

  const onCerrarTodas = useCallback(
    async (item: SesionItem) => {
      if (!(await confirm("Cerrar todas", `¿Cerrar todas las sesiones de ${item.usuario}?`))) return;
      await run(() => cerrarSesionesUsuario(item.usuarioId), "Sesiones cerradas");
    },
    [run],
  );

  const onBloquear = useCallback(
    async (item: DispositivoItem) => {
      if (!(await confirm("Bloquear", `¿Bloquear ${item.nombre}?`))) return;
      await run(() => bloquearDispositivo(item.id), "Dispositivo bloqueado");
    },
    [run],
  );

  const onAutorizar = useCallback(
    (item: DispositivoItem) => run(() => autorizarDispositivo(item.id), "Dispositivo autorizado"),
    [run],
  );

  const onRegistrar = useCallback(
    async (input: DispositivoInput) => {
      setTab("dispositivos");
      await run(() => registrarDispositivo({ ...input, huella: undefined }), "Dispositivo registrado");
    },
    [run],
  );

  const onEliminar = useCallback(
    async (item: DispositivoItem) => {
      if (!(await confirm("Quitar", `¿Quitar ${item.nombre} de la lista?`))) return;
      await run(() => eliminarDispositivo(item.id), "Dispositivo quitado");
    },
    [run],
  );

  return {
    canManage,
    tab,
    setTab,
    q,
    setQ,
    soloActivas,
    setSoloActivas,
    huella,
    loading,
    refreshing,
    error,
    busy,
    sesiones: sesionesFiltradas,
    dispositivos: dispositivosFiltrados,
    activas: sesiones.filter((item) => item.abierta).length,
    totalDispositivos: dispositivos.length,
    reload,
    onCerrar,
    onCerrarTodas,
    onBloquear,
    onAutorizar,
    onRegistrar,
    onEliminar,
  };
}
