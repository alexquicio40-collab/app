import { hydrateUserScope, logoutRequest, meRequest } from "@/features/auth/api";
import { marcarDispositivoAutorizado } from "@/features/sesiones/lib/dispositivo";
import type { AuthResult, User } from "@/features/auth/types";
import { hayInternet } from "@/lib/red";
import {
  clearTokens,
  getAccessToken,
  getSessionToken,
  getUserSnapshot,
  saveTokens,
  saveUserSnapshot,
  sesionOfflineValida,
  touchSesion,
} from "@/lib/secure-store";
import { resetSessionClosed, setSessionClosedHandler } from "@/lib/session-bus";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

type AuthStatus = "loading" | "guest" | "authenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  signIn: (result: AuthResult) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const userId = await getAccessToken();
        if (!userId) {
          if (!cancelled) setStatus("guest");
          return;
        }

        const online = await hayInternet();
        if (!online) {
          const token = await getSessionToken();
          const snap = await getUserSnapshot();
          const vigente = await sesionOfflineValida();
          if (token && snap && vigente) {
            if (!cancelled) {
              setUser(snap);
              setStatus("authenticated");
            }
            return;
          }
          await clearTokens();
          if (!cancelled) {
            setUser(null);
            setStatus("guest");
          }
          return;
        }

        const { user: current } = await meRequest();
        const scoped = await hydrateUserScope(current);
        await saveUserSnapshot(scoped);
        await touchSesion();
        if (!cancelled) {
          setUser(scoped);
          setStatus("authenticated");
        }
      } catch {
        await clearTokens();
        if (!cancelled) {
          setUser(null);
          setStatus("guest");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSessionClosedHandler(() => {
      void clearTokens().then(() => {
        setUser(null);
        setStatus("guest");
      });
    });
    return () => setSessionClosedHandler(null);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void (async () => {
        if (await hayInternet()) {
          if (status !== "authenticated") return;
          try {
            await meRequest();
          } catch {
            // SESSION_CLOSED ya cierra en session-bus
          }
          return;
        }
        if (await sesionOfflineValida()) return;
        await clearTokens();
        setUser(null);
        setStatus("guest");
      })();
    });
    return () => sub.remove();
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const ping = async () => {
      if (!(await hayInternet())) return;
      try {
        await meRequest();
      } catch {
        // SESSION_CLOSED ya cierra en session-bus
      }
    };
    const id = setInterval(() => void ping(), 12000);
    return () => clearInterval(id);
  }, [status]);

  const signIn = useCallback(async (result: AuthResult) => {
    resetSessionClosed();
    const scoped = await hydrateUserScope(result.user);
    await saveTokens(result.accessToken, result.refreshToken, result.sessionToken);
    await saveUserSnapshot(scoped);
    await marcarDispositivoAutorizado();
    await touchSesion();
    setUser(scoped);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // El cliente cierra sesión aunque el servidor no responda.
    }
    await clearTokens();
    setUser(null);
    setStatus("guest");
  }, []);

  const value = useMemo(
    () => ({ status, user, signIn, signOut }),
    [status, user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
