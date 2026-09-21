import { Redirect } from "expo-router";

/** Compat: el CRUD de conductores se eliminó; alta/edición en Usuarios. Live map en Operadores. */
export default function ConductoresRedirect() {
  return <Redirect href="/operadores" />;
}
