import { certLabel, formatEnvaseSummary, mapsDirectionsUrl } from "@/features/locales/lib/format";
import { canSeePrecios, formatPrecios } from "@/features/locales/lib/precios";
import type { LocalItem } from "@/features/locales/types";
import { theme } from "@/lib/theme";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { type ReactNode, useState } from "react";
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

type LocalDetailSheetProps = {
  local: LocalItem | null;
  canManage: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onToggleCert?: () => void;
  onVerGuia?: () => void;
};

export function LocalDetailSheet({
  local,
  canManage,
  onClose,
  onEdit,
  onToggleCert,
  onVerGuia,
}: LocalDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = useContentBottomPad(8);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  if (!local) return null;

  const canNavigate = local.latitud != null && local.longitud != null;
  const sheetBottom =
    Platform.OS === "android"
      ? Math.max(insets.bottom, 24) + 12
      : Math.max(insets.bottom, 16);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: sheetBottom }]}>
          <View style={styles.handle} />

          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={styles.kicker}>Local #{local.id}</Text>
              <Text style={styles.title} numberOfLines={2}>
                {local.nombre}
              </Text>
              <Text style={styles.cert}>
                {certLabel(local.necesitaCertificacion, local.estadoCertificacion)}
              </Text>
              {local.restringido ? (
                <View style={styles.restrictBadge}>
                  <Text style={styles.restrictBadgeText}>Local restringido</Text>
                </View>
              ) : null}
              {canManage && !onEdit ? (
                <View style={styles.readonlyBadge}>
                  <Text style={styles.readonlyBadgeText}>
                    Solo consulta{local.asesorBioClim ? ` · ${local.asesorBioClim}` : ""}
                  </Text>
                </View>
              ) : null}
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          <View style={styles.actions}>
            {canNavigate ? (
              <Action
                label="Cómo llegar"
                primary
                onPress={() =>
                  void Linking.openURL(mapsDirectionsUrl(local.latitud!, local.longitud!))
                }
              />
            ) : null}
            <Action
              label="Llamar"
              disabled={!local.encargadoTelefono}
              onPress={() => {
                const phone = local.encargadoTelefono.replace(/\s+/g, "");
                if (phone) void Linking.openURL(`tel:${phone}`);
              }}
            />
            {onVerGuia ? <Action label="Ver la guía" onPress={onVerGuia} /> : null}
            {canManage && onEdit ? <Action label="Editar" onPress={onEdit} /> : null}
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: bottomPad, gap: 10 }}
            showsVerticalScrollIndicator={false}
          >
            <Section title="Fotos de entrada">
              {local.fotos.length ? (
                <View style={styles.fotosGrid}>
                  {local.fotos.map((foto) => (
                    <Pressable
                      key={foto.id}
                      onPress={() => setPreviewUri(foto.rutaArchivo)}
                      style={styles.fotoThumb}
                    >
                      <Image source={{ uri: foto.rutaArchivo }} style={styles.fotoImage} />
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyFotos}>No hay fotos disponibles</Text>
              )}
            </Section>

            <Section title="Ubicación">
              <Pair label="Ubicación mapa" value={local.direccion || "—"} />
              {local.direccionFiscal ? <Pair label="Fiscal" value={local.direccionFiscal} /> : null}
              {local.direccionComercial ? <Pair label="Comercial" value={local.direccionComercial} /> : null}
              <Pair label="Dirección cert." value={local.direccionCert || "—"} />
              <Pair label="Referencia" value={local.referencia || "—"} />
              <Pair
                label="Coords"
                value={
                  canNavigate
                    ? `${local.latitud!.toFixed(5)}, ${local.longitud!.toFixed(5)}`
                    : "Sin coordenadas"
                }
              />
            </Section>

            <Section title="Contacto">
              <Pair label="Encargado" value={local.encargadoNombre || "—"} />
              <Pair
                label={
                  canManage && !local.operadoresVenTelefono
                    ? "Teléfono · oculto campo"
                    : "Teléfono"
                }
                value={local.encargadoTelefono || "—"}
              />
              <Pair label="Horario proveedores" value={local.horarioEntrada || "—"} />
            </Section>

            <Section title="Empresa">
              <Pair label="RUC" value={local.ruc || "—"} />
              <Pair label="Razón social" value={local.razonSocial || "—"} />
              <Pair label="Asesor" value={local.asesorBioClim || "—"} />
            </Section>

            <Section title="Operación">
              <Pair label="Envases" value={formatEnvaseSummary(local)} />
              {canSeePrecios(local, canManage) ? (
                <Pair
                  label={local.operadoresVenPrecio ? "Precios · visible operador" : "Precios · oculto operador"}
                  value={formatPrecios(local)}
                />
              ) : null}
              <Pair
                label="Frecuencias"
                value={local.frecuencias.length ? local.frecuencias.join(", ") : "—"}
              />
              <Pair
                label="Métodos de pago"
                value={
                  local.metodosPago.length
                    ? local.metodosPago.map((m) => m.nombre).join(", ")
                    : "—"
                }
              />
            </Section>

            {canManage && local.necesitaCertificacion && onToggleCert ? (
              <Pressable onPress={onToggleCert} style={styles.certBtn}>
                <Text style={styles.certBtnText}>
                  {local.estadoCertificacion === "pendiente"
                    ? "Marcar certificado emitido"
                    : "Volver a pendiente"}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </View>

      <Modal
        visible={Boolean(previewUri)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUri(null)}
      >
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewUri(null)}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
          ) : null}
        </Pressable>
      </Modal>
    </Modal>
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

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pair}>
      <Text style={styles.pairLabel}>{label}</Text>
      <Text style={styles.pairValue}>{value}</Text>
    </View>
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  dismiss: { flex: 1 },
  sheet: {
    maxHeight: "88%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 10,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
  },
  head: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  headCopy: { flex: 1, gap: 2, minWidth: 0 },
  kicker: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: { color: theme.colors.ink, fontSize: 17, fontWeight: "800" },
  cert: { color: theme.colors.accent, fontSize: 12, fontWeight: "700" },
  restrictBadge: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: theme.colors.dangerSoft,
  },
  restrictBadgeText: { color: theme.colors.danger, fontSize: 10, fontWeight: "800" },
  readonlyBadge: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: theme.colors.infoSoft,
  },
  readonlyBadgeText: { color: theme.colors.info, fontSize: 10, fontWeight: "800" },
  close: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.cream,
  },
  closeText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  action: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surface,
  },
  actionPrimary: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  actionDisabled: { opacity: 0.4 },
  actionText: { color: theme.colors.accent, fontSize: 12, fontWeight: "800" },
  actionTextPrimary: { color: "#FFFFFF" },
  scroll: { flexGrow: 0 },
  section: { gap: 6 },
  sectionTitle: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionBody: {
    backgroundColor: theme.colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 10,
    gap: 8,
  },
  pair: { gap: 2 },
  pairLabel: { color: theme.colors.muted, fontSize: 10, fontWeight: "700" },
  pairValue: { color: theme.colors.ink, fontSize: 13, fontWeight: "600" },
  fotosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  fotoThumb: {
    width: 88,
    height: 88,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
  },
  fotoImage: { width: "100%", height: "100%" },
  emptyFotos: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  previewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  previewImage: { width: "100%", height: "80%" },
  certBtn: {
    marginTop: 4,
    height: 42,
    borderRadius: 11,
    backgroundColor: theme.colors.warnSoft,
    borderWidth: 1.5,
    borderColor: theme.colors.warn,
    alignItems: "center",
    justifyContent: "center",
  },
  certBtnText: { color: theme.colors.warn, fontSize: 13, fontWeight: "800" },
});
