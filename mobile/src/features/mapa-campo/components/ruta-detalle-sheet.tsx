import { shareRouteLink } from "@/features/operadores/api";
import { PagarasPanel } from "@/features/routes/components/pagaras-panel";
import { PreciosPanel } from "@/features/routes/components/precios-panel";
import { RecogerasPanel } from "@/features/routes/components/recogeras-panel";
import type { RouteItem } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Glyph = {
  ios: "play.fill" | "checkmark" | "phone.fill" | "square.and.arrow.up";
  android: "play_arrow" | "check" | "call" | "share";
};

type RutaDetalleSheetProps = {
  route: RouteItem | null;
  onClose: () => void;
  onStart: (route: RouteItem) => void;
  onComplete: (route: RouteItem) => void;
};

export function RutaDetalleSheet({ route, onClose, onStart, onComplete }: RutaDetalleSheetProps) {
  const insets = useSafeAreaInsets();
  const [sharing, setSharing] = useState(false);
  if (!route) return null;

  const phone = (route.encargadoTelefono || route.telefonoAsesor).replace(/[^\d+]/g, "");
  const coords =
    route.localLatitud != null && route.localLongitud != null
      ? `${route.localLatitud.toFixed(5)}, ${route.localLongitud.toFixed(5)}`
      : "";
  const asesor = route.asesorBioClim;

  const call = () => {
    if (!phone) {
      notify("Llamar", "No hay teléfono del encargado ni del asesor.");
      return;
    }
    void Linking.openURL(`tel:${phone}`);
  };

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const url = await shareRouteLink(route.id);
      const message = `Compartir ruta: ${route.localNombre}\nSigue la ubicación en tiempo real.\n${url}`;
      const shared = await openShareSheet(message, url);
      if (!shared) {
        const copied = await copyLink(url);
        notify(
          "Compartir ruta",
          copied ? "Enlace copiado. Ya puedes enviarlo." : `Copia este enlace:\n${url}`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (isShareCancel(message)) return;
      notify("Compartir ruta", message || "No se pudo compartir la ruta");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <Text style={styles.title} numberOfLines={2}>
              {route.localNombre}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>Cerrar</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <Pair
              left={{ label: "Horario", value: route.horarioEntrada }}
              right={{ label: "Dirección", value: route.localDireccion }}
            />
            <Pair
              left={{ label: "Coordenadas", value: coords }}
              right={{ label: "Asesor", value: asesor }}
            />
            <Pair
              left={{ label: "Encargado", value: route.encargadoNombre }}
              right={{ label: "Tel. encargado", value: route.encargadoTelefono }}
            />
            <Pair
              left={{ label: "Tel. asesor", value: route.telefonoAsesor }}
              right={{ label: "Referencia", value: route.referencia }}
            />
            <Pair
              left={{ label: "Asignó", value: route.creadoPorNombre }}
              right={{ label: "Editó", value: route.editadoPorNombre }}
            />
            <Field label="Observaciones" value={route.observaciones} />
            <RecogerasPanel route={route} compact />
            <PreciosPanel precios={route} compact />
            <PagarasPanel metodos={route.metodosPago} compact />
          </ScrollView>

          <View style={styles.actions}>
            <View style={styles.actionRow}>
              <Btn
                label="Comenzar"
                tone="fill"
                glyph={{ ios: "play.fill", android: "play_arrow" }}
                onPress={() => onStart(route)}
              />
              <Btn
                label="Completar"
                tone="ok"
                glyph={{ ios: "checkmark", android: "check" }}
                onPress={() => onComplete(route)}
              />
            </View>
            <View style={styles.actionRow}>
              <Btn label="Llamar" glyph={{ ios: "phone.fill", android: "call" }} onPress={call} />
              <Btn
                label="Compartir ruta"
                glyph={{ ios: "square.and.arrow.up", android: "share" }}
                onPress={() => void share()}
                disabled={sharing}
                busy={sharing}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}: ${message}`);
  else Alert.alert(title, message);
}

function isShareCancel(message: string) {
  return /cancel|dismiss|abort/i.test(message);
}

/** Abre la hoja nativa. Devuelve false si este dispositivo no puede compartir. */
async function openShareSheet(message: string, url: string) {
  try {
    const result = await Share.share({ title: "Compartir ruta", message, url });
    return result.action !== Share.dismissedAction;
  } catch (err) {
    const messageText = err instanceof Error ? err.message : "";
    if (isShareCancel(messageText)) return true;
    if (/not supported/i.test(messageText)) return false;
    throw err;
  }
}

async function copyLink(url: string) {
  try {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

type FieldData = { label: string; value: string };

function plain(value: string) {
  const text = value.trim().replace(/\s+/g, " ");
  return text && text !== "-" ? text : "";
}

function Pair({ left, right }: { left: FieldData; right: FieldData }) {
  if (!plain(left.value) && !plain(right.value)) return null;
  return (
    <View style={styles.pair}>
      <Field {...left} />
      <Field {...right} />
    </View>
  );
}

function Field({ label, value }: FieldData) {
  const text = plain(value);
  if (!text) return <View style={styles.field} />;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{text}</Text>
    </View>
  );
}

function Btn({
  label,
  tone = "line",
  glyph,
  onPress,
  disabled,
  busy,
}: {
  label: string;
  tone?: "fill" | "ok" | "line";
  glyph: Glyph;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const color = tone === "line" ? theme.colors.ink : "#fff";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        tone === "fill" ? styles.btnFill : null,
        tone === "ok" ? styles.btnOk : null,
        tone === "line" ? styles.btnLine : null,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <SymbolView
          name={{ ios: glyph.ios, android: glyph.android, web: glyph.android }}
          tintColor={color}
          size={16}
        />
      )}
      <Text style={[styles.btnText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(8,20,16,0.45)" },
  dismiss: { flex: 1 },
  sheet: {
    maxHeight: "78%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 8,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  title: { flex: 1, color: theme.colors.ink, fontSize: 18, fontWeight: "900" },
  close: { color: theme.colors.accent, fontSize: 13, fontWeight: "800", paddingTop: 2 },
  body: { gap: 8, paddingBottom: 4 },
  pair: { flexDirection: "row", gap: 12 },
  field: { flex: 1, gap: 1, minWidth: 0 },
  label: { color: theme.colors.ink, fontSize: 12, fontWeight: "800" },
  value: { color: theme.colors.ink, fontSize: 13, fontWeight: "400" },
  actions: { gap: 8 },
  actionRow: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnFill: { backgroundColor: theme.colors.accent },
  btnOk: { backgroundColor: "#1B7A43" },
  btnLine: { backgroundColor: theme.colors.cream, borderWidth: 1, borderColor: theme.colors.line },
  btnText: { fontSize: 12, fontWeight: "800" },
});
