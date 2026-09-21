import { logoutRequest, meRequest } from "@/features/auth/api";
import type { AuthResult, User } from "@/features/auth/types";
import { clearTokens, getAccessToken, saveTokens } from "@/lib/secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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

        const { user: current } = await meRequest();
        if (!cancelled) {
          setUser(current);
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

  const signIn = useCallback(async (result: AuthResult) => {
    await saveTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
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
