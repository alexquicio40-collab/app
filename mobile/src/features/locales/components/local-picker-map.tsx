import {
  buildLocalPickerMapHtml,
  localPickerSetScript,
} from "@/features/locales/lib/local-picker-map-html";
import { theme } from "@/lib/theme";
import { useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeMapWebView } from "@/features/map/lib/safe-map-webview";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

type LocalPickerMapProps = {
  lat: number | null;
  lng: number | null;
  onPick: (coords: { lat: number; lng: number }) => void;
};

/** Mapa embebido: tap / arrastrar pin → coords. */
export function LocalPickerMap({ lat, lng, onPick }: LocalPickerMapProps) {
  const html = useMemo(() => buildLocalPickerMapHtml(), []);
  const web = useRef<WebView>(null);
  const frame = useRef<{ contentWindow: { postMessage: (data: unknown, origin: string) => void } | null } | null>(
    null,
  );
  const coordsRef = useRef({ lat, lng });
  coordsRef.current = { lat, lng };

  const pushPosition = (nextLat: number, nextLng: number, moveCamera = true) => {
    if (Platform.OS === "web") {
      frame.current?.contentWindow?.postMessage(
        { __localPicker: true, lat: nextLat, lng: nextLng, moveCamera },
        "*",
      );
      return;
    }
    web.current?.injectJavaScript(localPickerSetScript(nextLat, nextLng, moveCamera));
  };

  useEffect(() => {
    if (lat == null || lng == null) return;
    pushPosition(lat, lng, true);
  }, [lat, lng]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      const msg = data as { type?: string; lat?: number; lng?: number };
      if (msg.type === "ready") {
        const c = coordsRef.current;
        if (c.lat != null && c.lng != null) pushPosition(c.lat, c.lng, true);
      }
      if (msg.type === "pick" && msg.lat != null && msg.lng != null) {
        onPick({ lat: msg.lat, lng: msg.lng });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onPick]);

  const onNativeMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        lat?: number;
        lng?: number;
      };
      if (msg.type === "ready") {
        const c = coordsRef.current;
        if (c.lat != null && c.lng != null) pushPosition(c.lat, c.lng, true);
      }
      if (msg.type === "pick" && msg.lat != null && msg.lng != null) {
        onPick({ lat: msg.lat, lng: msg.lng });
      }
    } catch {
      // ignore
    }
  };

  if (Platform.OS === "web") {
    return (
      <View style={styles.wrap}>
        <iframe
          ref={frame}
          title="Ubicación del local"
          srcDoc={html}
          style={styles.frame}
          onLoad={() => {
            setTimeout(() => {
              const c = coordsRef.current;
              if (c.lat != null && c.lng != null) pushPosition(c.lat, c.lng, true);
            }, 120);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <SafeMapWebView
        ref={web}
        source={{ html, baseUrl: "https://maps.googleapis.com" }}
        style={styles.map}
        allowFileAccess
        onMessage={onNativeMessage}
        onLoadEnd={() => {
          const c = coordsRef.current;
          const inject = () => {
            if (c.lat != null && c.lng != null) {
              web.current?.injectJavaScript(localPickerSetScript(c.lat, c.lng, true));
            }
          };
          inject();
          setTimeout(inject, 500);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 240,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
  },
  map: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  frame: {
    width: "100%",
    height: "100%",
    borderWidth: 0,
  } as never,
});
