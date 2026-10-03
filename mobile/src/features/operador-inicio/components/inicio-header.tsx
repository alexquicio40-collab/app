import { DashIcon } from "@/features/operador-inicio/components/dash-icon";
import { rolLabel } from "@/features/operador-inicio/lib/format";
import { dash } from "@/features/operador-inicio/palette";
import { useAuth } from "@/providers/auth-provider";
import { BrandLogo } from "@/ui/brand-logo";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type InicioHeaderProps = {
  avisos: number;
  onAvisos: () => void;
};

export function InicioHeader({ avisos, onAvisos }: InicioHeaderProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const nombre = user?.name?.trim() || "Operador";

  return (
    <LinearGradient
      colors={["#0E7A40", "#14964C"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.bar, { paddingTop: insets.top + 10 }]}
    >
      <View style={styles.brand}>
        <BrandLogo height={34} plated />
        <Text style={styles.slogan}>GESTIÓN DE ACEITE USADO</Text>
      </View>

      <View style={styles.side}>
        <View style={styles.who}>
          <View style={styles.avatar}>
            <DashIcon name="person" color={dash.greenDeep} size={20} />
          </View>
          <View style={styles.whoText}>
            <Text style={styles.name} numberOfLines={1}>
              {nombre}
            </Text>
            <Text style={styles.role}>{rolLabel(user?.rol)}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={avisos > 0 ? `${avisos} locales pendientes` : "Avisos de la ruta"}
          onPress={onAvisos}
          style={styles.bell}
        >
          <DashIcon name="bell" color="#FFFFFF" size={22} />
          {avisos > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{avisos > 9 ? "9+" : String(avisos)}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brand: {
    flexShrink: 1,
    alignItems: "flex-start",
    gap: 4,
  },
  slogan: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  side: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  who: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  whoText: {
    flexShrink: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    maxWidth: 118,
  },
  role: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "600",
  },
  bell: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: "#E23B32",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
});
