export type PermissionKind =
  | "location"
  | "locationBg"
  | "notifications"
  | "battery"
  | "camera"
  | "photos";

export type PermissionGrant = "pending" | "granted" | "denied" | "unavailable";

export type PermissionAccent =
  | "location"
  | "locationBg"
  | "notifications"
  | "battery"
  | "camera"
  | "photos";

export type PermissionDef = {
  kind: PermissionKind;
  title: string;
  body: string;
  accent: PermissionAccent;
};

export type PermissionRow = PermissionDef & {
  status: PermissionGrant;
};
