/**
 * Consulta RUC externa — mismo host y contrato que Flutter.
 * Fetch sin auth de sesión (el backend no alcanza ese host).
 */
const RUC_API = "http://161.132.234.157:82/api/DatosRuc";

export type RucData = {
  ruc: string;
  razonSocial: string;
  direccion: string;
};

export function isValidRuc(value: string) {
  return /^\d{11}$/.test(value.trim());
}

/** Solo dígitos, máx. 11. */
export function sanitizeRucInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export async function consultarRuc(ruc: string): Promise<RucData> {
  const r = ruc.trim();
  if (!isValidRuc(r)) {
    throw new Error("El RUC debe tener exactamente 11 dígitos");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`${RUC_API}?Ruc=${encodeURIComponent(r)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`La API de RUC devolvió ${response.status}`);
    }

    const raw = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(raw) as unknown;
    } catch {
      throw new Error("Respuesta de la API no es JSON");
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Respuesta inesperada de la API de RUC");
    }

    const m = data as Record<string, unknown>;
    const razonSocial = String(m.RazonSocial ?? m.razon_social ?? "").trim();
    if (!razonSocial) {
      throw new Error("RUC no encontrado");
    }

    return {
      ruc: String(m.Ruc ?? m.ruc ?? r),
      razonSocial,
      direccion: String(m.Direccion ?? m.direccion ?? "").trim(),
    };
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new Error("La API de RUC no respondió a tiempo (timeout).");
      }
      if (/Failed to fetch|NetworkError|network/i.test(err.message)) {
        throw new Error("No hay conexión con la API de RUC. Verifica tu internet.");
      }
      throw err;
    }
    throw new Error("Error consultando RUC");
  } finally {
    clearTimeout(timer);
  }
}
