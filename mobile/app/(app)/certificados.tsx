import { CertificadoCodigoSheet } from "@/features/certificados/components/certificado-codigo-sheet";
import { CertificadoTextoSheet } from "@/features/certificados/components/certificado-texto-sheet";
import { CertificadoHistorialCard } from "@/features/certificados/components/certificado-historial-card";
import { CertificadoHistorialDetailSheet } from "@/features/certificados/components/certificado-historial-detail-sheet";
import { CertificadoPendienteCard } from "@/features/certificados/components/certificado-pendiente-card";
import { CertificadoPendienteDetailSheet } from "@/features/certificados/components/certificado-pendiente-detail-sheet";
import { CertificadoUploadSheet } from "@/features/certificados/components/certificado-upload-sheet";
import { CertificadoViewerSheet } from "@/features/certificados/components/certificado-viewer-sheet";
import { CertificadosStats } from "@/features/certificados/components/certificados-stats";
import { CertificadosTabs } from "@/features/certificados/components/certificados-tabs";
import {
  HistorialToolbar,
  PendientesToolbar,
} from "@/features/certificados/components/certificados-toolbar";
import { useCertificadosScreen } from "@/features/certificados/hooks";
import { theme } from "@/lib/theme";
import { ScreenHeader } from "@/ui/screen-header";
import { useContentBottomPad } from "@/ui/use-content-bottom-pad";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CertificadosScreen() {
  const screen = useCertificadosScreen();
  const bottomPad = useContentBottomPad(12);

  const renderPendiente = useCallback(
    ({ item }: { item: (typeof screen.pendientes)[number] }) => (
      <CertificadoPendienteCard
        item={item}
        canUpload={screen.canUpload}
        onOpenDetail={() => screen.openDetail(item)}
        onUpload={() => void screen.generar(item)}
      />
    ),
    [screen],
  );

  const renderHistorial = useCallback(
    ({ item }: { item: (typeof screen.historial)[number] }) => (
      <CertificadoHistorialCard
        item={item}
        canDelete={screen.canDeleteHistorial}
        onView={() => screen.openViewer(item)}
        onOpenDetail={() => screen.openHistorialDetail(item)}
        onEditCodigo={() => screen.abrirEditarCodigo(item)}
        onDelete={
          screen.canDeleteHistorial ? () => void screen.removeHistorial(item) : undefined
        }
      />
    ),
    [screen],
  );

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Certificados"
        compact
        trailing={
          screen.canUpload ? (
            <Pressable onPress={screen.abrirManual} style={styles.manualBtn}>
              <Text style={styles.manualText}>Manual</Text>
            </Pressable>
          ) : null
        }
      />

      <CertificadosStats
        pendientes={screen.stats.pendientes}
        emitidos={screen.stats.emitidos}
        esteMes={screen.stats.esteMes}
      />

      <CertificadosTabs
        tab={screen.tab}
        pendientes={screen.stats.pendientes}
        historial={screen.historialTotal}
        onChange={screen.setTab}
      />

      {screen.tab === "pendientes" ? (
        <PendientesToolbar
          filters={screen.pendFilters}
          asesores={screen.asesores}
          total={screen.pendientes.length}
          hasFilters={screen.hasPendFilters}
          onChange={screen.patchPendFilters}
          onClear={screen.clearPendFilters}
        />
      ) : (
        <HistorialToolbar
          filters={screen.histFilters}
          total={screen.historialTotal}
          visible={screen.historial.length}
          hasFilters={screen.hasHistFilters}
          onChange={screen.patchHistFilters}
          onClear={screen.clearHistFilters}
        />
      )}

      {screen.loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : screen.error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{screen.error}</Text>
          <Pressable onPress={() => void screen.reload()} style={styles.retry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : screen.tab === "pendientes" ? (
        <FlatList
          data={screen.pendientes}
          keyExtractor={(item) => item.id}
          renderItem={renderPendiente}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 24 }]}
          refreshControl={
            <RefreshControl
              refreshing={screen.refreshing}
              onRefresh={() => void screen.reload()}
              tintColor={theme.colors.accent}
            />
          }
          ListEmptyComponent={
            <Empty
              title="Sin pendientes"
              text={
                screen.hasPendFilters
                  ? "Prueba limpiar los filtros"
                  : "No hay certificados por emitir"
              }
              onClear={screen.hasPendFilters ? screen.clearPendFilters : undefined}
            />
          }
        />
      ) : (
        <FlatList
          data={screen.historial}
          keyExtractor={(item) => item.id}
          renderItem={renderHistorial}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 24 }]}
          refreshControl={
            <RefreshControl
              refreshing={screen.refreshing}
              onRefresh={() => void screen.reload()}
              tintColor={theme.colors.accent}
            />
          }
          ListEmptyComponent={
            <Empty
              title="Sin historial"
              text={
                screen.hasHistFilters
                  ? "Prueba limpiar los filtros"
                  : "Aún no hay certificados emitidos"
              }
              onClear={screen.hasHistFilters ? screen.clearHistFilters : undefined}
            />
          }
        />
      )}

      <CertificadoPendienteDetailSheet
        item={screen.detailTarget}
        onClose={screen.closeDetail}
      />

      <CertificadoUploadSheet
        item={screen.uploadTarget}
        saving={screen.mutating}
        onClose={screen.closeUpload}
        onSubmit={screen.submitUpload}
      />

      <CertificadoHistorialDetailSheet
        item={screen.historialDetail}
        onClose={screen.closeHistorialDetail}
      />

      <CertificadoTextoSheet
        value={screen.borrador}
        saving={screen.mutating}
        onClose={screen.cerrarBorrador}
        onProcess={(texto) => void screen.procesarBorrador(texto)}
      />

      <CertificadoCodigoSheet
        visible={screen.codigoModo != null}
        title={screen.codigoModo === "editar" ? "Corregir código" : "Certificado manual"}
        hint="Si el automático salió mal, escribe el código CBC-0664-2026."
        codigoInicial={screen.codigoInicial}
        pedirLocal={screen.codigoModo === "manual"}
        saving={screen.mutating}
        onClose={screen.cerrarCodigo}
        onSubmit={(value) => void screen.guardarCodigo(value)}
      />

      <CertificadoViewerSheet
        item={screen.viewer}
        canDelete={screen.canDeleteHistorial}
        onClose={screen.closeViewer}
        onDelete={
          screen.viewer && screen.canDeleteHistorial
            ? () => void screen.removeHistorial(screen.viewer!)
            : undefined
        }
      />
    </View>
  );
}

function Empty({
  title,
  text,
  onClear,
}: {
  title: string;
  text: string;
  onClear?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {onClear ? (
        <Pressable onPress={onClear} style={styles.retry}>
          <Text style={styles.retryText}>Limpiar filtros</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  manualBtn: {
    backgroundColor: "#b45309",
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  manualText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  list: { paddingTop: 8, flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  retry: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
  },
  retryText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  empty: {
    paddingTop: 48,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 18,
  },
});
