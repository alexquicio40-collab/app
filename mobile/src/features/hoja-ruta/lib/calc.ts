import type {
  GastoForm,
  HojaRutaFilaData,
  HojaRutaGastoData,
  HojaTotales,
  LocalVisitaForm,
} from "../types";

export function parseNum(value: string) {
  const t = value.trim();
  if (!t) return 0;
  const n = Number.parseFloat(t.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/** Solo dígitos, punto o coma. */
export function sanitizeMoneyInput(value: string) {
  return value.replace(/[^0-9.,]/g, "");
}

export function filaTotales(fila: LocalVisitaForm) {
  const galones = parseNum(fila.galones) * parseNum(fila.galonesPrecio);
  const baldes = parseNum(fila.baldes) * parseNum(fila.baldesPrecio);
  const litros = parseNum(fila.litros) * parseNum(fila.litrosPrecio);
  return {
    galones,
    baldes,
    litros,
    total: galones + baldes + litros,
  };
}

export function computeTotales(
  filas: LocalVisitaForm[],
  gastos: GastoForm[],
  caja: string,
): HojaTotales {
  let sumGalones = 0;
  let sumBaldes = 0;
  let sumLitros = 0;
  for (const fila of filas) {
    const t = filaTotales(fila);
    sumGalones += t.galones;
    sumBaldes += t.baldes;
    sumLitros += t.litros;
  }
  const sumGastos = gastos.reduce((acc, item) => acc + parseNum(item.monto), 0);
  const totalVentas = sumGalones + sumBaldes + sumLitros;
  const totalGeneral = totalVentas + sumGastos;
  const cajaNum = parseNum(caja);
  return {
    sumGalones,
    sumBaldes,
    sumLitros,
    sumGastos,
    totalVentas,
    totalGeneral,
    vuelto: cajaNum - totalGeneral,
  };
}

export function toFilaData(fila: LocalVisitaForm): HojaRutaFilaData {
  return {
    localNombre: fila.local.nombre,
    localDireccion: fila.local.direccion,
    galones: parseNum(fila.galones),
    galonesPrecio: parseNum(fila.galonesPrecio),
    baldes: parseNum(fila.baldes),
    baldesPrecio: parseNum(fila.baldesPrecio),
    litros: parseNum(fila.litros),
    litrosPrecio: parseNum(fila.litrosPrecio),
  };
}

export function toGastoData(gasto: GastoForm): HojaRutaGastoData {
  return {
    descripcion: gasto.descripcion.trim(),
    monto: parseNum(gasto.monto),
  };
}
