import type { LocalItem } from "@/features/locales/types";
import type { RouteItem } from "@/features/routes/types";
import { Platform } from "react-native";

/** Solo AVD/genérico. Un teléfono real nunca entra aquí. */
export function esEmuladorAndroid() {
  if (Platform.OS !== "android") return false;
  const c = Platform.constants as { Fingerprint?: string; Model?: string; Brand?: string; Manufacturer?: string };
  const blob = [c.Fingerprint, c.Model, c.Brand, c.Manufacturer].join(" ").toLowerCase();
  return (
    blob.includes("generic") ||
    blob.includes("sdk_gphone") ||
    blob.includes("emulator") ||
    blob.includes("goldfish") ||
    blob.includes("ranchu")
  );
}

/** Ruta de prueba Lima centro → Plaza San Miguel para ver el trazado en el AVD. */
export function rutaDemoEmulador(): RouteItem {
  return {
    id: "emu-demo-1",
    conductorId: "1",
    conductorNombre: "Emulador",
    creadoPorId: "1",
    creadoPorNombre: "Emulador",
    editadoPorNombre: "",
    localId: "emu-local",
    localNombre: "Plaza San Miguel",
    localDireccion: "Av. La Marina 2000, San Miguel",
    localLatitud: -12.0772,
    localLongitud: -77.0851,
    fechaAsignacion: "",
    observaciones: "",
    estado: "en_ruta",
    orden: 1,
    fechaCompletada: null,
    litraje: null,
    baldesVacios: null,
    galonerasVacias: null,
    fotoGuia: null,
    fotoMercaderia: null,
    fotoPago: null,
    encargadoNombre: "",
    encargadoTelefono: "",
    horarioEntrada: "",
    asesorBioClim: "",
    telefonoAsesor: "",
    referencia: "",
    tipoEnvase: "",
    cantidadEnvases: null,
    cantidadBidonesAzules: null,
    cantidadBidonesBlancos: null,
    bidonPasadoPor: null,
    precioLitro: null,
    precioBalde: null,
    precioGalonera: null,
    operadoresVenPrecio: false,
    metodosPago: [],
    prioridad: "media",
  };
}

function localDemo(
  id: string,
  nombre: string,
  direccion: string,
  lat: number,
  lng: number,
  extra?: Partial<LocalItem>,
): LocalItem {
  return {
    id,
    nombre,
    direccion,
    direccionCert: "",
    direccionFiscal: "",
    direccionComercial: "",
    latitud: lat,
    longitud: lng,
    horarioEntrada: "08:00-17:00",
    asesorBioClim: "Emulador",
    telefonoAsesor: "",
    encargadoNombre: "Encargado",
    encargadoTelefono: "",
    referencia: "",
    ruc: "",
    razonSocial: nombre,
    necesitaCertificacion: false,
    estadoCertificacion: null,
    archivoCertificado: null,
    activo: true,
    tipoEnvase: "",
    cantidadEnvases: null,
    cantidadBidonesAzules: null,
    cantidadBidonesBlancos: null,
    bidonReal: null,
    bidonPasadoPor: null,
    precioLitro: null,
    precioBalde: null,
    precioGalonera: null,
    operadoresVenPrecio: false,
    operadoresVenTelefono: true,
    frecuencias: ["lun", "mie"],
    metodosPago: [],
    fotos: [],
    prioridad: "media",
    restringido: false,
    createdAt: null,
    ...extra,
  };
}

/** Lista inmediata en el AVD para medir que Locales pinte sin esperar API. */
export function localesDemoEmulador(): LocalItem[] {
  return [
    localDemo("emu-l1", "Plaza San Miguel", "Av. La Marina 2000, San Miguel", -12.0772, -77.0851, { prioridad: "alta" }),
    localDemo("emu-l2", "Real Plaza Salaverry", "Av. Salaverry 2370, Jesús María", -12.0896, -77.0524),
    localDemo("emu-l3", "Jockey Plaza", "Av. Javier Prado Este 4200, Surco", -12.0865, -76.9778, { prioridad: "alta" }),
    localDemo("emu-l4", "MegaPlaza Independencia", "Av. Alfredo Mendiola 3698", -11.9936, -77.0612),
    localDemo("emu-l5", "Plaza Norte", "Tomas Valle / Panamericana Norte", -12.0068, -77.0619),
    localDemo("emu-l6", "Mall del Sur", "Panamericana Sur km 16, SJM", -12.1568, -76.9832),
    localDemo("emu-l7", "Larcomar", "Malecón de la Reserva 610, Miraflores", -12.132, -77.0305, {
      necesitaCertificacion: true,
      estadoCertificacion: "pendiente",
    }),
    localDemo("emu-l8", "Plaza San Isidro", "Av. El Derby 254, Surco", -12.0988, -76.9746),
    localDemo("emu-l9", "Caminos del Inca", "Av. Caminos del Inca 210, Surco", -12.1134, -76.9912),
    localDemo("emu-l10", "Mercado Central", "Jr. Ucayali 600, Cercado", -12.0488, -77.0278),
    localDemo("emu-l11", "Wong Ovalo Gutiérrez", "Av. Santa Cruz 771, Miraflores", -12.1118, -77.0366),
    localDemo("emu-l12", "Metro La Marina", "Av. La Marina 2055, San Miguel", -12.0788, -77.0871),
  ];
}
