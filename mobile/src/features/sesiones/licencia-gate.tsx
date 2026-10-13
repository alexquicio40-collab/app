import { esEmuladorAndroid } from "@/lib/emulador";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dispositivoYaAutorizado, marcarDispositivoAutorizado, revocarDispositivoLocal } from "./lib/dispositivo";

type LicenciaContextValue = {
  ready: boolean;
  autorizado: boolean;
  confirmar: () => Promise<void>;
  bloquear: () => Promise<void>;
};

const LicenciaContext = createContext<LicenciaContextValue | null>(null);

export function LicenciaProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (esEmuladorAndroid()) {
      setAutorizado(true);
      setReady(true);
      return;
    }
    void dispositivoYaAutorizado().then((ok) => {
      if (cancelled) return;
      setAutorizado(ok);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const confirmar = useCallback(async () => {
    await marcarDispositivoAutorizado();
    setAutorizado(true);
  }, []);

  const bloquear = useCallback(async () => {
    await revocarDispositivoLocal();
    setAutorizado(false);
  }, []);

  const value = useMemo(
    () => ({ ready, autorizado, confirmar, bloquear }),
    [ready, autorizado, confirmar, bloquear],
  );

  return <LicenciaContext.Provider value={value}>{children}</LicenciaContext.Provider>;
}

export function useLicenciaGate() {
  const ctx = useContext(LicenciaContext);
  if (!ctx) throw new Error("useLicenciaGate debe usarse dentro de LicenciaProvider");
  return ctx;
}
