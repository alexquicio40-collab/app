import { flushRecojos } from "@/features/recojo-offline/queue";
import * as Network from "expo-network";
import { useEffect } from "react";
import { AppState } from "react-native";

/** Intenta vaciar la cola al volver a primer plano o al recuperar red. */
export function RecojoSyncHost() {
  useEffect(() => {
    const sync = () => {
      void flushRecojos();
    };
    sync();
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });
    const net = Network.addNetworkStateListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) sync();
    });
    const timer = setInterval(sync, 30000);
    return () => {
      app.remove();
      net.remove();
      clearInterval(timer);
    };
  }, []);

  return null;
}
