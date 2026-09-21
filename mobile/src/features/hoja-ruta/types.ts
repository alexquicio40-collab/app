export type LocalOption = {
  id: string;
  nombre: string;
  direccion: string;
};

export type LocalVisitaForm = {
  key: string;
  local: LocalOption;
  galones: string;
  galonesPrecio: string;
  baldes: string;
  baldesPrecio: string;
  litros: string;
  litrosPrecio: string;
};

export type GastoForm = {
  key: string;
  descripcion: string;
  monto: string;
};

export type HojaRutaFilaData = {
  localNombre: string;
  localDireccion: string;
  galones: number;
  galonesPrecio: number;
  baldes: number;
  baldesPrecio: number;
  litros: number;
  litrosPrecio: number;
};

export type HojaRutaGastoData = {
  descripcion: string;
  monto: number;
};

export type HojaRutaPayloadData = {
  chofer: string;
  operadorAcompanante: string;
  placa: string;
  fecha: string;
  caja: number;
  filas: HojaRutaFilaData[];
  gastos: HojaRutaGastoData[];
};

export type CreateHojaRutaInput = {
  operadorAcompanante: string;
  placa: string;
  fecha: string;
  caja: number;
  totalGalones: number;
  totalBaldes: number;
  totalLitros: number;
  totalGastos: number;
  totalGeneral: number;
  vuelto: number;
  data: HojaRutaPayloadData;
};

export type HojaTotales = {
  sumGalones: number;
  sumBaldes: number;
  sumLitros: number;
  sumGastos: number;
  totalVentas: number;
  totalGeneral: number;
  vuelto: number;
};

export type HojaRutaTab = "nueva" | "historial";

export type HojaHistorialItem = {
  id: string;
  conductorId: string;
  conductorNombre: string;
  operadorAcompanante: string;
  placa: string;
  fecha: string | null;
  caja: number;
  totalGalones: number;
  totalBaldes: number;
  totalLitros: number;
  totalGastos: number;
  totalGeneral: number;
  vuelto: number;
  createdAt: string | null;
};

export type HistorialFilters = {
  fechaDesde: string | null;
  fechaHasta: string | null;
  conductorId: string | null;
};

export type HojaHistorialDetail = HojaHistorialItem & {
  data: HojaRutaPayloadData | null;
};
