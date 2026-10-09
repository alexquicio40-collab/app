const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

const CONSUMER_MARK = "bioclim-fgs-keep";

function servicePath(projectRoot) {
  return path.join(
    projectRoot,
    "node_modules/expo-location/android/src/main/java/expo/modules/location/services/LocationTaskService.kt",
  );
}

function consumerPath(projectRoot) {
  return path.join(
    projectRoot,
    "node_modules/expo-location/android/src/main/java/expo/modules/location/taskConsumers/LocationTaskConsumer.kt",
  );
}

function applyPatch(projectRoot) {
  const file = servicePath(projectRoot);
  const patch = path.join(__dirname, "patches", "LocationTaskService.kt");
  if (!fs.existsSync(file) || !fs.existsSync(patch)) return false;
  fs.copyFileSync(patch, file);
  return true;
}

function applyConsumerPatch(projectRoot) {
  const file = consumerPath(projectRoot);
  if (!fs.existsSync(file)) return false;
  let source = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

  source = source.replace(
    /\n    \/\/ Este servicio es el que Android reinicia hasta cerrar la app\.\n    return\n/,
    "\n",
  );

  source = source.replace(
    'extras.putBoolean("killService", serviceOptions.getBoolean("killServiceOnDestroy", false))',
    'extras.putBoolean("killService", false)',
  );

  source = source.replace(
    `          override fun onServiceDisconnected(name: ComponentName) {
            mService?.stop()
            mService = null
          }`,
    `          override fun onServiceDisconnected(name: ComponentName) {
            // ${CONSUMER_MARK}: el GPS sigue con la app cerrada.
            mService = null
          }`,
  );

  source = source.replace(
    `        Log.e(TAG, "Foreground service restart rejected; stopping the service.", e)
        stopForegroundService()
        mService = null`,
    `        Log.e(TAG, "Foreground service restart rejected; keeping the service.", e)`,
  );

  source = source.replace(
    `    Log.e(TAG, "Foreground service start rejected; shutting the service down.", error)
    mService?.stop()
    mService = null`,
    `    Log.e(TAG, "Foreground service start rejected; keeping the service.", error)
    mService = null`,
  );

  const startOld = `      try {
        // startService, no startForegroundService: ese último obliga a llegar
        // a startForeground y, si Android lo rechaza, cierra la app.
        context.startService(serviceIntent)
      } catch (e: IllegalStateException) {
        Log.e(TAG, "Location service start not allowed; skipping the foreground service.", e)
        return
      } catch (e: SecurityException) {
        Log.e(TAG, "Location service start rejected; skipping the foreground service.", e)
        return
      }
`;

  const startNew = `      try {
        // ${CONSUMER_MARK}
        if (Build.VERSION.SDK_INT >= 26) {
          context.startForegroundService(serviceIntent)
        } else {
          context.startService(serviceIntent)
        }
      } catch (e: IllegalStateException) {
        try { context.startService(serviceIntent) } catch (ignored: Exception) {
          Log.e(TAG, "Location service start not allowed; skipping the foreground service.", e)
          return
        }
      } catch (e: SecurityException) {
        Log.e(TAG, "Location service start rejected; skipping the foreground service.", e)
        return
      }
`;

  if (source.includes(startOld)) source = source.replace(startOld, startNew);

  if (!source.includes(CONSUMER_MARK) && source.includes("context.startForegroundService(serviceIntent)")) {
    const wrapped = source.replace(
      "      context.startForegroundService(serviceIntent)\n",
      `      try {\n        // ${CONSUMER_MARK}\n        if (android.os.Build.VERSION.SDK_INT >= 26) {\n          context.startForegroundService(serviceIntent)\n        } else {\n          context.startService(serviceIntent)\n        }\n      } catch (e: IllegalStateException) {\n        try { context.startService(serviceIntent) } catch (ignored: Exception) {\n          Log.e(TAG, "Location service start not allowed; skipping the foreground service.", e)\n          return\n        }\n      } catch (e: SecurityException) {\n        Log.e(TAG, "Location service start rejected; skipping the foreground service.", e)\n        return\n      }\n`,
    );
    if (wrapped.includes(CONSUMER_MARK)) source = wrapped;
  }

  fs.writeFileSync(file, source);
  return true;
}

function withLocationForegroundType(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      applyPatch(cfg.modRequest.projectRoot);
      applyConsumerPatch(cfg.modRequest.projectRoot);
      return cfg;
    },
  ]);
}

if (require.main === module) {
  const root = path.join(__dirname, "..");
  applyPatch(root);
  applyConsumerPatch(root);
}

module.exports = withLocationForegroundType;
