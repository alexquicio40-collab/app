package expo.modules.bioclimlocation

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BioclimLocationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BioclimLocation")

    AsyncFunction("start") {
      val activity = appContext.currentActivity ?: return@AsyncFunction false
      BioclimLocationService.start(activity.applicationContext)
    }

    AsyncFunction("stop") {
      val ctx = appContext.currentActivity?.applicationContext
        ?: appContext.reactContext?.applicationContext
        ?: return@AsyncFunction false
      BioclimLocationService.stop(ctx)
      true
    }

    Function("isRunning") {
      BioclimLocationService.running
    }
  }
}
