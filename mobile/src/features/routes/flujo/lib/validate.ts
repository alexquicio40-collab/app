import type { FinalizacionConfig, FinalizarFieldErrors, FinalizarRutaInput } from "../types";

const MAX_PHOTO_BYTES = 1024 * 1024 * 1024;

export function emptyFinalizacionConfig(): FinalizacionConfig {
  return {
    requiereLitraje: false,
    requiereBaldesVacios: false,
    requiereGalonerasVacias: false,
    requiereFotoGuia: false,
    requiereFotoMercaderia: false,
    requiereNotas: false,
  };
}

export function hasAnyFinalizacionField(config: FinalizacionConfig) {
  return (
    config.requiereLitraje ||
    config.requiereBaldesVacios ||
    config.requiereGalonerasVacias ||
    config.requiereFotoGuia ||
    config.requiereFotoMercaderia ||
    config.requiereNotas
  );
}

/**
 * Validación del modal finalizar (paridad Flutter mapa_screen).
 * - Cantidades: se muestran si el flag está on; valor >= 0.
 * - Fotos / notas: obligatorias si el flag está on.
 */
export function validateFinalizarRuta(
  input: FinalizarRutaInput,
  config: FinalizacionConfig,
): { ok: boolean; errors: FinalizarFieldErrors; missing: string[] } {
  const errors: FinalizarFieldErrors = {};
  const missing: string[] = [];

  const litraje = Number.isFinite(input.cantidadLitraje) ? input.cantidadLitraje : 0;
  const baldes = Number.isFinite(input.cantidadBaldesVacios) ? input.cantidadBaldesVacios : 0;
  const galoneras = Number.isFinite(input.cantidadGalonerasVacias)
    ? input.cantidadGalonerasVacias
    : 0;

  if (config.requiereLitraje && litraje < 0) {
    errors.cantidadLitraje = "Cant. litraje inválida";
    missing.push("Cant. Litraje");
  }
  if (config.requiereBaldesVacios && baldes < 0) {
    errors.cantidadBaldesVacios = "Baldes inválidos";
    missing.push("Baldes Vacíos");
  }
  if (config.requiereGalonerasVacias && galoneras < 0) {
    errors.cantidadGalonerasVacias = "Galoneras inválidas";
    missing.push("Galoneras Vacías");
  }

  if (config.requiereFotoGuia && !input.fotoGuia) {
    errors.fotoGuia = "Foto de la guía requerida";
    missing.push("Foto de la Guía");
  }
  if (config.requiereFotoMercaderia && !input.fotoMercaderia) {
    errors.fotoMercaderia = "Foto de mercadería requerida";
    missing.push("Foto de la Mercadería");
  }
  if (config.requiereNotas && !input.observaciones.trim()) {
    errors.observaciones = "Las notas son requeridas";
    missing.push("Notas");
  }

  if (input.fotoGuia && estimateTooBig(input.fotoGuia.uri)) {
    errors.fotoGuia = "Máximo 1 GB";
  }
  if (input.fotoMercaderia && estimateTooBig(input.fotoMercaderia.uri)) {
    errors.fotoMercaderia = "Máximo 1 GB";
  }

  return {
    ok: missing.length === 0 && !errors.fotoGuia && !errors.fotoMercaderia,
    errors,
    missing,
  };
}

/** Heurística: fileSize en asset se valida en el picker; aquí solo placemark. */
function estimateTooBig(_uri: string) {
  return false;
}

export { MAX_PHOTO_BYTES };
