import { formatIngresoShort } from "@/features/planta/lib/format";
import type { PlantaRegistro } from "@/features/planta/types";
import { theme } from "@/lib/theme";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type PlantaCardProps = {
  item: PlantaRegistro;
  canManage: boolean;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function PlantaCard({ item, canManage, onOpen, onEdit, onDelete }: PlantaCardProps) {
  const photoCount = [item.fotoMercaderia, item.fotoGuiaRetiro].filter(Boolean).length;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Pressable
          onPress={onOpen}
          style={({ pressed }) => [styles.headMain, pressed ? styles.pressed : null]}
        >
          <View style={styles.idPill}>
            <Text style={styles.idText}>#{item.id}</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {item.nombreProveedor}
          </Text>
        </Pressable>

        <View style={styles.trail}>
          {photoCount > 0 ? (
            <View style={styles.photoBadge}>
              <Text style={styles.photoBadgeText}>
                {photoCount} foto{photoCount === 1 ? "" : "s"}
              </Text>
            </View>
          ) : null}
          {canManage && onEdit ? (
            <HeadAction label="Editar" tone="accent" onPress={onEdit}>
              <Text style={[styles.actionGlyph, { color: theme.colors.accent }]}>✎</Text>
            </HeadAction>
          ) : null}
          {canManage && onDelete ? (
            <HeadAction label="Eliminar" tone="danger" onPress={onDelete}>
              <TrashGlyph />
            </HeadAction>
          ) : null}
        </View>
      </View>

      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.body, pressed ? styles.pressed : null]}
      >
        <Text style={styles.meta} numberOfLines={1}>
          {[item.asesorComercial || null, formatIngresoShort(item.ingresoMercaderia)]
            .filter(Boolean)
            .join(" · ")}
        </Text>

        {item.guiaRetiro ? (
          <Text style={styles.guia} numberOfLines={1}>
            Guía {item.guiaRetiro}
          </Text>
        ) : null}

        <View style={styles.chips}>
          <Chip label="Litros" value={item.cantidadLitraje} tone="accent" />
          <Chip label="Baldes" value={item.cantidadBaldesVacios} tone="info" />
          <Chip label="Galoneras" value={item.cantidadGalonerasVacias} tone="gold" />
        </View>
      </Pressable>
    </View>
  );
}

function HeadAction({
  label,
  tone,
  onPress,
  children,
}: {
  label: string;
  tone: "accent" | "danger";
  onPress: () => void;
  children: ReactNode;
}) {
  const colors =
    tone === "accent"
      ? { bg: theme.colors.accentSoft, border: "#B7D4C8" }
      : { bg: theme.colors.dangerSoft, border: "#E8B4B0" };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.actionBtn,
        { backgroundColor: colors.bg, borderColor: colors.border },
        pressed ? styles.actionPressed : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

function TrashGlyph() {
  const color = theme.colors.danger;
  return (
    <View style={styles.trash}>
      <View style={[styles.trashHandle, { borderColor: color }]} />
      <View style={[styles.trashLid, { backgroundColor: color }]} />
      <View style={[styles.trashBody, { borderColor: color }]}>
        <View style={[styles.trashLine, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function Chip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "accent" | "info" | "gold";
}) {
  const colors =
    tone === "accent"
      ? { fg: theme.colors.accent, bg: theme.colors.accentSoft, border: "#B7D4C8" }
      : tone === "info"
        ? { fg: theme.colors.info, bg: theme.colors.infoSoft, border: "#B9CFE3" }
        : { fg: theme.colors.gold, bg: theme.colors.goldSoft, border: "#E0C98A" };

  return (
    <View style={[styles.chip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.chipValue, { color: colors.fg }]}>{value}</Text>
      <Text style={[styles.chipLabel, { color: colors.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  body: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 2,
    gap: 6,
  },
  pressed: { opacity: 0.88 },
  idPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: theme.colors.cream,
  },
  idText: { color: theme.colors.muted, fontSize: 10, fontWeight: "800" },
  title: { flex: 1, color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  trail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
  },
  photoBadge: {
    height: 26,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: theme.colors.goldSoft,
    borderWidth: 1,
    borderColor: "#E0C98A",
    alignItems: "center",
    justifyContent: "center",
  },
  photoBadgeText: { color: theme.colors.gold, fontSize: 10, fontWeight: "800" },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionPressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
  actionGlyph: { fontSize: 12, fontWeight: "700", lineHeight: 14 },
  trash: {
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  trashHandle: {
    width: 4,
    height: 2,
    borderWidth: 1.1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginBottom: 0.5,
  },
  trashLid: {
    width: 9,
    height: 1.2,
    borderRadius: 1,
    marginBottom: 1,
  },
  trashBody: {
    width: 7,
    height: 6,
    borderWidth: 1.1,
    borderRadius: 1.5,
    borderTopWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  trashLine: {
    width: 1.1,
    height: 3.5,
    borderRadius: 1,
  },
  meta: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  guia: { color: theme.colors.ink, fontSize: 12, fontWeight: "700" },
  chips: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 6,
    marginTop: 2,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
    minWidth: 0,
  },
  chipValue: { fontSize: 13, fontWeight: "900" },
  chipLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
});
