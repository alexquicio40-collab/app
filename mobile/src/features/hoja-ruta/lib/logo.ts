import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";

/** El mismo PNG que usa la web en hoja-ruta-pdf.js */
const LOGO = require("../../../../assets/images/logo-hoja-ruta.png");

let cached = "";

export async function hojaLogoDataUrl() {
  if (cached) return cached;
  try {
    const asset = Asset.fromModule(LOGO);
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    if (!uri) return "";
    if (uri.startsWith("data:")) {
      cached = uri;
      return cached;
    }
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    cached = `data:image/png;base64,${b64}`;
    return cached;
  } catch {
    return "";
  }
}
