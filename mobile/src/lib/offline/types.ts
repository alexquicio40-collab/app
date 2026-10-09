export type JsonJob = {
  id: string;
  kind: "json";
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body: unknown;
  createdAt: string;
  label: string;
};

export type UploadFile = {
  field: string;
  uri: string;
  name: string;
  type: string;
};

export type UploadJob = {
  id: string;
  kind: "upload";
  method: "POST" | "PUT";
  path: string;
  fields: Record<string, string>;
  files: UploadFile[];
  createdAt: string;
  label: string;
};

export type OfflineJob = JsonJob | UploadJob;

export type CacheEntry = {
  at: number;
  payload: unknown;
};

export type QueuedResult = {
  success: true;
  queued: true;
};
