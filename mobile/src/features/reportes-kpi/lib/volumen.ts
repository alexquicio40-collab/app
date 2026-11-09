import { LIMA_DISTRITOS } from "@/features/routes/lib/format";
import type { RouteItem } from "@/features/routes/types";

export type VolumenProveedor = {
  nombre: string;
  distrito: string;
  litros: number;
  recojos: number;
};

export type VolumenDistrito = {
  nombre: string;
  litros: number;
  recojos: number;
};

export type VolumenAnalisis = {
  distritoTop: VolumenDistrito | null;
  distritos: VolumenDistrito[];
  proveedoresTop: VolumenProveedor[];
  anclas: VolumenProveedor[];
  anclasTotal: number;
};

function distritoDe(direccion: string) {
  const text = direccion.toLowerCase();
  const ordered = [...LIMA_DISTRITOS].sort((a, b) => b.length - a.length);
  for (const item of ordered) {
    if (item.toLowerCase() === "lima") continue;
    if (text.includes(item.toLowerCase())) return item;
  }
  if (text.includes("lima")) return "Lima";
  return "Sin distrito";
}

export function analizarVolumen(rutas: RouteItem[]): VolumenAnalisis {
  const porDistrito = new Map<string, VolumenDistrito>();
  const porProveedor = new Map<string, VolumenProveedor>();

  for (const row of rutas) {
    const litros = row.litraje ?? 0;
    const nombre = row.localNombre?.trim() || "Sin proveedor";
    const distrito = distritoDe(row.localDireccion || "");
    const d = porDistrito.get(distrito) ?? { nombre: distrito, litros: 0, recojos: 0 };
    d.litros += litros;
    d.recojos += 1;
    porDistrito.set(distrito, d);

    const p = porProveedor.get(nombre) ?? { nombre, distrito, litros: 0, recojos: 0 };
    p.litros += litros;
    p.recojos += 1;
    porProveedor.set(nombre, p);
  }

  const distritos = [...porDistrito.values()].sort(
    (a, b) => b.litros - a.litros || b.recojos - a.recojos,
  );
  const proveedores = [...porProveedor.values()].sort(
    (a, b) => b.litros - a.litros || b.recojos - a.recojos,
  );
  const conVolumen = proveedores.filter((item) => item.litros > 0);
  const cupo = Math.max(1, Math.min(10, Math.ceil(conVolumen.length * 0.2)));
  const anclas = conVolumen.slice(0, conVolumen.length ? cupo : 0);

  return {
    distritoTop: distritos[0] ?? null,
    distritos: distritos.slice(0, 8),
    proveedoresTop: conVolumen.slice(0, 8),
    anclas,
    anclasTotal: anclas.length,
  };
}
