export type UsuarioRol =
  | "operador"
  | "asesor"
  | "gerente"
  | "administrador"
  | "planta"
  | string;

export type MenuModuloKey =
  | "operadores"
  | "usuarios"
  | "locales"
  | "asignar"
  | "rutas"
  | "planta"
  | "reportes"
  | "reportes_rutas"
  | "mapa"
  | "mapa_rutas"
  | "historial"
  | "estadisticas"
  | "hoja_ruta"
  | "historial_hr"
  | "certificados"
  | "pagos"
  | "sesiones";

export type PermisosMenu = Record<MenuModuloKey, boolean>;

export type UsuarioItem = {
  id: string;
  nombre: string;
  usuario: string;
  rol: UsuarioRol;
  activo: boolean;
  dni: string;
  placa: string;
  requiereLitraje: boolean;
  requiereBaldesVacios: boolean;
  requiereGalonerasVacias: boolean;
  requiereFotoGuia: boolean;
  requiereFotoMercaderia: boolean;
  requiereNotas: boolean;
  permisosMenu: PermisosMenu;
};

export type UsuarioFormInput = {
  nombre: string;
  usuario: string;
  password?: string;
  rol: UsuarioRol;
  activo: boolean;
  dni?: string;
  placa?: string;
  requiereLitraje?: boolean;
  requiereBaldesVacios?: boolean;
  requiereGalonerasVacias?: boolean;
  requiereFotoGuia?: boolean;
  requiereFotoMercaderia?: boolean;
  requiereNotas?: boolean;
};

export type UsuarioPermisosInput = {
  permisosMenu: PermisosMenu;
  requiereLitraje: boolean;
  requiereBaldesVacios: boolean;
  requiereGalonerasVacias: boolean;
  requiereFotoGuia: boolean;
  requiereFotoMercaderia: boolean;
  requiereNotas: boolean;
};

export type UsuariosFilters = {
  search: string;
  rol: string | null;
};
