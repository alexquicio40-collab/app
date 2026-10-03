import { matchAsesorTag, seesAllUsers } from "@/lib/scope-user";
import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";
import {
  createPlantaRegistro,
  deletePlantaRegistro,
  fetchAsesores,
  fetchPlantaRegistros,
  updatePlantaRegistro,
} from "./api";
import {
  createDefaultPlantaFilters,
  filterPlantaRegistros,
  hasActivePlantaFilters,
} from "./lib/format";
import type {
  AsesorOption,
  PlantaFilters,
  PlantaFormInput,
  PlantaRegistro,
} from "./types";

function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}: ${message}`);
  else Alert.alert(title, message);
}

async function confirmDelete(nombre: string) {
  if (Platform.OS === "web") return window.confirm(`¿Eliminar el registro de "${nombre}"?`);
  return new Promise<boolean>((resolve) => {
    Alert.alert("Eliminar registro", `¿Eliminar el registro de "${nombre}"?`, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: "Eliminar", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

export function usePlantaScreen() {
  const { user } = useAuth();
  const rol = (user?.rol ?? "").toLowerCase();
  const canManage = rol === "administrador" || rol === "planta" || rol === "asesor";

  const [registros, setRegistros] = useState<PlantaRegistro[]>([]);
  const [asesores, setAsesores] = useState<AsesorOption[]>([]);
  const [filters, setFilters] = useState<PlantaFilters>(createDefaultPlantaFilters);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const load = useCallback(async (mode: "boot" | "refresh" = "boot") => {
    if (mode === "boot") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [rows, asesoresRows] = await Promise.all([
        fetchPlantaRegistros(),
        fetchAsesores().catch(() => [] as AsesorOption[]),
      ]);
      const allPlanta = seesAllUsers(rol) || rol === "planta";
      const mine = allPlanta
        ? rows
        : rows.filter((item) => matchAsesorTag(item.asesorComercial, user));
      setRegistros(mine);
      setAsesores(allPlanta ? asesoresRows : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los registros");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rol, user]);

  useEffect(() => {
    void load("boot");
  }, [load]);

  const filtered = useMemo(
    () => filterPlantaRegistros(registros, filters),
    [registros, filters],
  );

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, item) => {
        acc.litros += item.cantidadLitraje;
        acc.baldes += item.cantidadBaldesVacios;
        acc.galoneras += item.cantidadGalonerasVacias;
        return acc;
      },
      { litros: 0, baldes: 0, galoneras: 0 },
    );
  }, [filtered]);

  const editing = useMemo(
    () => (editingId ? registros.find((item) => item.id === editingId) ?? null : null),
    [editingId, registros],
  );

  const selected = useMemo(
    () => (selectedId ? registros.find((item) => item.id === selectedId) ?? null : null),
    [selectedId, registros],
  );

  const patchFilters = useCallback((patch: Partial<PlantaFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(createDefaultPlantaFilters());
  }, []);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setCreating(true);
  }, []);

  const openEdit = useCallback((id: string) => {
    setCreating(false);
    setSelectedId(null);
    setEditingId(id);
  }, []);

  const closeForm = useCallback(() => {
    setCreating(false);
    setEditingId(null);
  }, []);

  const openDetail = useCallback((id: string) => setSelectedId(id), []);
  const closeDetail = useCallback(() => setSelectedId(null), []);

  const saveRegistro = useCallback(
    async (input: PlantaFormInput) => {
      setMutating(true);
      try {
        if (editingId) {
          await updatePlantaRegistro(editingId, input);
          notify("Listo", "Registro actualizado");
        } else {
          await createPlantaRegistro(input);
          notify("Listo", "Registro creado");
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
    [editingId, closeForm, load],
  );

  const removeRegistro = useCallback(
    async (item: PlantaRegistro) => {
      const ok = await confirmDelete(item.nombreProveedor);
      if (!ok) return;
      setMutating(true);
      try {
        await deletePlantaRegistro(item.id);
        setRegistros((prev) => prev.filter((row) => row.id !== item.id));
        setSelectedId((prev) => (prev === item.id ? null : prev));
        notify("Listo", "Registro eliminado");
      } catch (err) {
        notify("Error", err instanceof Error ? err.message : "No se pudo eliminar");
      } finally {
        setMutating(false);
      }
    },
    [],
  );

  return {
    canManage,
    loading,
    refreshing,
    error,
    registros,
    filtered,
    totals,
    asesores,
    filters,
    patchFilters,
    clearFilters,
    hasFilters: hasActivePlantaFilters(filters),
    creating,
    editing,
    formOpen: creating || editingId != null,
    selected,
    mutating,
    openCreate,
    openEdit,
    closeForm,
    openDetail,
    closeDetail,
    saveRegistro,
    removeRegistro,
    reload: () => load("refresh"),
  };
}
