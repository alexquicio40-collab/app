import { buildGoogleMapHtml, mapUpdateScript } from "@/features/map/lib/google-map";
import type { AdminCoords } from "@/features/map/lib/admin-location";
import type { LiveOperator, LiveStop } from "@/features/map/types";
import { theme } from "@/lib/theme";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export type LiveMapHandle = {
  sendCmd: (action: "traffic" | "satellite") => void;
  showMyLocation: (coords: AdminCoords) => void;
};

type LiveMapProps = {
  operators: LiveOperator[];
  stops: LiveStop[];
  selectedId: number | null;
};

type LivePayload = {
  type: "live";
  selectedId: number | null;
  operators: Array<{
    id: number;
    name: string;
    lat: number;
    lng: number;
    speed: number;
    estado: LiveOperator["estado"];
  }>;
  stops: Array<{
    operatorId: number;
    name: string;
    lat: number;
    lng: number;
  }>;
};

type LocatePayload = {
  type: "locate";
  lat: number;
  lng: number;
  accuracy: number;
};

function toPayload(operators: LiveOperator[], stops: LiveStop[], selectedId: number | null): LivePayload {
  return {
    type: "live",
    selectedId,
    operators: operators.map((item) => ({
      id: item.id,
      name: item.name,
      lat: item.latitude,
      lng: item.longitude,
      speed: item.speed,
      estado: item.estado,
    })),
    stops: stops.map((item) => ({
      operatorId: item.operatorId,
      name: item.localName,
      lat: item.latitude,
      lng: item.longitude,
    })),
  };
}

export const LiveMap = forwardRef<LiveMapHandle, LiveMapProps>(function LiveMap(
  { operators, stops, selectedId },
  ref,
) {
  const html = useMemo(() => buildGoogleMapHtml(), []);
  const payload = useMemo(() => toPayload(operators, stops, selectedId), [operators, stops, selectedId]);
  const frame = useRef<{ contentWindow: { postMessage: (data: unknown, origin: string) => void } | null } | null>(
    null,
  );
  const web = useRef<WebView>(null);

  const post = (data: unknown) => {
    if (Platform.OS === "web") {
      frame.current?.contentWindow?.postMessage(data, "*");
      return;
    }

    if (data && typeof data === "object" && "type" in data) {
      const msg = data as { type: string; action?: string; lat?: number; lng?: number; accuracy?: number };

      if (msg.type === "cmd") {
        web.current?.injectJavaScript(
          `window.runMapCmd && window.runMapCmd(${JSON.stringify(msg.action)}); true;`,
        );
        return;
      }

      if (msg.type === "locate") {
        web.current?.injectJavaScript(
          `window.showMyLocation && window.showMyLocation(${msg.lat}, ${msg.lng}, ${msg.accuracy}); true;`,
        );
        return;
      }
    }

    web.current?.injectJavaScript(mapUpdateScript(data));
  };

  useImperativeHandle(ref, () => ({
    sendCmd: (action) => post({ type: "cmd", action }),
    showMyLocation: (coords) => {
      const msg: LocatePayload = {
        type: "locate",
        lat: coords.lat,
        lng: coords.lng,
        accuracy: coords.accuracy,
      };
      post(msg);
    },
  }));

  useEffect(() => {
    post(payload);
  }, [payload]);

  if (Platform.OS === "web") {
    return (
      <View style={styles.wrap}>
        <iframe
          ref={frame}
          title="Mapa en vivo"
          srcDoc={html}
          style={styles.frame}
          allow="geolocation"
          onLoad={() => frame.current?.contentWindow?.postMessage(payload, "*")}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <WebView
        ref={web}
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        mixedContentMode="always"
        allowFileAccess
        onLoadEnd={() => web.current?.injectJavaScript(mapUpdateScript(payload))}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: theme.colors.accentDeep,
  },
  map: {
    flex: 1,
    backgroundColor: theme.colors.accentDeep,
  },
  frame: {
    width: "100%",
    height: "100%",
    borderWidth: 0,
  } as never,
});
