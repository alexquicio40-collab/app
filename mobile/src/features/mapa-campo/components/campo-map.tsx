import { LocateButton } from "@/features/map/components/locate-button";
import {
  buildCampoMapHtml,
  campoMapRecenterScript,
  campoMapUpdateScript,
} from "@/features/mapa-campo/lib/campo-map-html";
import type { CampoMapPayload, CampoMapPin } from "@/features/mapa-campo/nav-types";
import type { LatLng } from "@/features/routes/navegacion/types";
import { theme } from "@/lib/theme";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

type CampoMapMessage = {
  type?: string;
  id?: string;
  on?: boolean;
};

type CampoMapProps = {
  /** Payload de navegación in-app (polylines + follow). */
  payload?: CampoMapPayload | null;
  /** Fallback idle: destino seleccionado sin sesión de nav. */
  idleOrigin?: LatLng | null;
  idleDest?: LatLng | null;
  idleDestColor?: string | null;
  pins?: CampoMapPin[];
  selectedPinId?: string | null;
  onSelectRoute?: (id: string) => void;
  onSelectPin?: (id: string) => void;
  /** FAB para volver a centrar el carrito tras mover el mapa. */
  showRecenter?: boolean;
  locateBottom?: number;
};

export function CampoMap({
  payload,
  idleOrigin,
  idleDest,
  idleDestColor,
  pins,
  selectedPinId,
  onSelectRoute,
  onSelectPin,
  showRecenter = false,
  locateBottom = 16,
}: CampoMapProps) {
  const html = useMemo(() => buildCampoMapHtml(), []);
  const effective = useMemo((): CampoMapPayload => {
    const base: CampoMapPayload =
      payload && (payload.tracking || payload.routes.length > 0)
        ? payload
        : {
            type: "nav",
            tracking: false,
            position: idleOrigin ?? null,
            heading: 0,
            dest: idleDest ?? null,
            destColor: idleDestColor ?? null,
            selectedId: null,
            routes: [],
            traveled: [],
          };
    return {
      ...base,
      pins: pins ?? base.pins ?? [],
      selectedPinId: selectedPinId ?? base.selectedPinId ?? null,
    };
  }, [payload, idleOrigin, idleDest, idleDestColor, pins, selectedPinId]);

  const [following, setFollowing] = useState(true);
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

  useEffect(() => {
    if (showRecenter) setFollowing(true);
  }, [showRecenter]);

  const recenter = useCallback(() => {
    setFollowing(true);
    if (Platform.OS === "web") {
      frameRef.current?.contentWindow?.postMessage({ type: "recenter" }, "*");
      return;
    }
    webRef.current?.injectJavaScript(campoMapRecenterScript());
  }, []);

  const handleSelect = useCallback(
    (raw: unknown) => {
      const data = raw as CampoMapMessage;
      if (data?.type === "follow") {
        setFollowing(!!data.on);
        return;
      }
      if (data?.type === "select-pin" && data.id) onSelectPin?.(data.id);
      if (data?.type === "select-route" && data.id) onSelectRoute?.(data.id);
    },
    [onSelectPin, onSelectRoute],
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

  const locateFab = showRecenter ? (
    <View style={[styles.locate, { bottom: locateBottom }]} pointerEvents="box-none">
      <LocateButton active={following} onPress={recenter} />
    </View>
  ) : null;

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
        {locateFab}
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
      {locateFab}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.cream },
  map: { flex: 1, backgroundColor: theme.colors.cream },
  frame: { width: "100%", height: "100%", borderWidth: 0 } as never,
  locate: {
    position: "absolute",
    right: 10,
    zIndex: 6,
  },
});
