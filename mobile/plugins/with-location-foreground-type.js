const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

function copyPatch(projectRoot, relative, patchName) {
  const dest = path.join(projectRoot, relative);
  const src = path.join(__dirname, "patches", patchName);
  if (!fs.existsSync(dest) || !fs.existsSync(src)) return false;
  fs.copyFileSync(src, dest);
  return true;
}

function applyPatches(projectRoot) {
  copyPatch(
    projectRoot,
    "node_modules/expo-location/android/src/main/java/expo/modules/location/services/LocationTaskService.kt",
    "LocationTaskService.kt",
  );
  copyPatch(
    projectRoot,
    "node_modules/expo-location/android/src/main/java/expo/modules/location/taskConsumers/LocationTaskConsumer.kt",
    "LocationTaskConsumer.kt",
  );
}

function withLocationForegroundType(config) {
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
