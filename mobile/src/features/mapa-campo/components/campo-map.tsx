import {
  buildCampoMapHtml,
  campoMapUpdateScript,
} from "@/features/mapa-campo/lib/campo-map-html";
import type { CampoMapPayload } from "@/features/mapa-campo/nav-types";
import type { LatLng } from "@/features/routes/navegacion/types";
import { theme } from "@/lib/theme";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

type CampoMapProps = {
  /** Payload de navegación in-app (polylines + follow). */
  payload?: CampoMapPayload | null;
  /** Fallback idle: destino seleccionado sin sesión de nav. */
  idleOrigin?: LatLng | null;
  idleDest?: LatLng | null;
  onSelectRoute?: (id: string) => void;
};

export function CampoMap({ payload, idleOrigin, idleDest, onSelectRoute }: CampoMapProps) {
  const html = useMemo(() => buildCampoMapHtml(), []);
  const effective = useMemo((): CampoMapPayload => {
    if (payload && (payload.tracking || payload.routes.length > 0)) return payload;
    return {
      type: "nav",
      tracking: false,
      position: idleOrigin ?? null,
      heading: 0,
      dest: idleDest ?? null,
      selectedId: null,
      routes: [],
    };
  }, [payload, idleOrigin, idleDest]);

  const webRef = useRef<WebView>(null);
  const frameRef = useRef<{
    contentWindow: { postMessage: (data: unknown, origin: string) => void } | null;
  } | null>(null);

  const push = useCallback((data: CampoMapPayload) => {
    if (Platform.OS === "web") {
      frameRef.current?.contentWindow?.postMessage(data, "*");
      return;
    }
    webRef.current?.injectJavaScript(campoMapUpdateScript(data));
  }, []);

  useEffect(() => {
    push(effective);
  }, [effective, push]);

  const handleSelect = useCallback(
    (raw: unknown) => {
      const data = raw as { type?: string; id?: string };
      if (data?.type === "select-route" && data.id) onSelectRoute?.(data.id);
    },
    [onSelectRoute],
  );

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onMessage = (event: MessageEvent) => handleSelect(event.data);
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [handleSelect]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      handleSelect(JSON.parse(event.nativeEvent.data));
    } catch {
      // ignore
    }
  };

  if (Platform.OS === "web") {
    return (
      <View style={styles.wrap}>
        <iframe
          ref={frameRef}
          title="Mapa de campo"
          srcDoc={html}
          style={styles.frame}
          onLoad={() => frameRef.current?.contentWindow?.postMessage(effective, "*")}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        mixedContentMode="always"
        allowFileAccess
        onMessage={onMessage}
        onLoadEnd={() => webRef.current?.injectJavaScript(campoMapUpdateScript(effective))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.cream },
  map: { flex: 1, backgroundColor: theme.colors.cream },
  frame: { width: "100%", height: "100%", borderWidth: 0 } as never,
});
