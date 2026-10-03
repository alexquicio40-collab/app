import type { PermissionDef } from "../types";

/** Permisos que declara la app (app.json / plugins Expo). */
export const INSTALACION_PERMISSIONS: PermissionDef[] = [
  {
    kind: "location",
    title: "Ubicación precisa",
    body: "Para ubicar a cualquier usuario en el mapa, no solo al operador de ruta.",
    accent: "location",
  },
  {
    kind: "locationBg",
    title: "Segundo plano",
    body: "Sigue enviando tu posición con la pantalla bloqueada o en otra app.",
    accent: "locationBg",
  },
  {
    kind: "notifications",
    title: "Notificaciones",
    body: "Android las pide para mantener el seguimiento activo sin cortar el proceso.",
    accent: "notifications",
  },
  {
    kind: "battery",
    title: "Batería sin restricción",
    body: "Evita que Xiaomi, Huawei o Samsung cierren la app en segundo plano.",
    accent: "battery",
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
