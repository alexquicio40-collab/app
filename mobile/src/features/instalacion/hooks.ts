import { useCallback, useEffect, useMemo, useState } from "react";
import { INSTALACION_PERMISSIONS } from "./lib/permissions-catalog";
import { readAppPermission, requestAppPermission } from "./lib/request-permissions";
import { isInstalacionDone, markInstalacionDone } from "./lib/storage";
import type { PermissionGrant, PermissionKind, PermissionRow } from "./types";

function withStatus(
  statusMap: Record<PermissionKind, PermissionGrant>,
): PermissionRow[] {
  return INSTALACION_PERMISSIONS.map((item) => ({
    ...item,
    status: statusMap[item.kind] ?? "pending",
  }));
}

const PENDING_MAP: Record<PermissionKind, PermissionGrant> = {
  location: "pending",
  camera: "pending",
  photos: "pending",
};

/** Gate de arranque: ¿mostrar instalación o ir al login? */
export function useInstalacionGate() {
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const done = await isInstalacionDone().catch(() => false);
      if (!alive) return;
      setCompleted(done);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { ready, completed };
}

/** Flujo de la pantalla: estado visual + pedir permisos + finalizar. */
export function useInstalacionFlow(onFinished: () => void) {
  const [statusMap, setStatusMap] = useState(PENDING_MAP);
  const [busy, setBusy] = useState(false);
  const [activeKind, setActiveKind] = useState<PermissionKind | null>(null);
  const [booting, setBooting] = useState(true);

  const rows = useMemo(() => withStatus(statusMap), [statusMap]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const next: Record<PermissionKind, PermissionGrant> = { ...PENDING_MAP };
      for (const item of INSTALACION_PERMISSIONS) {
        const kind: PermissionKind = item.kind;
        next[kind] = await readAppPermission(kind);
      }
      if (!alive) return;
      setStatusMap(next);
      setBooting(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const grantedCount = useMemo(
    () => rows.filter((row) => row.status === "granted" || row.status === "unavailable").length,
    [rows],
  );

  const requestOne = useCallback(async (kind: PermissionKind) => {
    setActiveKind(kind);
    const result = await requestAppPermission(kind);
    setStatusMap((prev) => ({ ...prev, [kind]: result }));
    setActiveKind(null);
    return result;
  }, []);

  const continueSetup = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      for (const item of INSTALACION_PERMISSIONS) {
        const kind: PermissionKind = item.kind;
        setActiveKind(kind);
        const result = await requestAppPermission(kind);
        setStatusMap((prev) => ({ ...prev, [kind]: result }));
      }
      await markInstalacionDone();
      onFinished();
    } finally {
      setBusy(false);
      setActiveKind(null);
    }
  }, [busy, onFinished]);

  const skipSetup = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await markInstalacionDone();
      onFinished();
    } finally {
      setBusy(false);
    }
  }, [busy, onFinished]);

  return {
    rows,
    booting,
    busy,
    activeKind,
    grantedCount,
    total: INSTALACION_PERMISSIONS.length,
    requestOne,
    continueSetup,
    skipSetup,
  };
}
