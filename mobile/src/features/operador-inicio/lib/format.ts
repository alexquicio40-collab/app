export function fechaCabecera(date = new Date()) {
  const bag = parts(date, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const dia = capital(bag.weekday);
  const mes = capital(bag.month);
  return `${dia}, ${bag.day} ${mes} ${bag.year}`;
}

export function horaCorta(date = new Date()) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(/\s*a\.?\s*m\.?/gi, " am")
    .replace(/\s*p\.?\s*m\.?/gi, " pm")
    .replace(/\s+/g, " ")
    .trim();
}

export function litros(value: number) {
  return `${Math.round(value).toLocaleString("es-PE")} L`;
}

export function soles(value: number) {
  const text = value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `S/ ${text}`;
}

export function rolLabel(rol?: string | null) {
  const key = (rol ?? "operador").toLowerCase();
  if (key === "operador") return "Operador";
  if (key === "chofer") return "Chofer";
  if (key === "conductor") return "Conductor";
  if (key === "asesor") return "Asesor comercial";
  if (key === "administrador") return "Administrador";
  if (key === "gerente") return "Gerente";
  if (key === "planta") return "Planta";
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : "Operador";
}

export function inicialNombre(nombre: string) {
  const letter = nombre.trim().charAt(0).toUpperCase();
  return letter || "L";
}

function capital(value: string | undefined) {
  const clean = (value ?? "").replace(/\./g, "").trim();
  if (!clean) return "";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function parts(date: Date, options: Intl.DateTimeFormatOptions) {
  const bag: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    ...options,
  }).formatToParts(date)) {
    if (part.type !== "literal") bag[part.type] = part.value;
  }
  return bag;
}
