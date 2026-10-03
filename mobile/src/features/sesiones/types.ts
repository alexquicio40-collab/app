export type SesionesTab = "sesiones" | "dispositivos";

export type SesionItem = {
  id: number;
  usuarioId: number;
  usuario: string;
  login: string;
  rol: string;
  ip: string | null;
  dispositivo: string | null;
  plataforma: string | null;
  abierta: boolean;
  mia?: boolean;
  inicio: string;
  ultimo: string;
  cierre: string | null;
};

export type DispositivoItem = {
  id: number;
  huella: string;
  codigo?: string | null;
  nombre: string;
  plataforma: string | null;
  autorizado: boolean;
  usuarioId: number | null;
  usuario: string | null;
  creado: string;
  ultimo: string | null;
};

export type DispositivoInput = {
  nombre: string;
  huella?: string;
  codigo?: string;
  plataforma?: string;
};
