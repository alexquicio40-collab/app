import { useLicenciaGate } from "@/features/sesiones/licencia-gate";
import { ApiError } from "@/lib/api";
import { hayInternet } from "@/lib/red";
import {
  clearRememberedUsername,
  getRememberedUsername,
  saveRememberedUsername,
} from "@/lib/secure-store";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { loginRequest, registerRequest } from "./api";
import { loginSchema, registerSchema } from "./schema";

type FieldErrors = Record<string, string>;

function fieldErrorsFromZod(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const next: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !next[key]) next[key] = issue.message;
  }
  return next;
}

export function useLoginForm() {
  const { signIn } = useAuth();
  const licencia = useLicenciaGate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberUser, setRememberUser] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const saved = await getRememberedUsername();
      if (cancelled) return;
      if (saved) {
        setUsername(saved);
        setRememberUser(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function submit() {
    setFormError(null);
    const parsed = loginSchema.safeParse({ username, password });
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    if (!(await hayInternet())) {
      setFormError("Necesitas internet para ingresar.");
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const result = await loginRequest(parsed.data.username, parsed.data.password);
      if (rememberUser) {
        await saveRememberedUsername(parsed.data.username);
      } else {
        await clearRememberedUsername();
      }
      await signIn(result);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "DEVICE_BLOCKED") {
          await licencia.bloquear();
        }
        setFormError(error.message);
      } else {
        setFormError("No se pudo conectar con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  }

  return {
    username,
    password,
    rememberUser,
    errors,
    formError,
    loading,
    setUsername,
    setPassword,
    setRememberUser,
    submit,
  };
}

export function useRegisterForm() {
  const { signIn } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setFormError(null);
    const parsed = registerSchema.safeParse({ name, username, password });
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const result = await registerRequest(
        parsed.data.name,
        parsed.data.username,
        parsed.data.password,
      );
      await signIn(result);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return {
    name,
    username,
    password,
    errors,
    formError,
    loading,
    setName,
    setUsername,
    setPassword,
    submit,
  };
}
