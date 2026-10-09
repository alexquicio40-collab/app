const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

const MARK = "bioclim-fgs-type";

function servicePath(projectRoot) {
  return path.join(
    projectRoot,
    "node_modules/expo-location/android/src/main/java/expo/modules/location/services/LocationTaskService.kt",
  );
}

/**
 * Android 14 cierra la app si el servicio de ubicación llama a startForeground
 * sin el tipo "location". Ese fallo, repetido, es el aviso de "sigue fallando".
 */
function applyPatch(projectRoot) {
  const file = servicePath(projectRoot);
  if (!fs.existsSync(file)) return false;
  const source = fs.readFileSync(file, "utf8");
  if (source.includes("stopSelf()") && source.includes(MARK)) {
    fs.writeFileSync(
      file,
      source.replace(/\n    stopSelf\(\)\n    return START_NOT_STICKY/, "\n    return START_STICKY"),
    );
    return true;
  }
  if (source.includes(MARK)) return true;

  let next = source.replace(
    "import android.content.pm.PackageManager\n",
    "import android.content.pm.PackageManager\nimport android.content.pm.ServiceInfo\n",
  );

  next = next.replace(
    `  @TargetApi(26)
  override fun onStartCommand(intent: Intent, flags: Int, startId: Int): Int {
    val extras = intent.extras
    if (extras != null) {
      mChannelId = extras.getString("appId") + ":" + extras.getString("taskName")
      mKillService = extras.getBoolean("killService", false)
    }
    return START_REDELIVER_INTENT
  }`,
    `  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    // ${MARK}
    val extras = intent?.extras
    if (extras != null) {
      mChannelId = extras.getString("appId") + ":" + extras.getString("taskName")
      mKillService = extras.getBoolean("killService", false)
    }
    if (mChannelId.isNullOrBlank()) mChannelId = "bioclim:gps"
    return START_STICKY
  }`,
  );

  next = next.replace(
    `  fun startForeground(serviceOptions: Bundle) {
    val notification = buildServiceNotification(serviceOptions)
    startForeground(mServiceId, notification)
  }`,
    `  fun startForeground(serviceOptions: Bundle) {
    val notification = buildServiceNotification(serviceOptions)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      super.startForeground(mServiceId, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
    } else {
      super.startForeground(mServiceId, notification)
    }
  }`,
  );

  next = next.replace(
    ".setSmallIcon(iconsResId)",
    ".setSmallIcon(if (iconsResId != 0) iconsResId else android.R.drawable.ic_menu_mylocation)",
  );

  if (!next.includes(MARK)) {
    throw new Error("No se pudo parchear LocationTaskService.kt");
  }
  fs.writeFileSync(file, next);
  return true;
}

const CONSUMER_MARK = "bioclim-fgs-safe";

function consumerPath(projectRoot) {
  return path.join(
    projectRoot,
    "node_modules/expo-location/android/src/main/java/expo/modules/location/taskConsumers/LocationTaskConsumer.kt",
  );
}

function applyConsumerPatch(projectRoot) {
  const file = consumerPath(projectRoot);
  if (!fs.existsSync(file)) return false;
  const source = fs.readFileSync(file, "utf8");
  if (source.includes(CONSUMER_MARK)) return true;
  const next = source.replace(
    "      context.startForegroundService(serviceIntent)\n",
    `      try {\n        // ${CONSUMER_MARK}: tipo location ya va en startForeground.\n        if (android.os.Build.VERSION.SDK_INT >= 26) {\n          context.startForegroundService(serviceIntent)\n        } else {\n          context.startService(serviceIntent)\n        }\n      } catch (e: IllegalStateException) {\n        try { context.startService(serviceIntent) } catch (ignored: Exception) {\n          Log.e(TAG, "Location service start not allowed; skipping the foreground service.", e)\n          return\n        }\n      } catch (e: SecurityException) {\n        Log.e(TAG, "Location service start rejected; skipping the foreground service.", e)\n        return\n      }\n`,
  );
  if (!next.includes(CONSUMER_MARK)) return false;
  fs.writeFileSync(file, next);
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
  applyPatch(path.join(__dirname, ".."));
  applyConsumerPatch(path.join(__dirname, ".."));
}

module.exports = withLocationForegroundType;
