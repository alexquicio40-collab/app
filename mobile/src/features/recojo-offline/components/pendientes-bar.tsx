import { flushRecojos, listRecojos, subscribeRecojos } from "@/features/recojo-offline/queue";
import { theme } from "@/lib/theme";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

/** Aviso iOS cuando hay recojos guardados sin señal. */
export function RecojosPendientesBar() {
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      void listRecojos().then((items) => {
        if (alive) setCount(items.length);
      });
    };
    refresh();
    const unsub = subscribeRecojos(refresh);
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
          {count} {count === 1 ? "recojo" : "recojos"} sin enviar
        </Text>
        <Text style={styles.detail}>Se sincronizan al volver la señal</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => {
          setBusy(true);
          void flushRecojos().finally(() => setBusy(false));
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FFF7ED",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#F3D2A2",
  },
  copy: { flex: 1, gap: 1 },
  title: { color: "#9A3412", fontSize: 14, fontWeight: "700" },
  detail: { color: "#C2410C", fontSize: 12, fontWeight: "500" },
  button: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonText: { color: theme.colors.accent, fontSize: 13, fontWeight: "700" },
});
