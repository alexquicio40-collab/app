import { useLiveMap } from "@/features/map/hooks";
import { useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { buildMiniFlotaHtml, miniFlotaUpdateScript, type MiniFlotaPin } from "../lib/mini-flota-html";
import type { CamionRendimiento } from "../types";

type MiniFlotaMapProps = {
  camiones: CamionRendimiento[];
};

function avanceDe(nombre: string, camiones: CamionRendimiento[]) {
  const key = nombre.trim().toLowerCase();
  const hit = camiones.find((item) => {
    const other = item.nombre.trim().toLowerCase();
    return other === key || other.includes(key) || key.includes(other);
  });
  return hit?.avance ?? null;
}

export function MiniFlotaMap({ camiones }: MiniFlotaMapProps) {
  const live = useLiveMap();
  const html = useMemo(() => buildMiniFlotaHtml(), []);
  const pins = useMemo<MiniFlotaPin[]>(
    () =>
      live.data.operators
        .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
        .map((item) => ({
          id: String(item.id),
          nombre: item.name || "Camión",
          lat: item.latitude,
          lng: item.longitude,
          avance: avanceDe(item.name, camiones),
        })),
    [live.data.operators, camiones],
  );
  const payload = useMemo(() => ({ pins }), [pins]);
  const web = useRef<WebView>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  const post = (data: unknown) => {
    if (Platform.OS === "web") {
      frame.current?.contentWindow?.postMessage({ __miniFlota: true, payload: data }, "*");
      return;
    }
    web.current?.injectJavaScript(miniFlotaUpdateScript(data));
  };

  useEffect(() => {
    post(payload);
  }, [payload]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if ((data as { type?: string }).type === "ready") post(payloadRef.current);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const onNativeMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type?: string };
      if (msg.type === "ready") post(payloadRef.current);
    } catch {
      // ignore
    }
  };

  if (Platform.OS === "web") {
    return (
      <View style={styles.wrap}>
        <iframe
          ref={frame}
          title="Camiones en ruta"
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
      <WebView
        ref={web}
        originWhitelist={["*"]}
        source={{ html, baseUrl: "https://maps.googleapis.com" }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        allowFileAccess
        setSupportMultipleWindows={false}
        onMessage={onNativeMessage}
        onLoadEnd={() => {
          const inject = () => web.current?.injectJavaScript(miniFlotaUpdateScript(payloadRef.current));
          inject();
          setTimeout(inject, 500);
          setTimeout(inject, 1500);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  map: { flex: 1, backgroundColor: "#EAF3ED" },
  frame: {
    width: "100%",
    height: "100%",
    borderWidth: 0,
    backgroundColor: "#EAF3ED",
  } as unknown as object,
});
