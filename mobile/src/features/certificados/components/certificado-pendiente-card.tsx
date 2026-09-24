import { formatRutaVinculada } from "@/features/certificados/lib/format";
import type { CertificadoPendiente } from "@/features/certificados/types";
import { theme } from "@/lib/theme";
import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type CertificadoPendienteCardProps = {
  item: CertificadoPendiente;
  canUpload: boolean;
  onOpenDetail: () => void;
  onUpload: () => void;
};

const DOUBLE_MS = 320;

/** Card compacta: nombre, dirección, RUC y última ruta. Doble toque → detalle. */
export function CertificadoPendienteCard({
  item,
  canUpload,
  onOpenDetail,
  onUpload,
}: CertificadoPendienteCardProps) {
  const lastTap = useRef(0);
  const ruta = formatRutaVinculada(item.ultimaRutaId, item.ultimaRutaCompletada);

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_MS) {
      lastTap.current = 0;
      onOpenDetail();
      return;
    }
    lastTap.current = now;
  };

  return (
    <View style={styles.card}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.main, pressed ? styles.pressed : null]}
        accessibilityHint="Doble toque para ver detalles"
      >
        <Text style={styles.title} numberOfLines={2}>
          {item.nombre}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {item.direccion.trim() || "Sin dirección"}
        </Text>
        <Text style={styles.ruc} numberOfLines={1}>
          {item.ruc.trim() ? `RUC ${item.ruc.trim()}` : "Sin RUC"}
        </Text>
        <Text style={[styles.ruta, !ruta ? styles.rutaEmpty : null]} numberOfLines={1}>
          {ruta ?? "Sin ruta vinculada"}
        </Text>
      </Pressable>

      {canUpload ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Generar certificado"
          onPress={onUpload}
          hitSlop={4}
          style={({ pressed }) => [styles.uploadBtn, pressed ? styles.uploadPressed : null]}
        >
          <UploadGlyph color={theme.colors.accent} />
        </Pressable>
      ) : null}
    </View>
  );
}

function UploadGlyph({ color }: { color: string }) {
  return (
    <View style={styles.uploadIcon}>
      <View style={[styles.uploadArrowStem, { backgroundColor: color }]} />
      <View style={[styles.uploadArrowHead, { borderBottomColor: color }]} />
      <View style={[styles.uploadTray, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  main: { flex: 1, minWidth: 0, gap: 4 },
  pressed: { opacity: 0.88 },
  title: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  meta: { color: theme.colors.muted, fontSize: 12, fontWeight: "600", lineHeight: 17 },
  ruc: { color: theme.colors.info, fontSize: 12, fontWeight: "800", marginTop: 2 },
  ruta: { color: theme.colors.accent, fontSize: 11, fontWeight: "700", marginTop: 2 },
  rutaEmpty: { color: theme.colors.muted, fontWeight: "600" },
  uploadBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#B7D4C8",
    backgroundColor: theme.colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  uploadPressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
  uploadIcon: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  uploadArrowStem: {
    position: "absolute",
    top: 2,
    width: 1.8,
    height: 7,
    borderRadius: 1,
  },
  uploadArrowHead: {
    position: "absolute",
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 4.5,
    borderRightWidth: 4.5,
    borderBottomWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  uploadTray: {
    width: 12,
    height: 6,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});
