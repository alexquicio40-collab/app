import { LocalEnvaseFields } from "@/features/locales/components/local-envase-fields";
import { LocalPreciosFields } from "@/features/locales/components/local-precios-fields";
import { LocalFotosField } from "@/features/locales/components/local-fotos-field";
import { LocalPickerMap } from "@/features/locales/components/local-picker-map";
import type { MetodoPagoOption } from "@/features/locales/api";
import { geocodeAddress, reverseGeocode } from "@/features/locales/lib/geocode";
import { isBidonEnvase } from "@/features/locales/lib/format";
import { moneyText, parseMoney } from "@/features/locales/lib/precios";
import { consultarRuc, isValidRuc, sanitizeRucInput } from "@/features/locales/lib/ruc";
import type { LocalFormInput, LocalItem, PendingLocalFoto } from "@/features/locales/types";
import {
  FieldLabel,
  FieldRow,
  GhostButton,
  PrimaryButton,
  SelectField,
  TextField,
} from "@/features/routes/assign/components/form-kit";
import { PRIORIDADES, normalizePrioridad, type PrioridadProveedor } from "@/features/locales/lib/prioridad";
import { theme } from "@/lib/theme";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type LocalFormSheetProps = {
  open: boolean;
  local: LocalItem | null;
  metodosPago: MetodoPagoOption[];
  saving?: boolean;
  ownerName?: string;
  lockAsesor?: boolean;
  onClose: () => void;
  onSave: (input: LocalFormInput) => Promise<void>;
};

type FormState = {
  nombre: string;
  direccion: string;
  direccionCert: string;
  direccionFiscal: string;
  direccionComercial: string;
  lat: number | null;
  lng: number | null;
  horarioEntrada: string;
  asesorBioClim: string;
  telefonoAsesor: string;
  encargadoNombre: string;
  encargadoTelefono: string;
  referencia: string;
  ruc: string;
  razonSocial: string;
  necesitaCertificacion: boolean;
  estadoCertificacion: string | null;
  tipoEnvase: string | null;
  qtyEnvases: string;
  qtyAzules: string;
  qtyBlancos: string;
  bidonRealText: string;
  bidonPasadoText: string;
  precioLitroText: string;
  precioBaldeText: string;
  precioGaloneraText: string;
  operadoresVenPrecio: boolean;
  metodosPagoIds: number[];
  prioridad: PrioridadProveedor;
};

const emptyForm = (): FormState => ({
  nombre: "",
  direccion: "",
  direccionCert: "",
  direccionFiscal: "",
  direccionComercial: "",
  lat: null,
  lng: null,
  horarioEntrada: "",
  asesorBioClim: "",
  telefonoAsesor: "",
  encargadoNombre: "",
  encargadoTelefono: "",
  referencia: "",
  ruc: "",
  razonSocial: "",
  necesitaCertificacion: false,
  estadoCertificacion: "pendiente",
  tipoEnvase: null,
  qtyEnvases: "",
  qtyAzules: "",
  qtyBlancos: "",
  bidonRealText: "",
  bidonPasadoText: "",
  precioLitroText: "",
  precioBaldeText: "",
  precioGaloneraText: "",
  operadoresVenPrecio: false,
  metodosPagoIds: [],
  prioridad: "media",
});

export function LocalFormSheet({
  open,
  local,
  metodosPago,
  saving = false,
  ownerName = "",
  lockAsesor = false,
  onClose,
  onSave,
}: LocalFormSheetProps) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [rucLoading, setRucLoading] = useState(false);
  const [rucError, setRucError] = useState<string | null>(null);
  const [pendingFotos, setPendingFotos] = useState<PendingLocalFoto[]>([]);
  const [removedFotoIds, setRemovedFotoIds] = useState<string[]>([]);

  const geoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rucTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const direccionRef = useRef("");
  const rucInicial = useRef("");
  const formRef = useRef(form);
  formRef.current = form;

  const patch = useCallback((next: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...next }));
  }, []);

  useEffect(() => {
    if (!open) return;

    if (geoTimer.current) clearTimeout(geoTimer.current);
    if (rucTimer.current) clearTimeout(rucTimer.current);

    if (!local) {
      const blank = emptyForm();
      blank.asesorBioClim = ownerName;
      setForm(blank);
      setShowMap(false);
      setError(null);
      setGeoStatus(null);
      setRucError(null);
      setPendingFotos([]);
      setRemovedFotoIds([]);
      direccionRef.current = "";
      rucInicial.current = "";
      return;
    }

    const hasCoords = local.latitud != null && local.longitud != null;
    setForm({
      ...emptyForm(),
      nombre: local.nombre,
      direccion: local.direccion,
      direccionCert: local.direccionCert,
      direccionFiscal: local.direccionFiscal,
      direccionComercial: local.direccionComercial,
      lat: local.latitud,
      lng: local.longitud,
      horarioEntrada: local.horarioEntrada,
      asesorBioClim: local.asesorBioClim,
      telefonoAsesor: local.telefonoAsesor,
      encargadoNombre: local.encargadoNombre,
      encargadoTelefono: local.encargadoTelefono,
      referencia: local.referencia,
      ruc: local.ruc,
      razonSocial: local.razonSocial,
      necesitaCertificacion: local.necesitaCertificacion,
      estadoCertificacion: local.estadoCertificacion || "pendiente",
      tipoEnvase: local.tipoEnvase || null,
      qtyEnvases: local.cantidadEnvases != null ? String(local.cantidadEnvases) : "",
      qtyAzules: local.cantidadBidonesAzules != null ? String(local.cantidadBidonesAzules) : "",
      qtyBlancos: local.cantidadBidonesBlancos != null ? String(local.cantidadBidonesBlancos) : "",
      bidonRealText: local.bidonReal != null ? String(local.bidonReal) : "",
      bidonPasadoText: local.bidonPasadoPor != null ? String(local.bidonPasadoPor) : "",
      precioLitroText: moneyText(local.precioLitro),
      precioBaldeText: moneyText(local.precioBalde),
      precioGaloneraText: moneyText(local.precioGalonera),
      operadoresVenPrecio: local.operadoresVenPrecio,
      metodosPagoIds: local.metodosPago.map((m) => m.id),
      prioridad: normalizePrioridad(local.prioridad),
    });
    setShowMap(hasCoords);
    setError(null);
    setGeoStatus(hasCoords ? "Ubicación cargada" : null);
    setRucError(null);
    setPendingFotos([]);
    setRemovedFotoIds([]);
    direccionRef.current = local.direccion;
    rucInicial.current = sanitizeRucInput(local.ruc);
  }, [open, local]);

  useEffect(() => {
    return () => {
      if (geoTimer.current) clearTimeout(geoTimer.current);
      if (rucTimer.current) clearTimeout(rucTimer.current);
    };
  }, []);

  const runGeocode = useCallback(
    async (address: string) => {
      const query = address.trim();
      if (query.length < 6) {
        setGeoStatus("Escribe una dirección más completa");
        return;
      }
      setGeoLoading(true);
      setGeoStatus("Buscando en el mapa…");
      try {
        const result = await geocodeAddress(query);
        if (!result) {
          setGeoStatus("No se encontró la dirección");
          return;
        }
        patch({ lat: result.lat, lng: result.lng });
        setShowMap(true);
        setGeoStatus(`${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}`);
      } catch {
        setGeoStatus("Error al geocodificar");
      } finally {
        setGeoLoading(false);
      }
    },
    [patch],
  );

  const rucLoadingRef = useRef(false);

  const runConsultarRuc = useCallback(
    async (raw?: string) => {
      if (rucLoadingRef.current) return;
      const ruc = sanitizeRucInput(raw ?? formRef.current.ruc);
      if (!isValidRuc(ruc)) {
        setRucError("El RUC debe tener exactamente 11 dígitos");
        return;
      }

      rucLoadingRef.current = true;
      setRucLoading(true);
      setRucError(null);
      try {
        const data = await consultarRuc(ruc);
        const current = formRef.current;
        const fillDireccion = !current.direccion.trim() && !!data.direccion;
        const next: Partial<FormState> = {
          ruc: data.ruc,
          razonSocial: data.razonSocial,
        };
        if (fillDireccion) next.direccion = data.direccion;
        if (!current.direccionFiscal.trim() && data.direccion) next.direccionFiscal = data.direccion;

        patch(next);

        if (fillDireccion && data.direccion) {
          direccionRef.current = data.direccion;
          if (data.direccion.trim().length > 10) {
            void runGeocode(data.direccion);
          }
        }
      } catch (err) {
        if (formRef.current.razonSocial.trim()) {
          setRucError(null);
          return;
        }
        setRucError(err instanceof Error ? err.message : "No se pudo consultar el RUC");
      } finally {
        rucLoadingRef.current = false;
        setRucLoading(false);
      }
    },
    [patch, runGeocode],
  );

  const onRucChange = useCallback(
    (value: string) => {
      const ruc = sanitizeRucInput(value);
      patch({ ruc });
      setRucError(null);
      if (rucTimer.current) clearTimeout(rucTimer.current);
      if (!isValidRuc(ruc)) return;
      if (ruc === rucInicial.current) return;
      rucTimer.current = setTimeout(() => {
        void runConsultarRuc(ruc);
      }, 600);
    },
    [patch, runConsultarRuc],
  );

  const onDireccionChange = useCallback(
    (direccion: string) => {
      patch({ direccion });
      direccionRef.current = direccion;
      if (geoTimer.current) clearTimeout(geoTimer.current);
      if (direccion.trim().length <= 10) return;
      geoTimer.current = setTimeout(() => {
        void runGeocode(direccion);
      }, 1500);
    },
    [patch, runGeocode],
  );

  const onPickMap = useCallback(
    async ({ lat, lng }: { lat: number; lng: number }) => {
      patch({ lat, lng });
      setShowMap(true);
      setGeoStatus(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);

      try {
        const address = await reverseGeocode(lat, lng);
        if (address) {
          if (geoTimer.current) clearTimeout(geoTimer.current);
          patch({ direccion: address });
          direccionRef.current = address;
        }
      } catch {
        // coords ya quedaron
      }
    },
    [patch],
  );

  const toggleMetodo = (id: number) => {
    patch({
      metodosPagoIds: form.metodosPagoIds.includes(id)
        ? form.metodosPagoIds.filter((item) => item !== id)
        : [...form.metodosPagoIds, id],
    });
  };

  const submit = async () => {
    const nombre = form.nombre.trim();
    const direccion = form.direccion.trim();
    if (!nombre || !direccion) {
      setError("Nombre y dirección son obligatorios");
      return;
    }
    if (form.lat == null || form.lng == null) {
      setError("Ubica el local en el mapa (tap o busca la dirección)");
      return;
    }

    setError(null);
    await onSave({
      nombre,
      direccion,
      direccionCert: form.direccionCert.trim(),
      direccionFiscal: form.direccionFiscal.trim(),
      direccionComercial: form.direccionComercial.trim(),
      latitud: form.lat,
      longitud: form.lng,
      horarioEntrada: form.horarioEntrada.trim(),
      asesorBioClim: (lockAsesor ? ownerName : form.asesorBioClim).trim(),
      telefonoAsesor: form.telefonoAsesor.trim(),
      encargadoNombre: form.encargadoNombre.trim(),
      encargadoTelefono: form.encargadoTelefono.trim(),
      referencia: form.referencia.trim(),
      ruc: form.ruc.trim(),
      razonSocial: form.razonSocial.trim(),
      necesitaCertificacion: form.necesitaCertificacion,
      estadoCertificacion: form.estadoCertificacion,
      tipoEnvase: form.tipoEnvase,
      cantidadEnvases: parseOptionalInt(form.qtyEnvases),
      cantidadBidonesAzules: isBidonEnvase(form.tipoEnvase)
        ? parseOptionalInt(form.qtyAzules)
        : null,
      cantidadBidonesBlancos: isBidonEnvase(form.tipoEnvase)
        ? parseOptionalInt(form.qtyBlancos)
        : null,
      bidonReal: parseOptionalInt(form.bidonRealText),
      bidonPasadoPor: parseOptionalInt(form.bidonPasadoText),
      precioLitro: parseMoney(form.precioLitroText),
      precioBalde: parseMoney(form.precioBaldeText),
      precioGalonera: parseMoney(form.precioGaloneraText),
      operadoresVenPrecio: form.operadoresVenPrecio,
      prioridad: form.prioridad,
      metodosPagoIds: form.metodosPagoIds,
      pendingFotos,
      removedFotoIds,
    });
  };

  if (!open) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <Text style={styles.title}>{local ? "Editar local" : "Nuevo local"}</Text>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            <FieldRow>
              <View style={styles.half}>
                <FieldLabel>Nombre *</FieldLabel>
                <TextField
                  value={form.nombre}
                  onChangeText={(nombre) => patch({ nombre })}
                  placeholder="Local…"
                />
              </View>
              <View style={styles.half}>
                <FieldLabel>RUC</FieldLabel>
                <View style={styles.addressRow}>
                  <View style={styles.addressInput}>
                    <TextField
                      value={form.ruc}
                      onChangeText={onRucChange}
                      placeholder="11 dígitos"
                      keyboardType="number-pad"
                      maxLength={11}
                    />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Consultar RUC"
                    onPress={() => void runConsultarRuc()}
                    style={styles.searchBtn}
                    disabled={rucLoading}
                  >
                    {rucLoading ? (
                      <ActivityIndicator size="small" color={theme.colors.accent} />
                    ) : (
                      <Text style={styles.searchBtnText}>⌕</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </FieldRow>
            {rucError ? <Text style={styles.rucError}>{rucError}</Text> : null}

            <View style={styles.field}>
              <FieldLabel>Ubicación mapa *</FieldLabel>
              <View style={styles.addressRow}>
                <View style={styles.addressInput}>
                  <TextField
                    value={form.direccion}
                    onChangeText={onDireccionChange}
                    placeholder="Dirección en Lima…"
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Buscar en mapa"
                  onPress={() => void runGeocode(form.direccion)}
                  style={styles.searchBtn}
                  disabled={geoLoading}
                >
                  {geoLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.accent} />
                  ) : (
                    <Text style={styles.searchBtnText}>⌕</Text>
                  )}
                </Pressable>
              </View>
              {geoStatus ? <Text style={styles.geoStatus}>{geoStatus}</Text> : null}
            </View>

            <FieldRow>
              <View style={styles.half}>
                <FieldLabel>Dirección fiscal</FieldLabel>
                <TextField
                  value={form.direccionFiscal}
                  onChangeText={(direccionFiscal) => patch({ direccionFiscal })}
                  placeholder="RUC / SUNAT"
                />
              </View>
              <View style={styles.half}>
                <FieldLabel>Dirección comercial</FieldLabel>
                <TextField
                  value={form.direccionComercial}
                  onChangeText={(direccionComercial) => patch({ direccionComercial })}
                  placeholder="Local comercial"
                />
              </View>
            </FieldRow>

            <View style={styles.field}>
              <FieldLabel>Dirección cert.</FieldLabel>
              <TextField
                value={form.direccionCert}
                onChangeText={(direccionCert) => patch({ direccionCert })}
                placeholder="Solo se usa en el certificado"
              />
            </View>

            <View style={styles.mapBlock}>
              <View style={styles.mapHead}>
                <Text style={styles.mapTitle}>Ubicación en mapa *</Text>
                {!showMap ? (
                  <Pressable onPress={() => setShowMap(true)} style={styles.mapToggle}>
                    <Text style={styles.mapToggleText}>Mostrar mapa</Text>
                  </Pressable>
                ) : null}
              </View>

              {showMap ? (
                <LocalPickerMap lat={form.lat} lng={form.lng} onPick={(c) => void onPickMap(c)} />
              ) : (
                <Pressable style={styles.mapPlaceholder} onPress={() => setShowMap(true)}>
                  <Text style={styles.mapPlaceholderTitle}>Mapa oculto</Text>
                  <Text style={styles.mapPlaceholderText}>
                    Busca la dirección o toca para ubicar el pin
                  </Text>
                </Pressable>
              )}
            </View>

            <FieldRow>
              <View style={styles.half}>
                <FieldLabel>Razón social</FieldLabel>
                <TextField
                  value={form.razonSocial}
                  onChangeText={(razonSocial) => patch({ razonSocial })}
                  placeholder="Empresa…"
                />
              </View>
              <View style={styles.half}>
                <FieldLabel>Referencia</FieldLabel>
                <TextField
                  value={form.referencia}
                  onChangeText={(referencia) => patch({ referencia })}
                  placeholder="Cerca de…"
                />
              </View>
            </FieldRow>

            <FieldRow>
              <View style={styles.half}>
                <FieldLabel>Asesor</FieldLabel>
                <TextField
                  value={lockAsesor ? ownerName || form.asesorBioClim : form.asesorBioClim}
                  onChangeText={(asesorBioClim) => {
                    if (lockAsesor) return;
                    patch({ asesorBioClim });
                  }}
                  placeholder="Nombre del asesor"
                />
              </View>
              <View style={styles.half}>
                <FieldLabel>Tel. asesor</FieldLabel>
                <TextField
                  value={form.telefonoAsesor}
                  onChangeText={(telefonoAsesor) => patch({ telefonoAsesor })}
                  placeholder="999…"
                  keyboardType="phone-pad"
                />
              </View>
            </FieldRow>

            <FieldRow>
              <View style={styles.half}>
                <FieldLabel>Encargado</FieldLabel>
                <TextField
                  value={form.encargadoNombre}
                  onChangeText={(encargadoNombre) => patch({ encargadoNombre })}
                  placeholder="Nombre…"
                />
              </View>
              <View style={styles.half}>
                <FieldLabel>Teléfono</FieldLabel>
                <TextField
                  value={form.encargadoTelefono}
                  onChangeText={(encargadoTelefono) => patch({ encargadoTelefono })}
                  placeholder="999…"
                  keyboardType="phone-pad"
                />
              </View>
            </FieldRow>

            <View style={styles.field}>
              <FieldLabel>Prioridad</FieldLabel>
              <View style={styles.priorityRow}>
                {PRIORIDADES.map((item) => {
                  const on = form.prioridad === item.value;
                  return (
                    <Pressable
                      key={item.value}
                      onPress={() => patch({ prioridad: item.value })}
                      style={[
                        styles.priorityChip,
                        { borderColor: item.color, backgroundColor: on ? item.color : item.soft },
                      ]}
                    >
                      <Text style={[styles.priorityText, { color: on ? "#fff" : item.color }]}>
                        {item.value === "alta" ? "Alta" : item.value === "media" ? "Media" : "Baja"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <FieldLabel>Horario proveedores</FieldLabel>
              <TextField
                value={form.horarioEntrada}
                onChangeText={(horarioEntrada) => patch({ horarioEntrada })}
                placeholder="08:00-12:00"
              />
            </View>

            <LocalEnvaseFields
              value={{
                tipoEnvase: form.tipoEnvase,
                qtyEnvases: form.qtyEnvases,
                qtyAzules: form.qtyAzules,
                qtyBlancos: form.qtyBlancos,
                bidonRealText: form.bidonRealText,
                bidonPasadoText: form.bidonPasadoText,
              }}
              onChange={patch}
            />

            <LocalPreciosFields
              value={{
                precioLitroText: form.precioLitroText,
                precioBaldeText: form.precioBaldeText,
                precioGaloneraText: form.precioGaloneraText,
                operadoresVenPrecio: form.operadoresVenPrecio,
              }}
              onChange={patch}
            />

            <LocalFotosField
              existing={local?.fotos ?? []}
              pending={pendingFotos}
              removedIds={removedFotoIds}
              onChangePending={setPendingFotos}
              onChangeRemoved={setRemovedFotoIds}
            />

            <Pressable
              onPress={() =>
                patch({
                  necesitaCertificacion: !form.necesitaCertificacion,
                  estadoCertificacion: form.necesitaCertificacion
                    ? null
                    : form.estadoCertificacion || "pendiente",
                })
              }
              style={[styles.toggle, form.necesitaCertificacion ? styles.toggleOn : null]}
            >
              <Text
                style={[styles.toggleText, form.necesitaCertificacion ? styles.toggleTextOn : null]}
              >
                {form.necesitaCertificacion ? "● Necesita certificación" : "○ Sin certificación"}
              </Text>
            </Pressable>

            {form.necesitaCertificacion ? (
              <SelectField
                label="Estado certificación"
                value={form.estadoCertificacion ?? "pendiente"}
                placeholder="Estado…"
                options={[
                  { value: "pendiente", label: "Pendiente" },
                  { value: "ya emitido", label: "Ya emitido" },
                ]}
                onChange={(estadoCertificacion) => patch({ estadoCertificacion })}
              />
            ) : null}

            {metodosPago.length ? (
              <View style={styles.field}>
                <FieldLabel>Métodos de pago</FieldLabel>
                <View style={styles.chips}>
                  {metodosPago.map((item) => {
                    const on = form.metodosPagoIds.includes(item.id);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => toggleMetodo(item.id)}
                        style={[styles.payChip, on ? styles.payChipOn : null]}
                      >
                        <Text style={[styles.payText, on ? styles.payTextOn : null]}>
                          {item.nombre}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.field}>
                <FieldLabel>Métodos de pago</FieldLabel>
                <Text style={styles.payHint}>
                  No hay formas de pago. Agrégalas con el botón Pagos del header.
                </Text>
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <FieldRow>
              <View style={styles.half}>
                <PrimaryButton
                  label={local ? "Guardar cambios" : "Crear local"}
                  onPress={() => void submit()}
                  loading={saving}
                />
              </View>
              <View style={styles.half}>
                <GhostButton label="Cancelar" onPress={onClose} />
              </View>
            </FieldRow>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function parseOptionalInt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.round(n) : null;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  dismiss: { flex: 0.06 },
  sheet: {
    flex: 1,
    maxHeight: "94%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 10,
    paddingTop: 6,
    ...Platform.select({
      web: { maxWidth: 560, width: "100%", alignSelf: "center" },
      default: {},
    }),
  },
  handle: {
    alignSelf: "center",
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.line,
    marginBottom: 4,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  title: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  close: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: theme.colors.cream,
  },
  closeText: { color: theme.colors.muted, fontSize: 11, fontWeight: "700" },
  body: { gap: 7, paddingBottom: 12 },
  field: { gap: 3 },
  priorityRow: { flexDirection: "row", gap: 8 },
  priorityChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  priorityText: { fontSize: 13, fontWeight: "800" },
  half: { flex: 1, minWidth: 0, gap: 3 },
  addressRow: { flexDirection: "row", gap: 6, alignItems: "stretch" },
  addressInput: { flex: 1, minWidth: 0 },
  searchBtn: {
    width: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnText: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: "800",
  },
  geoStatus: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "600",
  },
  rucError: {
    color: theme.colors.danger,
    fontSize: 10,
    fontWeight: "700",
    marginTop: -3,
  },
  mapBlock: { gap: 4 },
  mapHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mapTitle: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  mapToggle: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: theme.colors.cream,
  },
  mapToggleText: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "800",
  },
  mapPlaceholder: {
    height: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    borderStyle: "dashed",
    backgroundColor: theme.colors.cream,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 14,
  },
  mapPlaceholderTitle: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "800",
  },
  mapPlaceholderText: {
    color: theme.colors.muted,
    fontSize: 10,
    textAlign: "center",
  },
  toggle: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  toggleOn: {
    borderColor: theme.colors.gold,
    backgroundColor: theme.colors.goldSoft,
  },
  toggleText: { color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  toggleTextOn: { color: theme.colors.gold },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  payChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
  },
  payChipOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  payText: { color: theme.colors.muted, fontSize: 10, fontWeight: "700" },
  payTextOn: { color: theme.colors.accent },
  payHint: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },
  error: { color: theme.colors.danger, fontSize: 11, fontWeight: "700" },
});
