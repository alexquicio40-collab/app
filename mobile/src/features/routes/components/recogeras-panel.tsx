import type { RouteItem } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

type RecogerasPanelProps = {
  route: Pick<
    RouteItem,
    | "tipoEnvase"
    | "cantidadEnvases"
    | "cantidadBidonesAzules"
    | "cantidadBidonesBlancos"
    | "bidonPasadoPor"
  >;
  compact?: boolean;
};

export function hasRecogeraInfo(route: RecogerasPanelProps["route"]) {
  return Boolean(
    route.tipoEnvase ||
      (route.cantidadEnvases ?? 0) > 0 ||
      (route.cantidadBidonesAzules ?? 0) > 0 ||
      (route.cantidadBidonesBlancos ?? 0) > 0 ||
      (route.bidonPasadoPor ?? 0) > 0,
  );
}

/** Panel "Recogerás:" — envases/bidones del local (paridad Flutter). */
export function RecogerasPanel({ route, compact = false }: RecogerasPanelProps) {
  const chips: { label: string; value: string; tone: ChipTone }[] = [];

  if (route.tipoEnvase) {
    chips.push({ label: "Tipo", value: route.tipoEnvase, tone: "muted" });
  }
  if ((route.cantidadEnvases ?? 0) > 0) {
    chips.push({ label: "Envases", value: String(route.cantidadEnvases), tone: "info" });
  }
  if ((route.cantidadBidonesAzules ?? 0) > 0) {
    chips.push({ label: "Azules", value: String(route.cantidadBidonesAzules), tone: "accent" });
  }
  if ((route.cantidadBidonesBlancos ?? 0) > 0) {
    chips.push({ label: "Blancos", value: String(route.cantidadBidonesBlancos), tone: "muted" });
  }
  if ((route.bidonPasadoPor ?? 0) > 0) {
    chips.push({
      label: "Bidón personalizado de",
      value: String(route.bidonPasadoPor),
      tone: "gold",
    });
  }

  return (
    <View style={[styles.wrap, compact ? styles.wrapCompact : null]}>
      <Text style={styles.title}>Recogerás</Text>
      {chips.length ? (
        <View style={styles.chips}>
          {chips.map((chip) => (
            <Chip key={`${chip.label}-${chip.value}`} {...chip} />
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>Este local no tiene envases/bidones configurados.</Text>
      )}
    </View>
  );
}

type ChipTone = "muted" | "info" | "accent" | "gold";

function Chip({ label, value, tone }: { label: string; value: string; tone: ChipTone }) {
  const colors =
    tone === "info"
      ? { fg: theme.colors.info, bg: theme.colors.infoSoft, border: "#B9CFE3" }
      : tone === "accent"
        ? { fg: theme.colors.accent, bg: theme.colors.accentSoft, border: "#B7D4C8" }
        : tone === "gold"
          ? { fg: theme.colors.gold, bg: theme.colors.goldSoft, border: "#E0C98A" }
          : { fg: theme.colors.muted, bg: theme.colors.cream, border: theme.colors.line };

  return (
    <View style={[styles.chip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.chipLabel, { color: colors.fg }]}>{label}</Text>
      <Text style={[styles.chipValue, { color: colors.fg }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#B7D4C8",
    backgroundColor: theme.colors.accentSoft,
  },
  wrapCompact: { padding: 10 },
  title: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "900",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
  },
  chipLabel: { fontSize: 11, fontWeight: "600" },
  chipValue: { fontSize: 13, fontWeight: "900" },
  empty: { color: theme.colors.muted, fontSize: 11, fontWeight: "600", lineHeight: 15 },
});
