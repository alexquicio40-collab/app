import { canSeeMapaCampo, canSeeOperadores } from "@/lib/role-nav";
import { theme } from "@/lib/theme";
import { useAuth } from "@/providers/auth-provider";
import { GridIcon, HomeIcon, MapIcon, PeopleIcon, RouteIcon } from "@/ui/nav-icons";
import { FLOATING_TAB_HEIGHT } from "@/ui/use-content-bottom-pad";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: { navigate: (name: string) => void };
};

const ICONS = {
  index: HomeIcon,
  mapa: MapIcon,
  operadores: PeopleIcon,
  rutas: RouteIcon,
  modulos: GridIcon,
} as const;

export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const { user } = useAuth();
  const rol = user?.rol;
  const insets = useSafeAreaInsets();
  const systemBottom =
    Platform.OS === "android" ? Math.max(insets.bottom, 16) : Math.max(insets.bottom, 0);

  return (
    <View style={[styles.wrap, { bottom: Math.max(systemBottom, 8) }]}>
      <View style={[styles.bar, { minHeight: FLOATING_TAB_HEIGHT - 16 }]}>
        {state.routes.map((route, index) => {
          if (route.name === "operadores" && !canSeeOperadores(rol)) return null;
          if (route.name === "mapa" && !canSeeMapaCampo(rol)) return null;

          const focused = state.index === index;
          const options = descriptors[route.key]?.options;
          const label = String(options?.title ?? route.name);
          const Icon = ICONS[route.name as keyof typeof ICONS];
          if (!Icon) return null;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              onPress={() => navigation.navigate(route.name)}
              style={styles.item}
            >
              <View style={[styles.iconWrap, focused ? styles.iconOn : null]}>
                <Icon active={focused} />
              </View>
              <Text style={[styles.label, focused ? styles.labelOn : null]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 20,
  },
  bar: {
    flexDirection: "row",
    backgroundColor: theme.colors.accentDeep,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#0F4A3A",
    shadowColor: "#083D30",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  iconWrap: {
    width: 34,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  iconOn: {
    backgroundColor: "rgba(201,162,39,0.22)",
  },
  label: {
    fontSize: 10,
    color: "#8AA89C",
    fontWeight: "600",
  },
  labelOn: {
    color: "#F3E6B8",
  },
});
