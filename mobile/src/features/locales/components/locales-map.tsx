import {
  buildLocalesMapHtml,
  localesMapUpdateScript,
  type LocalesMapPin,
} from "@/features/locales/lib/locales-map-html";
import { useMyLocation } from "@/features/map/lib/use-my-location";
import { normalizePrioridad } from "@/features/locales/lib/prioridad";
import type { LocalItem } from "@/features/locales/types";
import { theme } from "@/lib/theme";
import { useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeMapWebView } from "@/features/map/lib/safe-map-webview";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

type LocalesMapProps = {
  locales: LocalItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

function toPins(locales: LocalItem[]): LocalesMapPin[] {
  return locales
    .filter((item) => item.latitud != null && item.longitud != null)
    .map((item) => ({
      id: item.id,
      nombre: item.nombre,
      lat: item.latitud!,
      lng: item.longitud!,
      tone: normalizePrioridad(item.prioridad),
      restringido: Boolean(item.restringido),
    }));
}

export function LocalesMap({ locales, selectedId, onSelect }: LocalesMapProps) {
  const me = useMyLocation();
  const html = useMemo(() => buildLocalesMapHtml(), []);
  const pins = useMemo(() => toPins(locales), [locales]);
  const payload = useMemo(() => ({ pins, selectedId, me }), [pins, selectedId, me]);
  const web = useRef<WebView>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  const post = (data: unknown) => {
    if (Platform.OS === "web") {
      frame.current?.contentWindow?.postMessage({ __localesMap: true, payload: data }, "*");
      return;
    }
    web.current?.injectJavaScript(localesMapUpdateScript(data));
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
          ref={frame}
          title="Mapa de locales"
          srcDoc={html}
          style={styles.frame}
          allow="geolocation; accelerometer; gyroscope; magnetometer"
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
          const inject = () => web.current?.injectJavaScript(localesMapUpdateScript(payloadRef.current));
          inject();
          setTimeout(inject, 500);
          setTimeout(inject, 1500);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  map: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  frame: {
    width: "100%",
    height: "100%",
    borderWidth: 0,
  } as never,
});
