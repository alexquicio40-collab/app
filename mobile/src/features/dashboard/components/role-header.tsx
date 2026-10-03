import { rolLabel } from "@/features/operador-inicio/lib/format";
import { dash } from "@/features/operador-inicio/palette";
import { useAuth } from "@/providers/auth-provider";
import { BrandLogo } from "@/ui/brand-logo";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type RoleHeaderProps = {
  right?: ReactNode;
};

export function RoleHeader({ right }: RoleHeaderProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const nombre = user?.name?.trim() || rolLabel(user?.rol);

  return (
    <LinearGradient
      colors={["#0B7A40", "#14964C"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 6 }]}
    >
      <BrandLogo height={38} plated />
      <View style={styles.side}>
        <View style={styles.who}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{iniciales(nombre)}</Text>
          </View>
          <View style={styles.whoText}>
            <Text style={styles.whoName} numberOfLines={1}>
              {nombre}
            </Text>
            <Text style={styles.whoRole}>{rolLabel(user?.rol)}</Text>
          </View>
        </View>
        {right}
      </View>
    </LinearGradient>
  );
}

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return `${partes[0].charAt(0)}${partes[1].charAt(0)}`.toUpperCase();
  return (partes[0] ?? "A").slice(0, 2).toUpperCase();
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  side: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  who: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: dash.greenDeep, fontSize: 11, fontWeight: "800" },
  whoText: { flexShrink: 1 },
  whoName: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  whoRole: { color: "rgba(255,255,255,0.78)", fontSize: 10, fontWeight: "600" },
});
