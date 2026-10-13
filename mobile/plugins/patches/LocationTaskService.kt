package expo.modules.location.services

import android.annotation.TargetApi
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.util.Log

/**
 * Parche de expo-location alineado con:
 * - expo/expo#47595: startForeground en onStartCommand, no en el bind async
 * - expo/expo#49425: el consumer arranca con startService, no startForegroundService
 * - expo/expo#51216: si startForeground falla, se para el servicio y no se cierra la app
 */
class LocationTaskService : Service() {
  private var mChannelId: String? = null
  private var mKillService = false
  private var mPromoted = false
  private lateinit var mParentContext: Context
  private val mServiceId = sServiceId++
  private val mBinder: IBinder = ServiceBinder()

  inner class ServiceBinder : Binder() {
    val service: LocationTaskService
      get() = this@LocationTaskService
  }

  override fun onBind(intent: Intent): IBinder {
    return mBinder
  }

  @TargetApi(26)
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val extras = intent?.extras
    if (extras != null) {
      mChannelId = extras.getString("appId") + ":" + extras.getString("taskName")
      mKillService = extras.getBoolean("killService", false)
    }
    if (mChannelId.isNullOrBlank()) {
      mChannelId = "bioclim-ubicacion"
    }
    val options = extras?.getBundle("serviceOptions")
    if (options != null && !mPromoted) {
      try {
        enterForeground(options)
        mPromoted = true
      } catch (e: Exception) {
        Log.e(TAG, "startForeground rejected", e)
        stopSelf()
        return START_NOT_STICKY
      }
    }
    return START_REDELIVER_INTENT
  }

  fun setParentContext(context: Context) {
    mParentContext = context
  }

  fun stop() {
    try {
      if (mPromoted) {
        @Suppress("DEPRECATION")
        stopForeground(true)
        mPromoted = false
      }
    } catch (e: Exception) {
      Log.w(TAG, "stopForeground failed", e)
    }
    try {
      stopSelf()
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
    try {
      enterForeground(serviceOptions)
      mPromoted = true
    } catch (e: Exception) {
      Log.e(TAG, "startForeground rejected", e)
      if (!mPromoted) {
        stop()
      }
    }
  }

  private fun enterForeground(serviceOptions: Bundle) {
    val notification = buildServiceNotification(serviceOptions)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      super.startForeground(mServiceId, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
    } else {
      super.startForeground(mServiceId, notification)
    }
  }

  private fun hostContext(): Context {
    return if (::mParentContext.isInitialized) mParentContext else applicationContext
  }

  @TargetApi(26)
  private fun buildServiceNotification(serviceOptions: Bundle): Notification {
    prepareChannel(mChannelId)
    val builder = Notification.Builder(this, mChannelId)
    val title = serviceOptions.getString("notificationTitle")?.takeIf { it.isNotBlank() } ?: "BIOCLIM"
    val body = serviceOptions.getString("notificationBody")?.takeIf { it.isNotBlank() }
      ?: "Ubicación activa en segundo plano"
    val color = colorStringToInteger(serviceOptions.getString("notificationColor"))

    builder.setContentTitle(title)
    builder.setContentText(body)
    color?.let {
      builder.setColorized(true).setColor(color)
    } ?: run {
      builder.setColorized(false)
    }

    hostContext().packageManager.getLaunchIntentForPackage(hostContext().packageName)?.let {
      it.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
      val mutableFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
      val contentIntent = PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or mutableFlag)
      builder.setContentIntent(contentIntent)
    }

    return builder.setCategory(Notification.CATEGORY_SERVICE)
      .setSmallIcon(notificationIcon())
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .build()
  }

  @TargetApi(26)
  private fun prepareChannel(id: String?) {
    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as? NotificationManager ?: return
    val channelId = id ?: return
    if (notificationManager.getNotificationChannel(channelId) != null) return
    val appName = applicationInfo.loadLabel(packageManager).toString()
    val channel = NotificationChannel(channelId, appName, NotificationManager.IMPORTANCE_LOW)
    channel.description = "Background location notification channel"
    notificationManager.createNotificationChannel(channel)
  }

  private fun notificationIcon(): Int {
    return try {
      val pkg = hostContext().packageManager
      val ai = pkg.getApplicationInfo(hostContext().packageName, PackageManager.GET_META_DATA)
      if (ai.metaData?.containsKey(META_DATA_FOREGROUND_SERVICE_ICON_KEY) == true) {
        ai.metaData.getInt(META_DATA_FOREGROUND_SERVICE_ICON_KEY)
      } else {
        defaultNotificationIcon()
      }
    } catch (e: Exception) {
      Log.e(TAG, "Could not fetch default notification icon.", e)
      defaultNotificationIcon()
    }
  }

  private fun defaultNotificationIcon(): Int {
    return hostContext().resources.getIdentifier("notification_icon", "drawable", hostContext().packageName)
      .takeIf { it != 0 }
      ?: applicationInfo.icon.takeIf { it != 0 }
      ?: android.R.drawable.ic_menu_mylocation
  }

  private fun colorStringToInteger(color: String?): Int? {
    return try {
      Color.parseColor(color)
    } catch (e: Exception) {
      null
    }
  }

  companion object {
    private const val TAG = "expo-location"
    private var sServiceId = 481756
    const val META_DATA_FOREGROUND_SERVICE_ICON_KEY: String =
      "expo.modules.location.foreground_service_icon"
  }
}
