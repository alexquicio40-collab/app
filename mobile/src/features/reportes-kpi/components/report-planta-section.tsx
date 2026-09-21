import { formatQty } from "@/features/reportes-kpi/lib/format";
import { formatIngresoShort } from "@/features/reportes-kpi/lib/period";
import type { ReportSnapshot } from "@/features/reportes-kpi/types";
import { theme } from "@/lib/theme";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ReportPlantaDetailSheet } from "./report-planta-detail-sheet";
import { ReportTableCard } from "./report-table-card";

type ReportPlantaSectionProps = {
  snapshot: ReportSnapshot;
  rangeLabel: string;
};

export function ReportPlantaSection({ snapshot, rangeLabel }: ReportPlantaSectionProps) {
  const [open, setOpen] = useState(false);
  const count = snapshot.plantaDetalle.length;

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver detalle de ${count} registros de planta`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.banner, pressed ? styles.bannerPressed : null]}
      >
        <View style={styles.bannerCopy}>
          <Text style={styles.bannerTitle}>Planta — ingreso de mercadería</Text>
          <Text style={styles.bannerMeta}>Toca para ver el detalle del período</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count} reg.</Text>
          <Text style={styles.badgeHint}>→</Text>
        </View>
      </Pressable>

      <ReportTableCard
        title="Por asesor"
        subtitle={`${snapshot.plantaPorAsesor.length} asesor${snapshot.plantaPorAsesor.length === 1 ? "" : "es"}`}
        accent="accent"
        columns={[
          { key: "nombre", label: "Asesor", width: 140 },
          { key: "total", label: "Reg.", width: 52, align: "right" },
          { key: "litros", label: "Litros", width: 64, align: "right" },
          { key: "baldes", label: "Baldes", width: 64, align: "right" },
          { key: "galoneras", label: "Galon.", width: 64, align: "right" },
        ]}
        rows={snapshot.plantaPorAsesor.map((item) => ({
          nombre: item.nombre,
          total: formatQty(item.total),
          litros: formatQty(item.litros),
          baldes: formatQty(item.baldes),
          galoneras: formatQty(item.galoneras),
        }))}
        emptyText="Sin ingresos de planta"
      />

      <ReportTableCard
        title="Top proveedores"
        subtitle="Hasta 10 por volumen de registros"
        accent="accent"
        columns={[
          { key: "rank", label: "#", width: 36, align: "center" },
          { key: "proveedor", label: "Proveedor", width: 140 },
          { key: "total", label: "Reg.", width: 52, align: "right" },
          { key: "litros", label: "Litros", width: 64, align: "right" },
          { key: "baldes", label: "Baldes", width: 64, align: "right" },
          { key: "galoneras", label: "Galon.", width: 64, align: "right" },
        ]}
        rows={snapshot.plantaPorProveedor.map((item, index) => ({
          rank: String(index + 1),
          proveedor: item.nombre,
          total: formatQty(item.total),
          litros: formatQty(item.litros),
          baldes: formatQty(item.baldes),
          galoneras: formatQty(item.galoneras),
        }))}
        emptyText="Sin proveedores en el período"
      />

      <ReportTableCard
        title="Detalle de ingresos"
        subtitle={`${count} registro${count === 1 ? "" : "s"}`}
        accent="accent"
        columns={[
          { key: "ingreso", label: "Ingreso", width: 110 },
          { key: "proveedor", label: "Proveedor", width: 120 },
          { key: "asesor", label: "Asesor", width: 110 },
          { key: "guia", label: "Guía", width: 90 },
          { key: "litros", label: "Litros", width: 58, align: "right" },
          { key: "baldes", label: "Baldes", width: 58, align: "right" },
          { key: "galoneras", label: "Galon.", width: 58, align: "right" },
          { key: "notas", label: "Notas", width: 140 },
        ]}
        rows={snapshot.plantaDetalle.map((item) => ({
          id: item.id,
          ingreso: formatIngresoShort(item.ingreso),
          proveedor: item.proveedor || "—",
          asesor: item.asesor || "—",
          guia: item.guia || "—",
          litros: formatQty(item.litros),
          baldes: formatQty(item.baldes),
          galoneras: formatQty(item.galoneras),
          notas: item.notas?.trim() || "—",
        }))}
        emptyText="Sin detalle de planta"
      />

      <ReportPlantaDetailSheet
        open={open}
        items={snapshot.plantaDetalle}
        rangeLabel={rangeLabel}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
  },
  banner: {
    marginHorizontal: 10,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: theme.colors.accentDeep,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bannerPressed: {
    opacity: 0.88,
  },
  bannerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
  bannerMeta: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "600",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  badgeHint: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "700",
  },
});
