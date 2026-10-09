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
import android.graphics.Color
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.IBinder

/**
 * Servicio oficial de expo-location (SDK 57) + lo que exige Android 14:
 * startForeground con FOREGROUND_SERVICE_TYPE_LOCATION e icono distinto de 0.
 * https://developer.android.com/about/versions/14/changes/fgs-types-required
 */
class LocationTaskService : Service() {
  private var mChannelId: String? = null
  private var mKillService = false
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

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val extras = intent?.extras
    if (extras != null) {
      mChannelId = extras.getString("appId") + ":" + extras.getString("taskName")
      mKillService = extras.getBoolean("killService", false)
    }
    if (mChannelId.isNullOrBlank()) mChannelId = "expo-location:foreground"
    return START_REDELIVER_INTENT
  }

  fun setParentContext(context: Context) {
    mParentContext = context
  }

  fun stop() {
    stopForeground(true)
    stopSelf()
  }

  override fun onTaskRemoved(rootIntent: Intent) {
    if (mKillService) {
      super.onTaskRemoved(rootIntent)
      stop()
    }
  }

  fun startForeground(serviceOptions: Bundle) {
    val notification = buildServiceNotification(serviceOptions)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      super.startForeground(mServiceId, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
    } else {
      super.startForeground(mServiceId, notification)
    }
  }

  @TargetApi(26)
  private fun buildServiceNotification(serviceOptions: Bundle): Notification {
    if (mChannelId.isNullOrBlank()) mChannelId = "expo-location:foreground"
    prepareChannel(mChannelId)
    val builder = Notification.Builder(this, mChannelId)
    val title = serviceOptions.getString("notificationTitle")
    val body = serviceOptions.getString("notificationBody")
    val color = colorStringToInteger(serviceOptions.getString("notificationColor"))

    title?.let { builder.setContentTitle(title) }
    body?.let { builder.setContentText(body) }
    color?.let {
      builder.setColorized(true).setColor(color)
    } ?: run {
      builder.setColorized(false)
    }

    val ctx = if (::mParentContext.isInitialized) mParentContext else applicationContext
    ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)?.let {
      it.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
      val mutableFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
      val contentIntent = PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or mutableFlag)
      builder.setContentIntent(contentIntent)
    }

    val iconsResId = try {
      val packageManager = ctx.packageManager
      val ai = packageManager.getApplicationInfo(
        ctx.packageName,
        android.content.pm.PackageManager.GET_META_DATA
      )
      if (ai.metaData?.containsKey(META_DATA_FOREGROUND_SERVICE_ICON_KEY) == true) {
        ai.metaData.getInt(META_DATA_FOREGROUND_SERVICE_ICON_KEY)
      } else {
        getDefaultNotificationIcon(ctx)
      }
    } catch (e: Exception) {
      android.util.Log.e("expo-location", "Could not fetch default notification icon.", e)
      getDefaultNotificationIcon(ctx)
    }

    val smallIcon = if (iconsResId != 0) iconsResId else android.R.drawable.ic_menu_mylocation
    return builder.setCategory(Notification.CATEGORY_SERVICE)
      .setSmallIcon(smallIcon)
      .setOngoing(true)
      .setAutoCancel(false)
      .setOnlyAlertOnce(true)
      .build()
  }

  @TargetApi(26)
  private fun prepareChannel(id: String?) {
    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as? NotificationManager
      ?: return
    val appName = applicationInfo.loadLabel(packageManager).toString()
    var channel = notificationManager.getNotificationChannel(id)
    if (channel == null) {
      channel = NotificationChannel(id, appName, NotificationManager.IMPORTANCE_LOW)
      channel.description = "Background location notification channel"
      channel.setShowBadge(false)
      notificationManager.createNotificationChannel(channel)
    }
  }

  private fun getDefaultNotificationIcon(ctx: Context): Int {
    return ctx.resources.getIdentifier("notification_icon", "drawable", ctx.packageName)
      .takeIf { it != 0 }
      ?: ctx.resources.getIdentifier("location_foreground_service_icon", "drawable", ctx.packageName)
        .takeIf { it != 0 }
      ?: applicationInfo.icon
  }

  private fun colorStringToInteger(color: String?): Int? {
    return try {
      Color.parseColor(color)
    } catch (e: Exception) {
      null
    }
  }

  companion object {
    private var sServiceId = 481756
    const val META_DATA_FOREGROUND_SERVICE_ICON_KEY: String =
      "expo.modules.location.foreground_service_icon"
  }
}
