package expo.modules.bioclimlocation

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.Looper
import android.util.Log

/**
 * Replica de android/location-samples LocationUpdatesForegroundService:
 * startForeground() primero, luego requestLocationUpdates en este mismo
 * servicio. Un FGS tipo location sin listener lo mata Android a ~1 min.
 */
class BioclimLocationService : Service(), LocationListener {
  private val locationManager by lazy {
    getSystemService(Context.LOCATION_SERVICE) as LocationManager
  }

  override fun onCreate() {
    super.onCreate()
    if (!promote()) {
      stopSelf()
      return
    }
    if (!listen()) {
      stopSelf()
      return
    }
    running = true
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (!hasLocationPermission() || !promote() || !listen()) {
      running = false
      stopSelf()
      return START_NOT_STICKY
    }
    running = true
    return START_STICKY
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onTaskRemoved(rootIntent: Intent?) {
    // La notificación sigue. El proceso no se cierra al quitar la app del reciente.
  }

  override fun onDestroy() {
    running = false
    dropListener()
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        stopForeground(STOP_FOREGROUND_REMOVE)
      } else {
        @Suppress("DEPRECATION")
        stopForeground(true)
      }
    } catch (e: Exception) {
      Log.w(TAG, "stopForeground", e)
    }
    super.onDestroy()
  }

  override fun onLocationChanged(location: Location) {
    // Android 14+ exige que el FGS tipo location reciba fixes. El JS publica los suyos.
  }

  override fun onProviderEnabled(provider: String) {}

  override fun onProviderDisabled(provider: String) {}

  @Deprecated("Deprecated in Java")
  override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}

  private fun listen(): Boolean {
    if (!hasLocationPermission()) return false
    return try {
      dropListener()
      val minTime = 8_000L
      val minDistance = 15f
      if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
        locationManager.requestLocationUpdates(
          LocationManager.GPS_PROVIDER,
          minTime,
          minDistance,
          this,
          Looper.getMainLooper(),
        )
      }
      if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
        locationManager.requestLocationUpdates(
          LocationManager.NETWORK_PROVIDER,
          minTime,
          minDistance,
          this,
          Looper.getMainLooper(),
        )
      }
      locationManager.requestLocationUpdates(
        LocationManager.PASSIVE_PROVIDER,
        minTime,
        minDistance,
        this,
        Looper.getMainLooper(),
      )
      true
    } catch (e: SecurityException) {
      Log.e(TAG, "requestLocationUpdates rechazado", e)
      false
    } catch (e: Exception) {
      Log.e(TAG, "requestLocationUpdates", e)
      false
    }
  }

  private fun dropListener() {
    try {
      locationManager.removeUpdates(this)
    } catch (e: Exception) {
      Log.w(TAG, "removeUpdates", e)
    }
  }

  private fun promote(): Boolean {
    return try {
      val notification = buildNotification()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
      } else {
        startForeground(NOTIFICATION_ID, notification)
      }
      true
    } catch (e: Exception) {
      Log.e(TAG, "startForeground rechazado", e)
      false
    }
  }

  private fun hasLocationPermission(): Boolean {
    return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
      checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
  }

  private fun buildNotification(): Notification {
    ensureChannel()
    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val tap = launch?.let {
      it.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
      PendingIntent.getActivity(
        this,
        0,
        it,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }
    val icon = resources.getIdentifier("notification_icon", "drawable", packageName)
      .takeIf { it != 0 }
      ?: applicationInfo.icon.takeIf { it != 0 }
      ?: android.R.drawable.ic_menu_mylocation
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(this)
    }
    return builder
      .setContentTitle("BIOCLIM")
      .setContentText("Ubicación activa en segundo plano")
      .setSmallIcon(icon)
      .setContentIntent(tap)
      .setOngoing(true)
      .setAutoCancel(false)
      .setOnlyAlertOnce(true)
      .setCategory(Notification.CATEGORY_SERVICE)
      .build()
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NotificationManager::class.java) ?: return
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    val channel = NotificationChannel(CHANNEL_ID, "Ubicación BIOCLIM", NotificationManager.IMPORTANCE_LOW)
    channel.description = "Mantiene la ubicación activa con la app en segundo plano"
    channel.setShowBadge(false)
    manager.createNotificationChannel(channel)
  }

  companion object {
    private const val TAG = "BioclimLocation"
    private const val NOTIFICATION_ID = 746281
    private const val CHANNEL_ID = "bioclim-ubicacion"

    @Volatile
    var running: Boolean = false
      private set

    fun start(context: Context): Boolean {
      val intent = Intent(context, BioclimLocationService::class.java)
      return try {
        context.applicationContext.startService(intent)
        true
      } catch (e: Exception) {
        Log.w(TAG, "No se pudo arrancar el servicio", e)
        false
      }
    }

    fun stop(context: Context) {
      try {
        context.applicationContext.stopService(Intent(context, BioclimLocationService::class.java))
      } catch (e: Exception) {
        Log.w(TAG, "No se pudo detener el servicio", e)
      }
    }
  }
}
