import type { UploadFile } from "@/lib/offline/types";

type FormPart = { key: string; value: unknown };

type RnForm = FormData & {
  getParts?: () => Array<{
    fieldName?: string;
    string?: string;
    uri?: string;
    name?: string;
    type?: string;
  }>;
  _parts?: Array<[string, unknown]>;
};

export function formToFieldsAndFiles(form: FormData) {
  const fields: Record<string, string> = {};
  const files: UploadFile[] = [];
  for (const part of readParts(form)) {
    const file = asFile(part.value);
    if (file) {
      files.push({ field: part.key, ...file });
      continue;
    }
    if (typeof Blob !== "undefined" && part.value instanceof Blob) {
      continue;
    }
    fields[part.key] = String(part.value ?? "");
  }
  return { fields, files };
}

function readParts(form: FormData): FormPart[] {
  const rn = form as RnForm;
  if (typeof rn.getParts === "function") {
    return rn.getParts().map((part) => ({
      key: part.fieldName || "file",
      value: part.uri
        ? { uri: part.uri, name: part.name, type: part.type }
        : (part.string ?? ""),
    }));
  }
  if (Array.isArray(rn._parts)) {
    return rn._parts.map(([key, value]) => ({ key, value }));
  }
  const out: FormPart[] = [];
  form.forEach((value, key) => out.push({ key, value }));
  return out;
}

function asFile(value: unknown): Omit<UploadFile, "field"> | null {
  if (!value || typeof value !== "object") return null;
  const rec = value as { uri?: unknown; name?: unknown; type?: unknown };
  if (typeof rec.uri !== "string" || !rec.uri) return null;
  return {
    uri: rec.uri,
    name: typeof rec.name === "string" && rec.name ? rec.name : "archivo.jpg",
    type: typeof rec.type === "string" && rec.type ? rec.type : "image/jpeg",
  };
}
