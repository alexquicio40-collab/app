package expo.modules.location.services

import android.annotation.TargetApi
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import expo.modules.location.AppForegroundedSingleton

/**
 * Android 12–16 cierra la app ("sigue fallando") en dos casos:
 * 1. El servicio vuelve a arrancar en segundo plano (START_STICKY) y llama
 *    startForeground sin estar en primer plano.
 * 2. stopSelf() sin stopForeground() dispara
 *    ForegroundServiceDidNotStopInTimeException unos segundos después,
 *    aunque la notificación ya se haya visto.
 * https://developer.android.com/about/versions/14/changes/fgs-types-required
 * https://developer.android.com/about/versions/15/behavior-changes-15#fgs-stop-timeout
 */
class LocationTaskService : Service() {
  private var mKillService = false
  private lateinit var mParentContext: Context
  private val mBinder: IBinder = ServiceBinder()

  inner class ServiceBinder : Binder() {
    val service: LocationTaskService
      get() = this@LocationTaskService
  }

  override fun onBind(intent: Intent): IBinder {
    return mBinder
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val extras = intent?.extras
    if (extras != null) {
      mKillService = extras.getBoolean("killService", false)
    }
    val options = extras?.getBundle("serviceOptions") ?: Bundle()
    // Un reinicio del sistema llega con la app en segundo plano. Promover el
    // servicio ahí es lo que Android convierte en cierre en bucle.
    if (!AppForegroundedSingleton.isForegrounded) {
      leaveForeground()
      stopSelf()
      return START_NOT_STICKY
    }
    return try {
      enterForeground(options)
      START_NOT_STICKY
    } catch (e: Exception) {
      android.util.Log.e(TAG, "No se pudo publicar la notificación de ubicación", e)
      leaveForeground()
      stopSelf()
      START_NOT_STICKY
    }
  }

  override fun onDestroy() {
    leaveForeground()
    super.onDestroy()
  }

  fun setParentContext(context: Context) {
    mParentContext = context
  }

  fun stop() {
    leaveForeground()
    stopSelf()
  }

  private fun leaveForeground() {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        stopForeground(STOP_FOREGROUND_REMOVE)
      } else {
        @Suppress("DEPRECATION")
        stopForeground(true)
      }
    } catch (_: Exception) {
    }
  }

  override fun onTaskRemoved(rootIntent: Intent) {
    if (mKillService) {
      super.onTaskRemoved(rootIntent)
      stop()
    }
  }

  fun startForeground(serviceOptions: Bundle) {
    enterForeground(serviceOptions)
  }

  private fun enterForeground(serviceOptions: Bundle) {
    val notification = buildServiceNotification(serviceOptions)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      super.startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
    } else {
      super.startForeground(NOTIFICATION_ID, notification)
    }
  }

  @TargetApi(26)
  private fun buildServiceNotification(serviceOptions: Bundle): Notification {
    prepareChannel(CHANNEL_ID)
    val builder = Notification.Builder(this, CHANNEL_ID)
    val title = serviceOptions.getString("notificationTitle")?.takeIf { it.isNotBlank() } ?: "BIOCLIM"
    val body = serviceOptions.getString("notificationBody")?.takeIf { it.isNotBlank() }
      ?: "Ubicación activa en segundo plano"
    builder.setContentTitle(title)
    builder.setContentText(body)
    builder.setColorized(false)

    val ctx = if (::mParentContext.isInitialized) mParentContext else applicationContext
    ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)?.let { launch ->
      launch.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
      val mutableFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
      val contentIntent = PendingIntent.getActivity(
        this,
        0,
        launch,
        PendingIntent.FLAG_UPDATE_CURRENT or mutableFlag,
      )
      builder.setContentIntent(contentIntent)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      builder.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE)
    }

    return builder
      .setCategory(Notification.CATEGORY_SERVICE)
      .setSmallIcon(android.R.drawable.ic_menu_mylocation)
      .setOngoing(true)
      .setAutoCancel(false)
      .setOnlyAlertOnce(true)
      .build()
  }

  @TargetApi(26)
  private fun prepareChannel(id: String) {
    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as? NotificationManager ?: return
    if (notificationManager.getNotificationChannel(id) != null) return
    val channel = NotificationChannel(id, "Ubicación BIOCLIM", NotificationManager.IMPORTANCE_DEFAULT)
    channel.description = "Mantiene la ubicación activa con la app en segundo plano"
    channel.setShowBadge(false)
    notificationManager.createNotificationChannel(channel)
  }

  companion object {
    private const val TAG = "expo-location"
    private const val NOTIFICATION_ID = 481756
    private const val CHANNEL_ID = "bioclim-ubicacion"
  }
}
