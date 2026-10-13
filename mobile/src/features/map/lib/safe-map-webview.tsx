import { entrarMapa, salirMapa } from "@/features/gps-fondo/mapa-ocupado";
import { MAP_WEBVIEW_BASE } from "@/features/map/lib/map-raster";
import { useFocusEffect } from "expo-router";
import { forwardRef, useCallback, useEffect, useState } from "react";
import { Platform, View, type StyleProp, type ViewStyle } from "react-native";
import { WebView, type WebViewProps } from "react-native-webview";

function sourceWithLeafletBase(source: WebViewProps["source"]): WebViewProps["source"] {
  if (!source || typeof source !== "object" || !("html" in source)) return source;
  const html = source as { html: string; baseUrl?: string };
  if (html.baseUrl && !html.baseUrl.includes("googleapis")) return source;
  return { ...html, baseUrl: MAP_WEBVIEW_BASE };
}

/**
 * Un WebView por mapa visible. Leaflet (teselas 2D) no usa WebGL.
 * Si el renderer muere, se remonta; no se cierra la app.
 */
export const SafeMapWebView = forwardRef<WebView, WebViewProps>(function SafeMapWebView(props, ref) {
  const [focused, setFocused] = useState(true);
  const [epoch, setEpoch] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  const visible = Platform.OS === "web" || focused;

  useEffect(() => {
    if (!visible) return;
    entrarMapa();
    return () => salirMapa();
  }, [visible]);

  if (!visible) {
    return <View style={props.style as StyleProp<ViewStyle>} />;
  }
  return (
    <WebView
      key={epoch}
      ref={ref}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      cacheEnabled={false}
      setSupportMultipleWindows={false}
      androidLayerType="hardware"
      overScrollMode="never"
      nestedScrollEnabled
      mixedContentMode="always"
      {...props}
      source={sourceWithLeafletBase(props.source)}
      geolocationEnabled={false}
      onRenderProcessGone={() => {
        setEpoch((n) => n + 1);
      }}
      onContentProcessDidTerminate={() => {
        setEpoch((n) => n + 1);
      }}
    />
  );
});
