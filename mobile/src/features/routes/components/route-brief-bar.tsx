import { hasRecogeraInfo } from "@/features/routes/components/recogeras-panel";
import type { RouteItem } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type RouteBriefBarProps = {
  route: RouteItem;
};

type Chip = { key: string; label: string; value: string; tone: "recoge" | "pago" };

function buildChips(route: RouteItem): Chip[] {
  const chips: Chip[] = [];

  if (route.tipoEnvase) {
    chips.push({ key: "tipo", label: "Tipo", value: route.tipoEnvase, tone: "recoge" });
  }
  if ((route.cantidadEnvases ?? 0) > 0) {
    chips.push({
      key: "env",
      label: "Envases",
      value: String(route.cantidadEnvases),
      tone: "recoge",
    });
  }
  if ((route.cantidadBidonesAzules ?? 0) > 0) {
    chips.push({
      key: "az",
      label: "Azules",
      value: String(route.cantidadBidonesAzules),
      tone: "recoge",
    });
  }
  if ((route.cantidadBidonesBlancos ?? 0) > 0) {
    chips.push({
      key: "bl",
      label: "Blancos",
      value: String(route.cantidadBidonesBlancos),
      tone: "recoge",
    });
  }
  if ((route.bidonPasadoPor ?? 0) > 0) {
    chips.push({
      key: "pers",
      label: "Bidón",
      value: String(route.bidonPasadoPor),
      tone: "recoge",
    });
  }

  for (const metodo of route.metodosPago) {
    chips.push({
      key: `pago-${metodo.id}-${metodo.nombre}`,
      label: "Pagarás",
      value: metodo.nombre,
      tone: "pago",
    });
  }

  return chips;
}

/**
 * Una sola franja horizontal: Recogerás + Pagarás (optimiza espacio en mapa).
 */
export function RouteBriefBar({ route }: RouteBriefBarProps) {
  const chips = buildChips(route);
  const hasRecoge = hasRecogeraInfo(route);
  const hasPago = route.metodosPago.length > 0;

  return (
    <View style={styles.bar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <Text style={styles.kickerRecoge}>Recogerás</Text>
        {hasRecoge ? (
          chips
            .filter((c) => c.tone === "recoge")
            .map((chip) => (
              <MiniChip
                key={chip.key}
                label={chip.label}
                value={chip.value}
                tone={chip.tone}
              />
            ))
        ) : (
          <Text style={styles.empty}>Sin envases</Text>
        )}

        {hasPago ? (
          <>
            <View style={styles.sep} />
            <Text style={styles.kickerPago}>Pagarás</Text>
            {chips
              .filter((c) => c.tone === "pago")
              .map((chip) => (
                <MiniChip key={chip.key} label="" value={chip.value} tone="pago" />
              ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

/** Alias usado en mapa de campo. */
export const RouteBriefBanner = RouteBriefBar;

function MiniChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "recoge" | "pago";
}) {
  const pago = tone === "pago";
  return (
    <View style={[styles.chip, pago ? styles.chipPago : styles.chipRecoge]}>
      {label ? (
        <Text style={[styles.chipLabel, pago ? styles.chipLabelPago : null]}>{label}</Text>
      ) : null}
      <Text style={[styles.chipValue, pago ? styles.chipValuePago : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(183,212,200,0.95)",
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    minHeight: 28,
  },
  kickerRecoge: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginRight: 2,
  },
  kickerPago: {
    color: "#1B5E20",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginRight: 2,
  },
  sep: {
    width: 1,
    height: 18,
    backgroundColor: theme.colors.line,
    marginHorizontal: 4,
  },
  empty: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipRecoge: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: "#B7D4C8",
  },
  chipPago: {
    backgroundColor: "#EAF5EC",
    borderColor: "#A5D6A7",
  },
  chipLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  chipLabelPago: { color: "#2E7D32" },
  chipValue: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "900",
  },
  chipValuePago: { color: "#1B5E20" },
});
