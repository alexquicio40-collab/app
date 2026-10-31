/**
 * Reloj de Lima, Perú. La misma regla que fecha-lima.js del servidor:
 * no depende de la zona del teléfono ni del país donde está el hosting.
 */

const ZONA = "America/Lima";

type Partes = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
};

function partes(instante: Date = new Date()): Partes {
  const date = Number.isNaN(instante.getTime()) ? new Date() : instante;
  const bag: Partes = {
    year: "0000",
    month: "01",
    day: "01",
    hour: "00",
    minute: "00",
    second: "00",
  };
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  for (const part of fmt.formatToParts(date)) {
    if (part.type in bag) bag[part.type as keyof Partes] = part.value;
  }
  if (bag.hour === "24") bag.hour = "00";
  return bag;
}

function padFecha(p: Partes) {
  return `${p.year}-${p.month}-${p.day}`;
}

/** YYYY-MM-DD HH:mm:ss en Lima. */
export function ahora(instante?: Date) {
  const p = partes(instante ?? new Date());
  return `${padFecha(p)} ${p.hour}:${p.minute}:${p.second}`;
}

/** YYYY-MM-DD en Lima. */
export function hoy(instante?: Date) {
  return padFecha(partes(instante ?? new Date()));
}

export function sumarDias(fechaIso: string, dias: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(fechaIso);
  if (!match) return hoy();
  const utc = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  utc.setUTCDate(utc.getUTCDate() + (Number(dias) || 0));
  const mes = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(utc.getUTCDate()).padStart(2, "0");
  return `${utc.getUTCFullYear()}-${mes}-${dia}`;
}

/** Día de calendario. Un texto sin zona se conserva. Un instante con Z pasa a Lima. */
export function dia(valor?: string | null) {
  if (valor == null || !String(valor).trim()) return hoy();
  const raw = String(valor).trim();
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw)) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return hoy(parsed);
  }
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
  return match ? match[1] : hoy();
}

/**
 * YYYY-MM-DD HH:mm:ss para enviar al servidor.
 * Reloj de pared (sin Z) se envía igual. Un instante se convierte a Lima.
 */
export function fechaHora(valor?: string | null) {
  if (valor == null || !String(valor).trim()) return ahora();
  const raw = String(valor).trim();
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw)) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return ahora(parsed);
  }
  const match = /^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(raw);
  if (!match) return ahora();
  return `${match[1]} ${match[2] || "00"}:${match[3] || "00"}:${match[4] || "00"}`;
}

/** Valor de input datetime-local: YYYY-MM-DDTHH:mm:ss en Lima. */
export function fechaHoraInput(valor?: string | null) {
  return fechaHora(valor).replace(" ", "T");
}

/** Día de una DATE/texto. Un YYYY-MM-DD no se corre. Un instante Z sí pasa a Lima. */
export function diaSql(valor?: string | Date | null) {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    if (valor.getUTCHours() === 0 && valor.getUTCMinutes() === 0 && valor.getUTCSeconds() === 0) {
      const mes = String(valor.getUTCMonth() + 1).padStart(2, "0");
      const diaN = String(valor.getUTCDate()).padStart(2, "0");
      return `${valor.getUTCFullYear()}-${mes}-${diaN}`;
    }
    return hoy(valor);
  }
  return dia(valor == null ? null : String(valor));
}

/**
 * Fecha de hoja de ruta en Lima. Corrige el salto +1 día cuando
 * se guardó el día UTC siguiente después de las 19:00 de Perú.
 */
export function hojaFecha(fecha?: string | Date | null, createdAt?: string | Date | null) {
  const f = diaSql(fecha);
  if (createdAt == null || String(createdAt).trim() === "") return f;
  const created = typeof createdAt === "string" ? fechaHora(createdAt) : ahora(createdAt);
  const cDay = created.slice(0, 10);
  const cHour = Number.parseInt(created.slice(11, 13), 10);
  if (f && cDay && f === sumarDias(cDay, 1) && cHour >= 19) return cDay;
  return f || cDay || hoy();
}

/**
 * Texto listo para mostrar. Un instante UTC pasa a Lima.
 * La medianoche UTC es un día de calendario y no se corre.
 */
export function enLima(valor: string) {
  const raw = valor.trim();
  if (/T00:00:00(?:\.0+)?Z$/i.test(raw)) return raw.slice(0, 10);
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw)) return fechaHora(raw);
  return raw;
}
