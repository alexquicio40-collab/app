import { statusTargetsFor } from "@/features/routes/lib/permissions";
import { estadoLabel } from "@/features/routes/lib/format";
import type { RouteItem } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type RouteStatusSheetProps = {
  route: RouteItem | null;
  saving?: boolean;
  onClose: () => void;
  onSelect: (estado: string) => Promise<void>;
};

export function RouteStatusSheet({
  route,
  saving = false,
  onClose,
  onSelect,
}: RouteStatusSheetProps) {
  const insets = useSafeAreaInsets();
  if (!route) return null;

  const options = statusTargetsFor(route);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <Text style={styles.kicker}>Cambiar estado</Text>
          <Text style={styles.title} numberOfLines={1}>
            {route.localNombre}
          </Text>
          <Text style={styles.meta}>Actual: {estadoLabel(route.estado)}</Text>

          {saving ? (
            <ActivityIndicator color={theme.colors.accent} style={styles.loader} />
          ) : (
            <View style={styles.list}>
              {options.map((item) => (
                <Pressable
                  key={item.value}
                  disabled={saving}
                  onPress={() => void onSelect(item.value)}
                  style={({ pressed }) => [styles.option, pressed ? styles.optionPressed : null]}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  <Text style={styles.optionHint}>↻</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 16,
    gap: 6,
    ...Platform.select({
      web: { maxWidth: 480, width: "100%", alignSelf: "center" },
      default: {},
    }),
  },
  kicker: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  list: { gap: 6 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
  },
  optionPressed: {
    borderColor: theme.colors.info,
    backgroundColor: theme.colors.infoSoft,
  },
  optionText: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  optionHint: {
    color: theme.colors.info,
    fontSize: 16,
    fontWeight: "700",
  },
  loader: { marginVertical: 20 },
  cancel: {
    marginTop: 4,
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
});
