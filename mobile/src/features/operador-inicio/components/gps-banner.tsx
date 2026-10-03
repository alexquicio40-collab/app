import { DashIcon } from "@/features/operador-inicio/components/dash-icon";
import { dash } from "@/features/operador-inicio/palette";
import { Pressable, StyleSheet, Text, View } from "react-native";

type GpsBannerProps = {
  activo: boolean;
  titulo: string;
  detalle: string;
  onMapa: () => void;
};

export function GpsBanner({ activo, titulo, detalle, onMapa }: GpsBannerProps) {
  return (
    <View style={[styles.banner, activo ? null : styles.off]}>
      <DashIcon name="pin" color={activo ? "#C2410C" : dash.muted} size={16} />
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {titulo}
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {detalle}
        </Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Ver mapa" onPress={onMapa} style={styles.button}>
        <Text style={styles.buttonText}>VER MAPA</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: dash.gold,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dash.goldLine,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 44,
  },
  off: {
    backgroundColor: "#F4F1E8",
    borderColor: "#E6E0D2",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 0,
  },
  title: {
    color: dash.goldInk,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800",
  },
  detail: {
    color: "#8C7340",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: dash.goldLine,
  },
  buttonText: {
    color: dash.goldInk,
    fontSize: 10,
    fontWeight: "800",
  },
});
