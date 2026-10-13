import { CajaDiariaSheet } from "@/features/caja-diaria";
import { ActionsPanel } from "@/features/map/components/actions-panel";
import { LiveMap, type LiveMapHandle } from "@/features/map/components/live-map";
import { CompassButton } from "@/features/map/components/compass-button";
import { LocateButton } from "@/features/map/components/locate-button";
import { requestCompassPermission, useCompassHeading } from "@/features/map/lib/use-compass-heading";
import { useMyLocation } from "@/features/map/lib/use-my-location";
import { getAdminCoords } from "@/features/map/lib/admin-location";
import {
  OperadoresRail,
  OperadoresSearchBar,
  OperatorDetailSheet,
  useOperadoresScreen,
} from "@/features/operadores";
import { theme } from "@/lib/theme";
import { HeaderAction, IconCash } from "@/ui/header-action";
import { ScreenHeader } from "@/ui/screen-header";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";

export default function OperadoresScreen() {
  const screen = useOperadoresScreen();
  const live = useRef<LiveMapHandle>(null);
  const bottomPad = useContentBottomPad(8);
  const [trafficOn, setTrafficOn] = useState(false);
  const [satelliteOn, setSatelliteOn] = useState(false);
  const [locating, setLocating] = useState(false);
  const [located, setLocated] = useState(false);
  const [compassOn, setCompassOn] = useState(false);
  const me = useMyLocation();
  const heading = useCompassHeading(compassOn);

  useEffect(() => {
    if (!me) return;
    live.current?.showMyLocation(me, false);
    setLocated(true);
  }, [me]);

  const locateMe = useCallback(async () => {
    if (locating) return;
    setLocating(true);
    try {
      const coords = await getAdminCoords();
      live.current?.showMyLocation(coords);
      setLocated(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo obtener tu ubicación";
      if (Platform.OS === "web") window.alert(message);
      else Alert.alert("Ubicación", message);
    } finally {
      setLocating(false);
    }
  }, [locating]);

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Operadores"
        subtitle="Flota en vivo"
        trailing={
          screen.canAssignCaja ? (
            <HeaderAction
              label="Caja"
              icon={<IconCash color="#FFFFFF" />}
              onPress={() => screen.setCajaOpen(true)}
              compact
              accessibilityLabel="Caja del día"
            />
          ) : null
        }
      />

      <OperadoresSearchBar
        value={screen.query}
        onChange={screen.setQuery}
        onlineLabel={screen.onlineLabel}
        live={screen.map.live}
      />

      <View style={styles.stage}>
        <LiveMap
          ref={live}
          operators={screen.filtered}
          stops={screen.map.data.stops}
          selectedId={screen.map.selectedId}
          heading={heading}
        />

        <View style={styles.left}>
          <ActionsPanel
            online={screen.map.online}
            onRoute={screen.map.onRoute}
            live={screen.map.live}
            filter={screen.map.filter}
            onFilter={screen.map.setFilter}
            trafficOn={trafficOn}
            satelliteOn={satelliteOn}
            onTraffic={() => {
              live.current?.sendCmd("traffic");
              setTrafficOn((value) => !value);
            }}
            onSatellite={() => {
              live.current?.sendCmd("satellite");
              setSatelliteOn((value) => !value);
            }}
            onRefresh={() => screen.map.reload()}
          />
        </View>

        <View style={styles.locate}>
          <LocateButton loading={locating} active={located} onPress={locateMe} />
          <CompassButton
            active={compassOn}
            onPress={() => {
              void (async () => {
                if (!compassOn) {
                  const ok = await requestCompassPermission();
                  if (!ok) {
                    if (Platform.OS === "web") window.alert("Activa el permiso de brújula para girar el mapa.");
                    else Alert.alert("Brújula", "Activa el permiso de brújula para girar el mapa.");
                    return;
                  }
                }
                live.current?.sendCmd("compass");
                setCompassOn((value) => !value);
              })();
            }}
          />
        </View>

        <View style={[styles.bottom, { bottom: bottomPad }]}>
          <OperadoresRail
            operators={screen.filtered}
            selectedId={screen.map.selectedId}
            onSelect={screen.selectOperator}
            onOpenDetail={(op) => void screen.openDetail(op)}
          />
        </View>
      </View>

      <OperatorDetailSheet
        open={Boolean(screen.detail)}
        loading={screen.detailLoading}
        detail={screen.detail}
        isAdmin={screen.isAdmin}
        timeAgo={screen.timeAgo}
        onClose={screen.closeDetail}
        onShare={(route) => void screen.shareRoute(route)}
        onCall={(phone) => void screen.callPhone(phone)}
        onNavigate={screen.focusRoute}
      />

      {screen.canAssignCaja ? (
        <CajaDiariaSheet
          open={screen.cajaOpen}
          operators={screen.map.data.catalog}
          onClose={() => screen.setCajaOpen(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.accentDeep,
  },
  stage: {
    flex: 1,
  },
  left: {
    position: "absolute",
    top: 12,
    left: 10,
    zIndex: 3,
  },
  locate: {
    position: "absolute",
    top: 12,
    right: 10,
    zIndex: 3,
    gap: 8,
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 3,
  },
});
