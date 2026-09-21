import { todayLabel } from "@/features/dashboard/lib/week";
import type { DashboardSummary } from "@/features/dashboard/types";
import { theme } from "@/lib/theme";
import { useAuth } from "@/providers/auth-provider";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function DashHeader({ kpis }: { kpis: DashboardSummary["kpis"] }) {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const initial = (user?.name ?? "U").slice(0, 1).toUpperCase();

  return (
    <LinearGradient
      colors={["#041C16", "#083D30", "#0C5C49"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.orbA} />
      <View style={styles.orbB} />
      <View style={styles.orbC} />

      <View style={styles.top}>
        <View style={styles.brandWrap}>
          <Text style={styles.brand}>BIOCLIM</Text>
          <Text style={styles.slogan}>NO LO TIRES, TRANSFÓRMALO</Text>
          <Text style={styles.date}>{todayLabel()}</Text>
        </View>
        <Pressable onPress={signOut} style={styles.out}>
          <Text style={styles.outText}>Salir</Text>
        </Pressable>
      </View>

      <View style={styles.userRow}>
        <View style={styles.avatarRing}>
          <Text style={styles.initial}>{initial}</Text>
        </View>
        <View style={styles.userText}>
          <Text style={styles.hello} numberOfLines={1}>
            Hola, {user?.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {(user?.rol ?? "operador").replace(/^./, (c) => c.toUpperCase())} · @{user?.username}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat value={kpis.enLinea} label="En vivo" />
        <View style={styles.statLine} />
        <Stat value={kpis.rutasHoy} label="Rutas hoy" />
        <View style={styles.statLine} />
        <Stat value={kpis.locales} label="Locales" />
      </View>
    </LinearGradient>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 18,
    paddingBottom: 36,
    overflow: "hidden",
  },
  orbA: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(201,162,39,0.14)",
    top: -70,
    right: -40,
  },
  orbB: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: 40,
    left: -50,
  },
  orbC: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.35)",
    bottom: 24,
    right: 28,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandWrap: {
    flex: 1,
    paddingRight: 12,
  },
  brand: {
    color: theme.colors.gold,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
  slogan: {
    color: "#E7F4EE",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
    letterSpacing: 0.3,
  },
  date: {
    color: "#B7D4C8",
    fontSize: 12,
    marginTop: 4,
    textTransform: "capitalize",
  },
  out: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  outText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
  },
  avatarRing: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: theme.colors.gold,
    backgroundColor: "#0B5340",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  userText: {
    flex: 1,
  },
  hello: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  meta: {
    color: "#B7D4C8",
    fontSize: 13,
    marginTop: 3,
  },
  stats: {
    marginTop: 20,
    flexDirection: "row",
    backgroundColor: "rgba(4,20,16,0.28)",
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  statLabel: {
    color: "#C9E8DC",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  statLine: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 4,
  },
});
