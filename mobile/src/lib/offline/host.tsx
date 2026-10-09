import { migrateLegacyRecojos } from "@/lib/offline/migrate";
import { flushOfflineJobs } from "@/lib/offline/sync";
import * as Network from "expo-network";
import { useEffect } from "react";
import { AppState } from "react-native";

/** Vacía la cola al volver a primer plano o al recuperar red. */
export function OfflineSyncHost() {
  useEffect(() => {
    let alive = true;
    const sync = () => {
      if (!alive) return;
      void flushOfflineJobs();
    };
    void migrateLegacyRecojos().then(sync);
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });
    const net = Network.addNetworkStateListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) sync();
    });
    const timer = setInterval(sync, 20000);
    return () => {
      alive = false;
      app.remove();
      net.remove();
      clearInterval(timer);
    };
  }, []);

  return null;
}
