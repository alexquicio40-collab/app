import { ModuleGrid } from "@/features/dashboard/components/module-grid";
import { modulesForRole } from "@/features/dashboard/modules";
import { theme } from "@/lib/theme";
import { useAuth } from "@/providers/auth-provider";
import { ScreenHeader } from "@/ui/screen-header";
import { ScrollView, StyleSheet, View } from "react-native";

export default function ModulosScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Módulos" subtitle="Accesos según tu rol" />
      <ScrollView contentContainerStyle={styles.content}>
        <ModuleGrid modules={modulesForRole(user?.rol)} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    padding: 14,
    paddingBottom: 108,
  },
});
