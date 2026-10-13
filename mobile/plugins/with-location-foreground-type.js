const fs = require("fs");
const path = require("path");
const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins");

const EXPO_FGS = "expo.modules.location.services.LocationTaskService";
const BIOCLIM_FGS = "expo.modules.bioclimlocation.BioclimLocationService";

function findFile(dir, name) {
  if (!dir || !fs.existsSync(dir)) return null;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "build" || entry.name === ".cxx") continue;
        stack.push(full);
      } else if (entry.name === name) {
        return full;
      }
    }
  }
  return null;
}

function copyPatch(projectRoot, fileName, patchName) {
  const dest = findFile(path.join(projectRoot, "node_modules", "expo-location"), fileName);
  const src = path.join(__dirname, "patches", patchName);
  if (!dest || !fs.existsSync(src)) {
    console.warn(`[bioclim-location] No se pudo parchear ${fileName}`);
    return false;
  }
  fs.copyFileSync(src, dest);
  return true;
}

function applyPatches(projectRoot) {
  copyPatch(projectRoot, "LocationTaskService.kt", "LocationTaskService.kt");
  copyPatch(projectRoot, "LocationTaskConsumer.kt", "LocationTaskConsumer.kt");
}

function serviceAttrs(name, extra) {
  return Object.assign(
    {
      "android:name": name,
      "android:exported": "false",
      "android:foregroundServiceType": "location",
      "android:stopWithTask": "false",
    },
    extra,
  );
}

function upsertService(app, name, extra) {
  app.service = app.service || [];
  const found = app.service.find((item) => item.$?.["android:name"] === name);
  if (found) {
    found.$ = Object.assign({}, found.$, serviceAttrs(name, extra));
    return;
  }
  app.service.push({ $: serviceAttrs(name, extra) });
}

function withLocationManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (!manifest.$) manifest.$ = {};
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }
    const app = manifest.application?.[0];
    if (!app) return cfg;
    upsertService(app, BIOCLIM_FGS, { "android:enabled": "true" });
    upsertService(app, EXPO_FGS, {
      "android:enabled": "false",
      "tools:replace": "android:enabled",
    });
    return cfg;
  });
}

function withLocationForegroundType(config) {
  config = withLocationManifest(config);
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      applyPatches(cfg.modRequest.projectRoot);
      return cfg;
    },
  ]);
}

if (require.main === module) {
  applyPatches(path.join(__dirname, ".."));
}

module.exports = withLocationForegroundType;
