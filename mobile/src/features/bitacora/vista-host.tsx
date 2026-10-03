import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { registrarVista } from "./api";
import { pathToModulo } from "./lib/format";

/** Anota la apertura de cada pantalla. El servidor evita repeticiones seguidas. */
export function BitacoraVistaHost() {
  const pathname = usePathname();
  const last = useRef("");

  useEffect(() => {
    const modulo = pathToModulo(pathname);
    if (!modulo || last.current === modulo) return;
    last.current = modulo;
    void registrarVista(modulo);
  }, [pathname]);

  return null;
}
