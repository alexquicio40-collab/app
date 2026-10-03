export type UsuarioPunto = {
  id: string;
  nombre: string;
  rol: string;
  lat: number;
  lng: number;
  kmh: number;
  at: number;
  vivo: boolean;
};

export type UsuariosTab = "lista" | "ubicacion";
