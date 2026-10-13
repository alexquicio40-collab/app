import {
  buildRoutesMapHtml,
  routesMapUpdateScript,
} from "@/features/routes/navegacion/lib/routes-map-html";
import {
  deltaLabel,
  formatDuration,
  midCoord,
  trafficLabel,
} from "@/features/routes/navegacion/lib/format";
import type { DirectionsResult, LatLng } from "@/features/routes/navegacion/types";
import { theme } from "@/lib/theme";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeMapWebView } from "@/features/map/lib/safe-map-webview";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

type RoutesPreviewMapProps = {
  origin: LatLng | null;
  dest: LatLng | null;
  result: DirectionsResult | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

type MapRouteItem = {
  id: string;
  coords: LatLng[];
  mid: LatLng | null;
  minsLabel: string;
  delta: string;
  trafficText: string;
  trafficTone: "ok" | "warn" | "bad";
};

type MapRoutePayload = {
  type: "routes";
  selectedId: string | null;
  origin: LatLng | null;
  dest: LatLng | null;
  routes: MapRouteItem[];
};

function buildPayload(
  origin: LatLng | null,
  dest: LatLng | null,
  result: DirectionsResult | null,
  selectedId: string | null,
): MapRoutePayload {
  const routes = result ? [result.best, ...result.alternatives.slice(0, 3)] : [];
  const activeSeconds =
    routes.find((item) => item.id === selectedId)?.durationSeconds ??
    result?.best.durationSeconds ??
    0;

  return {
    type: "routes",
    selectedId,
    origin,
    dest,
    routes: routes.map((item) => {
      const traffic = trafficLabel(item.trafficRatio);
      return {
        id: item.id,
        coords: item.coords,
        mid: midCoord(item.coords),
        minsLabel: formatDuration(item.durationSeconds),
        delta:
          item.id === selectedId
            ? "Activa"
            : deltaLabel(activeSeconds, item.durationSeconds),
        trafficText: traffic.text,
        trafficTone: traffic.tone,
      };
    }),
  };
}

export function RoutesPreviewMap({
  origin,
  dest,
  result,
  selectedId,
  onSelect,
}: RoutesPreviewMapProps) {
  const html = useMemo(() => buildRoutesMapHtml(), []);
  const payload = useMemo(
    () => buildPayload(origin, dest, result, selectedId),
    [origin, dest, result, selectedId],
  );

  const webRef = useRef<WebView>(null);
  const frameRef = useRef<{
    contentWindow: { postMessage: (data: unknown, origin: string) => void } | null;
  } | null>(null);

  const push = useCallback((data: MapRoutePayload) => {
    if (Platform.OS === "web") {
      frameRef.current?.contentWindow?.postMessage(data, "*");
      return;
    }
    webRef.current?.injectJavaScript(routesMapUpdateScript(data));
  }, []);

  useEffect(() => {
    push(payload);
  }, [payload, push]);

  const handleSelect = useCallback(
    (raw: unknown) => {
      const data = raw as { type?: string; id?: string };
      if (data?.type === "select-route" && data.id) onSelect(data.id);
    },
    [onSelect],
  );

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      handleSelect(JSON.parse(event.nativeEvent.data));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onWindowMessage = (event: MessageEvent) => handleSelect(event.data);
    window.addEventListener("message", onWindowMessage);
    return () => window.removeEventListener("message", onWindowMessage);
  }, [handleSelect]);

  if (Platform.OS === "web") {
    return (
      <View style={styles.wrap}>
        <iframe
          ref={frameRef}
          title="Rutas sugeridas"
          srcDoc={html}
          style={styles.frame}
          onLoad={() => frameRef.current?.contentWindow?.postMessage(payload, "*")}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <SafeMapWebView
        ref={webRef}
        source={{ html, baseUrl: "https://maps.googleapis.com" }}
        style={styles.map}
        allowFileAccess
        onMessage={onMessage}
        onLoadEnd={() => webRef.current?.injectJavaScript(routesMapUpdateScript(payload))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 280,
    backgroundColor: theme.colors.cream,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: theme.colors.line,
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
