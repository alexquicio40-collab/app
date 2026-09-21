import { getLiveSocketUrl } from "@/lib/api";
import { io, type Socket } from "socket.io-client";

export type LocationPatch = {
  userId: number;
  latitude: number;
  longitude: number;
  speed: number;
};

export type LiveSocketHandlers = {
  onLocation: (patch: LocationPatch) => void;
  onOffline: (userId: number) => void;
  onRouteChanged?: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

function readId(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readCoord(...values: unknown[]) {
  for (const value of values) {
    if (value == null || value === "") continue;
    const parsed = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function asRow(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  return data as Record<string, unknown>;
}

/**
 * Socket admin (igual que conductores_screen del proyecto Flutter):
 * - emit authenticate
 * - on location-update / conductor-offline
 * - on ruta activada/detenida → refrescar destinos
 */
export function connectLiveSocket(userId: string, handlers: LiveSocketHandlers): Socket {
  const socket = io(getLiveSocketUrl(), {
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
  });

  const authenticate = () => {
    socket.emit("authenticate", { userId });
  };

  socket.on("connect", () => {
    authenticate();
    handlers.onConnect?.();
  });

  socket.on("disconnect", () => {
    handlers.onDisconnect?.();
  });

  socket.on("location-update", (data: unknown) => {
    const row = asRow(data);
    if (!row) return;
    const id = readId(row.userId ?? row.usuario_id ?? row.id);
    const latitude = readCoord(row.latitude, row.latitud, row.lat);
    const longitude = readCoord(row.longitude, row.longitud, row.lng);
    if (id == null || latitude == null || longitude == null) return;
    handlers.onLocation({
      userId: id,
      latitude,
      longitude,
      speed: readCoord(row.velocidad, row.speed) ?? 0,
    });
  });

  socket.on("conductor-offline", (data: unknown) => {
    const row = asRow(data);
    if (!row) return;
    const id = readId(row.userId ?? row.usuario_id);
    if (id != null) handlers.onOffline(id);
  });

  const onRouteChanged = () => handlers.onRouteChanged?.();
  socket.on("conductor-ruta-activada", onRouteChanged);
  socket.on("conductor-ruta-deteneda", onRouteChanged);
  // Alias por si el backend corrige el typo histórico.
  socket.on("conductor-ruta-detenida", onRouteChanged);
  socket.on("ruta-actualizada", onRouteChanged);
  socket.on("ruta-estado-cambiado", onRouteChanged);

  if (socket.connected) authenticate();
  return socket;
}
