import {
  buildRutasMapaHtml,
  rutasMapaUpdateScript,
} from "@/features/rutas-mapa/lib/rutas-mapa-html";
import type { RutasMapaPayload } from "@/features/rutas-mapa/types";
import { theme } from "@/lib/theme";
import { useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeMapWebView } from "@/features/map/lib/safe-map-webview";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

type RutasMapaMapProps = {
  payload: RutasMapaPayload;
  onSelect: (id: string | null) => void;
};

export function RutasMapaMap({ payload, onSelect }: RutasMapaMapProps) {
  const html = useMemo(() => buildRutasMapaHtml(), []);
  const web = useRef<WebView>(null);
  const frame = useRef<{
    contentWindow: { postMessage: (data: unknown, origin: string) => void } | null;
  } | null>(null);
  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  const post = (data: unknown) => {
    if (Platform.OS === "web") {
      frame.current?.contentWindow?.postMessage({ __rutasMapa: true, payload: data }, "*");
      return;
    }
    web.current?.injectJavaScript(rutasMapaUpdateScript(data));
  };

  useEffect(() => {
    post(payload);
  }, [payload]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      const msg = data as { type?: string; id?: string | null };
      if (msg.type === "ready") post(payloadRef.current);
      if (msg.type === "select") onSelect(msg.id ?? null);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onSelect]);

  const onNativeMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type?: string; id?: string | null };
      if (msg.type === "ready") post(payloadRef.current);
      if (msg.type === "select") onSelect(msg.id ?? null);
    } catch {
      // ignore
    }
  };

  if (Platform.OS === "web") {
    return (
      <View style={styles.wrap}>
        <iframe
          ref={frame as never}
          title="Rutas en mapa"
          srcDoc={html}
          style={styles.frame}
          onLoad={() => {
            setTimeout(() => post(payloadRef.current), 120);
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
          post(payloadRef.current);
          setTimeout(() => post(payloadRef.current), 400);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.cream, overflow: "hidden" },
  map: { flex: 1, backgroundColor: theme.colors.cream },
  frame: { width: "100%", height: "100%", borderWidth: 0 } as never,
});
