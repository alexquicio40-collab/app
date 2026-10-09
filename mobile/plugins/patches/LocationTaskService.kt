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

class LocationTaskService : Service() {
  private var mChannelId: String? = CHANNEL_ID
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
    mChannelId = CHANNEL_ID
    val defaults = Bundle()
    defaults.putString("notificationTitle", "BIOCLIM")
    defaults.putString("notificationBody", "Ubicación activa en segundo plano")
    defaults.putString("notificationColor", "#0B5340")
    promoteToForeground(defaults)
    return START_STICKY
  }

  fun setParentContext(context: Context) {
    mParentContext = context
  }

  fun stop() {
    if (Build.VERSION.SDK_INT >= 24) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
    stopSelf()
  }

  override fun onTaskRemoved(rootIntent: Intent) {
    // La notificación y el GPS siguen aunque cierren la app.
  }

  fun startForeground(serviceOptions: Bundle) {
    promoteToForeground(serviceOptions)
  }

  private fun hostContext(): Context {
    return if (::mParentContext.isInitialized) mParentContext else applicationContext
  }

  private fun promoteToForeground(serviceOptions: Bundle) {
    try {
      val notification = buildServiceNotification(serviceOptions)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        super.startForeground(mServiceId, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
      } else {
        super.startForeground(mServiceId, notification)
      }
    } catch (error: Throwable) {
      android.util.Log.e("expo-location", "No se pudo pasar el servicio a primer plano", error)
    }
  }

  @TargetApi(26)
  private fun buildServiceNotification(serviceOptions: Bundle): Notification {
    val channelId = CHANNEL_ID
    mChannelId = channelId
    prepareChannel(channelId)
    val builder = Notification.Builder(this, channelId)
    val title = serviceOptions.getString("notificationTitle") ?: "BIOCLIM"
    val body = serviceOptions.getString("notificationBody") ?: "Ubicación activa en segundo plano"
    val color = colorStringToInteger(serviceOptions.getString("notificationColor"))

    builder.setContentTitle(title)
    builder.setContentText(body)
    color?.let {
      builder.setColorized(true).setColor(color)
    } ?: run {
      builder.setColorized(false)
    }

    val ctx = hostContext()
    ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)?.let {
      it.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
      val mutableFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
      val contentIntent = PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or mutableFlag)
      builder.setContentIntent(contentIntent)
    }

    builder.setCategory(Notification.CATEGORY_SERVICE)
      .setSmallIcon(android.R.drawable.ic_menu_mylocation)
      .setOngoing(true)
      .setAutoCancel(false)
      .setOnlyAlertOnce(true)
      .setVisibility(Notification.VISIBILITY_PUBLIC)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      @Suppress("DEPRECATION")
      builder.setPriority(Notification.PRIORITY_LOW)
    }

    val notification = builder.build()
    notification.flags = notification.flags or
      Notification.FLAG_ONGOING_EVENT or
      Notification.FLAG_NO_CLEAR or
      Notification.FLAG_FOREGROUND_SERVICE
    return notification
  }

  @TargetApi(26)
  private fun prepareChannel(id: String) {
    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as? NotificationManager
      ?: return
    var channel = notificationManager.getNotificationChannel(id)
    if (channel == null) {
      channel = NotificationChannel(id, "Ubicación BIOCLIM", NotificationManager.IMPORTANCE_LOW)
      channel.description = "Notificación permanente mientras el GPS está activo"
      channel.setShowBadge(false)
      channel.enableVibration(false)
      channel.enableLights(false)
      channel.setSound(null, null)
      notificationManager.createNotificationChannel(channel)
    }
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
    private const val CHANNEL_ID = "bioclim.gps.fijo"
  }
}
