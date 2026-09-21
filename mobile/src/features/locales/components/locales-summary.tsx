import type { LocalesCounts } from "@/features/locales/types";
import { theme } from "@/lib/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type CertKpiKey = "necesita" | "no_necesita";

type LocalesSummaryProps = {
  counts: LocalesCounts;
  /** Filtro de certificación activo (`necesita` | `no_necesita` | otros). */
  activeCert: string | null;
  onSelectCert: (value: CertKpiKey | null) => void;
};

/**
 * KPIs clickeables: amarillo = necesita cert · rojo = no necesita.
 * Tap aplica filtro; la × lo quita.
 */
export function LocalesSummary({ counts, activeCert, onSelectCert }: LocalesSummaryProps) {
  const needsOn = activeCert === "necesita";
  const noneOn = activeCert === "no_necesita";

  return (
    <View style={styles.wrap}>
      <View style={[styles.chip, styles.chipIdle]}>
        <Text style={[styles.value, { color: theme.colors.ink }]}>{counts.total}</Text>
        <Text style={[styles.label, { color: theme.colors.ink }]}>Total</Text>
      </View>

      <KpiChip
        label="Necesita cert."
        value={counts.necesitaCert}
        color={theme.colors.gold}
        bg={theme.colors.goldSoft}
        border={theme.colors.gold}
        active={needsOn}
        onPress={() => onSelectCert(needsOn ? null : "necesita")}
        onClear={() => onSelectCert(null)}
      />

      <KpiChip
        label="No necesita"
        value={counts.noNecesitaCert}
        color={theme.colors.danger}
        bg={theme.colors.dangerSoft}
        border={theme.colors.danger}
        active={noneOn}
        onPress={() => onSelectCert(noneOn ? null : "no_necesita")}
        onClear={() => onSelectCert(null)}
      />
    </View>
  );
}

function KpiChip({
  label,
  value,
  color,
  bg,
  border,
  active,
  onPress,
  onClear,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  border: string;
  active: boolean;
  onPress: () => void;
  onClear: () => void;
}) {
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: bg, borderColor: active ? border : "transparent" },
        active ? styles.chipOn : null,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={`${label}: ${value}${active ? ", filtro activo" : ""}`}
        onPress={onPress}
        style={({ pressed }) => [styles.chipHit, pressed ? styles.pressed : null]}
      >
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={[styles.label, { color }]}>{label}</Text>
      </Pressable>

      {active ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Quitar filtro ${label}`}
          onPress={onClear}
          hitSlop={6}
          style={styles.clear}
        >
          <Text style={[styles.clearText, { color }]}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 8,
    paddingBottom: 6,
    paddingTop: 4,
  },
  chip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: "hidden",
    position: "relative",
  },
  chipIdle: {
    backgroundColor: theme.colors.cream,
    borderColor: "transparent",
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 1,
  },
  chipOn: {
    shadowColor: "#0B1F1A",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  chipHit: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    paddingRight: 22,
    alignItems: "center",
    gap: 1,
  },
  pressed: {
    opacity: 0.88,
  },
  value: {
    fontSize: 14,
    fontWeight: "800",
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  clear: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  clearText: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 16,
    marginTop: -1,
  },
});
