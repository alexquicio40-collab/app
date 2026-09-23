export type {
  PermissionDef,
  PermissionGrant,
  PermissionKind,
  PermissionRow,
} from "./types";
export { INSTALACION_PERMISSIONS } from "./lib/permissions-catalog";
export { InstalacionProvider, useInstalacionFlow, useInstalacionGate } from "./hooks";
export { isInstalacionDone, markInstalacionDone, clearInstalacionDone } from "./lib/storage";
