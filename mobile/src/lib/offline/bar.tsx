import { listJobs, subscribeJobs } from "@/lib/offline/queue";
import { flushOfflineJobs } from "@/lib/offline/sync";
import { theme } from "@/lib/theme";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function OfflineBar() {
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      void listJobs().then((items) => {
        if (alive) setCount(items.length);
      });
    };
    refresh();
    const unsub = subscribeJobs(refresh);
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  if (count === 0) return null;

  return (
    <View style={styles.bar}>
      <View style={styles.copy}>
        <Text style={styles.title}>
          {count} {count === 1 ? "cambio" : "cambios"} sin enviar
        </Text>
        <Text style={styles.detail}>Se envían solos al volver internet</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => {
          setBusy(true);
          void flushOfflineJobs().finally(() => setBusy(false));
        }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{busy ? "…" : "Enviar"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#F3D2A2",
  },
  copy: { flex: 1, gap: 1 },
  title: { color: "#9A3412", fontSize: 13, fontWeight: "700" },
  detail: { color: "#C2410C", fontSize: 11, fontWeight: "500" },
  button: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonText: { color: theme.colors.accent, fontSize: 13, fontWeight: "700" },
});
