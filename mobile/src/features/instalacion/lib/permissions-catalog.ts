import type { PermissionDef } from "../types";

/** Permisos que declara la app (app.json / plugins Expo). */
export const INSTALACION_PERMISSIONS: PermissionDef[] = [
  {
    kind: "location",
    title: "Ubicación",
    body: "Para mostrarte en el mapa, navegar rutas y registrar tu posición en campo.",
    accent: "location",
  },
  {
    kind: "camera",
    title: "Cámara",
    body: "Para tomar fotos de guías, mercadería y entradas de locales.",
    accent: "camera",
  },
  {
    kind: "photos",
    title: "Galería",
    body: "Para elegir imágenes existentes al completar visitas y certificados.",
    accent: "photos",
  },
];
