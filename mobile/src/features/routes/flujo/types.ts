export type VehicleType = "ligero" | "pesado";

export type FinalizacionConfig = {
  requiereLitraje: boolean;
  requiereBaldesVacios: boolean;
  requiereGalonerasVacias: boolean;
  requiereFotoGuia: boolean;
  requiereFotoMercaderia: boolean;
  requiereNotas: boolean;
};

export type PendingFoto = {
  key: string;
  uri: string;
  name: string;
  mimeType: string;
  bytes: number | null;
};

export type UploadProgress = {
  loaded: number;
  total: number;
};

export type FinalizarRutaInput = {
  cantidadLitraje: number;
  cantidadBaldesVacios: number;
  cantidadGalonerasVacias: number;
  observaciones: string;
  fotoGuia: PendingFoto | null;
  fotoMercaderia: PendingFoto | null;
};

export type FinalizarFieldErrors = Partial<
  Record<
    | "cantidadLitraje"
    | "cantidadBaldesVacios"
    | "cantidadGalonerasVacias"
    | "fotoGuia"
    | "fotoMercaderia"
    | "observaciones"
    | "form",
    string
  >
>;

export type StartRutaPayload = {
  vehicleType: VehicleType;
  companions: string[];
};
