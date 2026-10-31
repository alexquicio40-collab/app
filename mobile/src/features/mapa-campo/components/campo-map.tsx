import { CompassButton } from "@/features/map/components/compass-button";
import { GmapsChip } from "@/features/map/components/gmaps-chip";
import { LocateButton } from "@/features/map/components/locate-button";
import {
  buildCampoMapHtml,
  campoMapCenterRouteScript,
  campoMapNorthUpScript,
  campoMapRecenterScript,
  campoMapUpdateScript,
} from "@/features/mapa-campo/lib/campo-map-html";
import type { CampoMapPayload, CampoMapPin } from "@/features/mapa-campo/nav-types";
import type { LatLng } from "@/features/routes/navegacion/types";
import { theme } from "@/lib/theme";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutAnimation, Platform, StyleSheet, UIManager, View } from "react-native";
import { SafeMapWebView } from "@/features/map/lib/safe-map-webview";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

type CampoMapMessage = {
  type?: string;
  id?: string;
  on?: boolean;
  northUp?: boolean;
  heading?: number;
};

type CampoMapProps = {
  payload?: CampoMapPayload | null;
  idleOrigin?: LatLng | null;
  idleAccuracy?: number | null;
  idleDest?: LatLng | null;
  idleDestColor?: string | null;
  pins?: CampoMapPin[];
  selectedPinId?: string | null;
  focusToken?: number;
  onSelectRoute?: (id: string) => void;
  onSelectPin?: (id: string) => void;
  locateBottom?: number;
};

export function CampoMap({
  payload,
  idleOrigin,
  idleAccuracy,
  idleDest,
  idleDestColor,
  pins,
  selectedPinId,
  focusToken = 0,
  onSelectRoute,
  onSelectPin,
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
            accuracy: idleAccuracy ?? null,
            dest: idleDest ?? null,
            destColor: idleDestColor ?? null,
            selectedId: null,
            routes: [],
            traveled: [],
          };
    return {
      ...base,
      accuracy: base.accuracy ?? idleAccuracy ?? null,
      pins: pins ?? base.pins ?? [],
      selectedPinId: selectedPinId ?? base.selectedPinId ?? null,
      focusToken,
    };
  }, [payload, idleOrigin, idleAccuracy, idleDest, idleDestColor, pins, selectedPinId, focusToken]);

  const [following, setFollowing] = useState(false);
  const [northUp, setNorthUp] = useState(true);
  const [mapHeading, setMapHeading] = useState(0);
  const webRef = useRef<WebView>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

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
    if (!effective.tracking) {
      setFollowing(false);
      setNorthUp(true);
      setMapHeading(0);
    }
  }, [effective.tracking]);

  const swapCam = useCallback((next: boolean) => {
    setFollowing((prev) => {
      if (prev === next) return prev;
      if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
      LayoutAnimation.configureNext({
        duration: 220,
        create: { type: "easeInEaseOut", property: "opacity" },
        update: { type: "easeInEaseOut" },
        delete: { type: "easeInEaseOut", property: "opacity" },
      });
      return next;
    });
  }, []);

  const recenter = useCallback(() => {
    setNorthUp(false);
    swapCam(true);
    if (Platform.OS === "web") {
      frameRef.current?.contentWindow?.postMessage({ type: "recenter" }, "*");
      return;
    }
    webRef.current?.injectJavaScript(campoMapRecenterScript());
  }, [swapCam]);

  const centerRoute = useCallback(() => {
    setNorthUp(true);
    setMapHeading(0);
    swapCam(false);
    if (Platform.OS === "web") {
      frameRef.current?.contentWindow?.postMessage({ type: "center-route" }, "*");
      return;
    }
    webRef.current?.injectJavaScript(campoMapCenterRouteScript());
  }, [swapCam]);

  const resetNorth = useCallback(() => {
    setNorthUp(true);
    setMapHeading(0);
    if (Platform.OS === "web") {
      frameRef.current?.contentWindow?.postMessage({ type: "north-up" }, "*");
      return;
    }
    webRef.current?.injectJavaScript(campoMapNorthUpScript());
  }, []);

  const handleSelect = useCallback(
    (raw: unknown) => {
      const data = raw as CampoMapMessage;
      if (data?.type === "follow") {
        swapCam(!!data.on);
        if (data.northUp != null) setNorthUp(!!data.northUp);
        return;
      }
      if (data?.type === "map-heading" && Number.isFinite(data.heading)) {
        setMapHeading(((Number(data.heading) % 360) + 360) % 360);
        return;
      }
      if (data?.type === "select-pin" && data.id) onSelectPin?.(data.id);
      if (data?.type === "select-route" && data.id) onSelectRoute?.(data.id);
    },
    [onSelectPin, onSelectRoute, swapCam],
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

  const tracking = effective.tracking;
  const headingUp = tracking && following && !northUp;
  const spin = ((mapHeading % 360) + 360) % 360;
  const fillCorners = spin > 8 && spin < 352;
  const camSpin = {
    transform: fillCorners
      ? [{ rotate: `${-mapHeading}deg` }, { scale: 1.42 }]
      : [{ rotate: `${-mapHeading}deg` }],
  };
  const fabs = (
    <View style={[styles.fabs, { bottom: locateBottom }]} pointerEvents="box-none">
      {tracking ? (
        headingUp ? (
          <GmapsChip kind="center" onPress={centerRoute} />
        ) : (
          <GmapsChip kind="locate" onPress={recenter} />
        )
      ) : (
        <LocateButton active={following} onPress={recenter} />
      )}
      <CompassButton heading={mapHeading} onPress={resetNorth} />
    </View>
  );

  if (Platform.OS === "web") {
    return (
      <View style={styles.wrap} collapsable={false}>
        <View style={[styles.camSpin, camSpin]} collapsable={false}>
          <iframe
            ref={frameRef}
            title="Mapa de campo"
            srcDoc={html}
            style={styles.frame}
            allow="geolocation; accelerometer; gyroscope; magnetometer"
            onLoad={() => {
              frameRef.current?.contentWindow?.postMessage(effective, "*");
            }}
          />
        </View>
        {fabs}
      </View>
    );
  }

  return (
    <View style={styles.wrap} collapsable={false}>
      <SafeMapWebView
        ref={webRef}
        persist
        androidLayerType="hardware"
        source={{ html, baseUrl: "https://unpkg.com" }}
        style={[styles.map, camSpin]}
        allowFileAccess
        onMessage={onMessage}
        onLoadEnd={() => {
          webRef.current?.injectJavaScript(campoMapUpdateScript(effective));
        }}
      />
      {fabs}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 0, width: "100%", overflow: "hidden", backgroundColor: theme.colors.cream },
  camSpin: { flex: 1, minHeight: 0, width: "100%" },
  map: { flex: 1, minHeight: 0, width: "100%", backgroundColor: theme.colors.cream },
  frame: { width: "100%", height: "100%", borderWidth: 0 } as never,
  fabs: {
    position: "absolute",
    right: 12,
    zIndex: 6,
    gap: 10,
    alignItems: "flex-end",
  },
});
