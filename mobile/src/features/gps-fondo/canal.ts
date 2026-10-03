import { getLiveSocketUrl } from "@/lib/api";
import { io, type Socket } from "socket.io-client";

let canal: Socket | null = null;
let usuario = "";

/** Un solo socket. El mapa de flota escucha estos eventos y mueve el camión al momento. */
export function abrirCanal(userId: string) {
  if (canal && usuario === userId) return;
  cerrarCanal();
  usuario = userId;
  canal = io(getLiveSocketUrl(), {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    autoConnect: true,
  });
  const entrar = () => canal?.emit("authenticate", { userId });
  canal.on("connect", entrar);
  if (canal.connected) entrar();
}

export function emitirUbicacion(userId: string, lat: number, lng: number, speed: number) {
  if (!canal || usuario !== userId) abrirCanal(userId);
  const payload = {
    userId: Number(userId),
    usuario_id: Number(userId),
    latitude: lat,
    longitude: lng,
    latitud: lat,
    longitud: lng,
    speed,
    velocidad: speed,
    estado: "activo",
  };
  canal?.emit("update-location", payload);
  canal?.emit("location-update", payload);
}

export function cerrarCanal() {
  canal?.removeAllListeners();
  canal?.disconnect();
  canal = null;
  usuario = "";
}
