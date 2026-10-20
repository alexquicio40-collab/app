import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";
import {
  createUsuario,
  deleteUsuario,
  fetchUsuario,
  fetchUsuarios,
  peekUsuarios,
  updateUsuario,
  updateUsuarioActivo,
  updateUsuarioPermisos,
  vincularUsuarios,
} from "./api";
import {
  createDefaultUsuariosFilters,
  filterUsuarios,
  hasActiveUsuariosFilters,
} from "./lib/filters";
import type {
  UsuarioFormInput,
  UsuarioItem,
  UsuarioPermisosInput,
  UsuariosFilters,
} from "./types";

function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}: ${message}`);
  else Alert.alert(title, message);
}

async function confirmDelete(nombre: string) {
  if (Platform.OS === "web") return window.confirm(`¿Eliminar el usuario "${nombre}"?`);
  return new Promise<boolean>((resolve) => {
    Alert.alert("Eliminar usuario", `¿Eliminar el usuario "${nombre}"?`, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: "Eliminar", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

export function useUsuariosScreen() {
  const { user } = useAuth();
  const canManage = (user?.rol ?? "").toLowerCase() === "administrador";

  const [usuarios, setUsuarios] = useState<UsuarioItem[]>(() => peekUsuarios() ?? []);
  const [filters, setFilters] = useState<UsuariosFilters>(createDefaultUsuariosFilters);
  const [loading, setLoading] = useState(() => !peekUsuarios());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [permisosId, setPermisosId] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const load = useCallback(async (mode: "boot" | "refresh" = "boot") => {
    if (mode === "boot") {
      const cached = peekUsuarios();
      if (cached) {
        setUsuarios(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }
    } else setRefreshing(true);
    setError(null);
    try {
      const rows = await fetchUsuarios({
        force: mode === "refresh",
        onPartial: (partial) => {
          setUsuarios(partial);
          setLoading(false);
        },
      });
      setUsuarios(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load("boot");
  }, [load]);

  const filtered = useMemo(() => filterUsuarios(usuarios, filters), [usuarios, filters]);

  const editing = useMemo(
    () => (editingId ? usuarios.find((item) => item.id === editingId) ?? null : null),
    [editingId, usuarios],
  );

  const permisosUser = useMemo(
    () => (permisosId ? usuarios.find((item) => item.id === permisosId) ?? null : null),
    [permisosId, usuarios],
  );

  const patchFilters = useCallback((patch: Partial<UsuariosFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(createDefaultUsuariosFilters());
  }, []);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setCreating(true);
  }, []);

  const openEdit = useCallback((id: string) => {
    setCreating(false);
    setEditingId(id);
  }, []);

  const closeForm = useCallback(() => {
    setCreating(false);
    setEditingId(null);
  }, []);

  const openPermisos = useCallback(async (id: string) => {
    setPermisosId(id);
    try {
      const fresh = await fetchUsuario(id);
      if (fresh) {
        setUsuarios((prev) => prev.map((item) => (item.id === id ? fresh : item)));
      }
    } catch {
      // usa el cache local
    }
  }, []);

  const closePermisos = useCallback(() => setPermisosId(null), []);

  const saveUsuario = useCallback(
    async (input: UsuarioFormInput) => {
      setMutating(true);
      try {
        if (editingId) {
          await updateUsuario(editingId, input, editing);
          if (input.vinculadoUsuarioId) {
            await vincularUsuarios(editingId, input.vinculadoUsuarioId, usuarios);
          }
          notify("Listo", "Usuario actualizado");
        } else {
          await createUsuario(input);
          const rows = await fetchUsuarios();
          const created = rows.find((item) => item.usuario === input.usuario.trim());
          if (created?.id && input.vinculadoUsuarioId) {
            await vincularUsuarios(created.id, input.vinculadoUsuarioId, rows);
          }
          notify("Listo", "Usuario creado");
        }
        closeForm();
        await load("refresh");
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo guardar");
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [editingId, editing, usuarios, closeForm, load],
  );

  const savePermisos = useCallback(
    async (input: UsuarioPermisosInput) => {
      if (!permisosUser) return;
      setMutating(true);
      try {
        await updateUsuarioPermisos(permisosUser, input);
        notify("Listo", "Permisos actualizados");
        closePermisos();
        await load("refresh");
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudieron guardar");
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [permisosUser, closePermisos, load],
  );

  const toggleActivo = useCallback(async (item: UsuarioItem) => {
    const next = !item.activo;
    setUsuarios((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, activo: next } : row)),
    );
    try {
      await updateUsuarioActivo(item, next);
    } catch (err) {
      setUsuarios((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, activo: item.activo } : row)),
      );
      notify("Error", err instanceof Error ? err.message : "No se pudo actualizar");
    }
  }, []);

  const removeUsuario = useCallback(async (item: UsuarioItem) => {
    const ok = await confirmDelete(item.nombre);
    if (!ok) return;
    setMutating(true);
    try {
      await deleteUsuario(item.id);
      setUsuarios((prev) => prev.filter((row) => row.id !== item.id));
      notify("Listo", "Usuario eliminado");
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "No se pudo eliminar");
    } finally {
      setMutating(false);
    }
  }, []);

  return {
    canManage,
    loading,
    refreshing,
    error,
    usuarios,
    filtered,
    filters,
    patchFilters,
    clearFilters,
    hasFilters: hasActiveUsuariosFilters(filters),
    creating,
    editing,
    formOpen: creating || editingId != null,
    permisosUser,
    permisosOpen: permisosId != null,
    mutating,
    openCreate,
    openEdit,
    closeForm,
    openPermisos,
    closePermisos,
    saveUsuario,
    savePermisos,
    toggleActivo,
    removeUsuario,
    reload: () => load("refresh"),
  };
}
