import { withResolvedMedia } from "@/features/routes/api";
import { PagarasPanel } from "@/features/routes/components/pagaras-panel";
import { PreciosPanel } from "@/features/routes/components/precios-panel";
import { RecogerasPanel } from "@/features/routes/components/recogeras-panel";
import { StatusBadge } from "@/features/routes/components/status-badge";
import {
  canArriveRoute,
  canFinalizeRoute,
  canReprogramRoute,
  canSkipCollection,
  canStartRoute,
} from "@/features/routes/lib/permissions";
import { estadoLabel, formatDate, formatDateTime } from "@/features/routes/lib/format";
import type { RouteItem } from "@/features/routes/types";
import { theme } from "@/lib/theme";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { type ReactNode, useMemo, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type RouteDetailSheetProps = {
  route: RouteItem | null;
  onClose: () => void;
  onStart?: () => void;
  onArrive?: () => void;
  onFinalize?: () => void;
  onSkip?: () => void;
  onReprogram?: () => void;
  onSuggestRoutes?: () => void;
};

export function RouteDetailSheet({
  route: rawRoute,
  onClose,
  onStart,
  onArrive,
  onFinalize,
  onSkip,
  onReprogram,
  onSuggestRoutes,
}: RouteDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = useContentBottomPad(8);
  const [preview, setPreview] = useState<string | null>(null);
  const route = useMemo(() => (rawRoute ? withResolvedMedia(rawRoute) : null), [rawRoute]);

  if (!route) return null;

  const canNavigate = route.localLatitud != null && route.localLongitud != null;
  const showStart = canStartRoute(route) && Boolean(onStart);
  const showArrive = canArriveRoute(route) && Boolean(onArrive);
  const showFinalize = canFinalizeRoute(route) && Boolean(onFinalize);
  const showSkip = canSkipCollection(route) && Boolean(onSkip);
  const showReprogram = canReprogramRoute(route) && Boolean(onReprogram);
  const showSuggest = canNavigate && Boolean(onSuggestRoutes);
  const sheetBottom =
    Platform.OS === "android"
      ? Math.max(insets.bottom, 24) + 12
      : Math.max(insets.bottom, 16);

  const callEncargado = () => {
    const phone = route.encargadoTelefono.replace(/\s+/g, "");
    if (!phone) return;
    void Linking.openURL(`tel:${phone}`);
  };

  return (
    <>
      <Modal visible transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <Pressable style={styles.dismiss} onPress={onClose} />
          <View style={[styles.sheet, { paddingBottom: sheetBottom }]}>
            <View style={styles.handle} />

            <View style={styles.head}>
              <View style={styles.headCopy}>
                <Text style={styles.kicker}>Ruta #{route.id}</Text>
                <Text style={styles.title} numberOfLines={2}>
                  {route.localNombre}
                </Text>
                <StatusBadge estado={route.estado} />
              </View>
              <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}>
                <Text style={styles.closeText}>Cerrar</Text>
              </Pressable>
            </View>

            <View style={styles.actions}>
              {showStart ? <Action label="En ruta" onPress={onStart!} primary /> : null}
              {showArrive ? <Action label="Llegué" onPress={onArrive!} primary /> : null}
              {showFinalize ? <Action label="Recolectar" onPress={onFinalize!} primary /> : null}
              {showSkip ? <Action label="No recolectado" onPress={onSkip!} /> : null}
              {showReprogram ? <Action label="Reprogramar" onPress={onReprogram!} primary /> : null}
              {showSuggest ? (
                <Action
                  label="Navegar en mapa"
                  onPress={onSuggestRoutes!}
                  primary={!showStart && !showArrive && !showFinalize && !showReprogram}
                />
              ) : null}
              <Action
                label="Llamar"
                onPress={callEncargado}
                disabled={!route.encargadoTelefono}
              />
            </View>

            <ScrollView
              contentContainerStyle={[styles.body, { paddingBottom: bottomPad }]}
              showsVerticalScrollIndicator={false}
            >
              <RecogerasPanel route={route} />
              <PreciosPanel precios={route} />
              <PagarasPanel metodos={route.metodosPago} />

              <Section title="Información">
                <Pair left="Operador" leftValue={route.conductorNombre} right="Fecha" rightValue={formatDate(route.fechaAsignacion)} />
                <Pair
                  left="Asignó"
                  leftValue={route.creadoPorNombre || "—"}
                  right="Editó"
                  rightValue={route.editadoPorNombre || "—"}
                />
                <Pair left="Estado" leftValue={estadoLabel(route.estado)} right="Orden" rightValue={route.orden != null ? String(route.orden) : "—"} />
                {route.fechaCompletada ? (
                  <Field label="Completada" value={formatDateTime(route.fechaCompletada)} />
                ) : null}
              </Section>

              <Section title="Local">
                <Field label="Dirección" value={route.localDireccion || "—"} />
                <Pair
                  left="Encargado"
                  leftValue={route.encargadoNombre || "—"}
                  right="Teléfono"
                  rightValue={route.encargadoTelefono || "—"}
                />
              </Section>

              {(route.litraje || route.baldesVacios || route.galonerasVacias) ? (
                <Section title="Entrega">
                  <Pair
                    left="Litraje"
                    leftValue={route.litraje != null ? `${route.litraje} L` : "—"}
                    right="Baldes"
                    rightValue={route.baldesVacios != null ? String(route.baldesVacios) : "—"}
                  />
                  <Field
                    label="Galoneras"
                    value={route.galonerasVacias != null ? String(route.galonerasVacias) : "—"}
                  />
                </Section>
              ) : null}

              {(route.fotoGuia || route.fotoMercaderia || route.fotoPago) ? (
                <Section title="Evidencias">
                  <View style={styles.photos}>
                    {route.fotoGuia ? (
                      <PhotoThumb uri={route.fotoGuia} label="Guía" onPress={() => setPreview(route.fotoGuia)} />
                    ) : null}
                    {route.fotoMercaderia ? (
                      <PhotoThumb
                        uri={route.fotoMercaderia}
                        label="Mercadería"
                        onPress={() => setPreview(route.fotoMercaderia)}
                      />
                    ) : null}
                    {route.fotoPago ? (
                      <PhotoThumb
                        uri={route.fotoPago}
                        label="Pago"
                        onPress={() => setPreview(route.fotoPago)}
                      />
                    ) : null}
                  </View>
                </Section>
              ) : null}

              {route.observaciones ? (
                <Section title="Observaciones">
                  <Text style={styles.note}>{route.observaciones}</Text>
                </Section>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(preview)} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.preview} onPress={() => setPreview(null)}>
          {preview ? <Image source={{ uri: preview }} style={styles.previewImg} resizeMode="contain" /> : null}
        </Pressable>
      </Modal>
    </>
  );
}

function Action({
  label,
  onPress,
  primary,
  disabled,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.action,
        primary ? styles.actionPrimary : null,
        disabled ? styles.actionDisabled : null,
      ]}
    >
      <Text style={[styles.actionText, primary ? styles.actionTextPrimary : null]}>{label}</Text>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function Pair({
  left,
  leftValue,
  right,
  rightValue,
}: {
  left: string;
  leftValue: string;
  right: string;
  rightValue: string;
}) {
  return (
    <View style={styles.pair}>
      <Field label={left} value={leftValue} />
      <Field label={right} value={rightValue} />
    </View>
  );
}

function PhotoThumb({
  uri,
  label,
  onPress,
}: {
  uri: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.photo}>
      <Image source={{ uri }} style={styles.photoImg} />
      <Text style={styles.photoLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.5)",
    justifyContent: "flex-end",
  },
  dismiss: {
    flex: 1,
  },
  sheet: {
    maxHeight: "88%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
    marginTop: 10,
    marginBottom: 4,
  },
  head: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: theme.colors.cream,
  },
  headCopy: {
    flex: 1,
    gap: 6,
  },
  kicker: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  close: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  closeText: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  action: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  actionPrimary: {
    backgroundColor: theme.colors.accent,
  },
  actionDisabled: {
    opacity: 0.4,
  },
  actionText: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  actionTextPrimary: {
    color: "#FFFFFF",
  },
  body: {
    paddingHorizontal: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionBody: {
    gap: 8,
  },
  pair: {
    flexDirection: "row",
    gap: 8,
  },
  field: {
    flex: 1,
    backgroundColor: theme.colors.cream,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  fieldLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  fieldValue: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  note: {
    color: theme.colors.ink,
    fontSize: 13,
    lineHeight: 19,
    backgroundColor: theme.colors.cream,
    borderRadius: 12,
    padding: 12,
  },
  photos: {
    flexDirection: "row",
    gap: 10,
  },
  photo: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: theme.colors.cream,
  },
  photoImg: {
    width: "100%",
    height: 120,
  },
  photoLabel: {
    padding: 8,
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  preview: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  previewImg: {
    width: "100%",
    height: "80%",
  },
});
