export type PermissionKind = "location" | "camera" | "photos";

export type PermissionGrant = "pending" | "granted" | "denied" | "unavailable";

export type PermissionDef = {
  kind: PermissionKind;
  title: string;
  body: string;
  accent: "location" | "camera" | "photos";
};

export type PermissionRow = PermissionDef & {
  status: PermissionGrant;
};
