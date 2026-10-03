import { formatQty } from "@/features/reportes-kpi/lib/format";
import type { ReportSnapshot } from "@/features/reportes-kpi/types";
import { View } from "react-native";
import { ReportEnvasesCard } from "./report-envases-card";
import { ReportPlantaSection } from "./report-planta-section";
import { ReportRutasSection } from "./report-rutas-section";
import { ReportTableCard } from "./report-table-card";

type ReportContentProps = {
  snapshot: ReportSnapshot;
  rangeLabel: string;
};

export function ReportContent({ snapshot, rangeLabel }: ReportContentProps) {
  const hasRutas = snapshot.rutas.total > 0;
  const hasPlanta = snapshot.plantaDetalle.length > 0;
  const hasEnvases =
    snapshot.envasesTotal.litros > 0 ||
    snapshot.envasesTotal.baldes > 0 ||
    snapshot.envasesTotal.galoneras > 0 ||
    hasRutas ||
    hasPlanta;

  if (!hasRutas && !hasPlanta) {
    return null;
  }

  return (
    <View>
      {hasEnvases ? (
        <ReportEnvasesCard
          total={snapshot.envasesTotal}
          rutas={snapshot.envasesRutas}
          planta={snapshot.envasesPlanta}
          showRutas={hasRutas}
          showPlanta={hasPlanta}
        />
      ) : null}

      {hasRutas ? (
        <>
          <ReportRutasSection rutas={snapshot.rutas} />

          <ReportTableCard
            title="Rutas asignadas"
            subtitle={`${snapshot.rutasAsignadas.length} ruta${snapshot.rutasAsignadas.length === 1 ? "" : "s"}`}
            columns={[
              { key: "fecha", label: "Fecha", width: 88 },
              { key: "asignador", label: "Asignó", width: 110 },
              { key: "conductor", label: "Operador", width: 110 },
              { key: "local", label: "Local", width: 140 },
              { key: "estado", label: "Estado", width: 92 },
              { key: "litros", label: "Litros", width: 56, align: "right" },
              { key: "baldes", label: "Baldes", width: 56, align: "right" },
              { key: "galoneras", label: "Galon.", width: 56, align: "right" },
            ]}
            rows={snapshot.rutasAsignadas.map((item) => ({
              id: item.id,
              fecha: item.fecha || "—",
              asignador: item.asignador,
              conductor: item.conductor,
              local: item.local,
              estado: item.estado,
              litros: formatQty(item.litros),
              baldes: formatQty(item.baldes),
              galoneras: formatQty(item.galoneras),
            }))}
          />

          <ReportTableCard
            title="Por asignador"
            subtitle="Cantidades recogidas"
            columns={[
              { key: "nombre", label: "Asignador", width: 130 },
              { key: "asignadas", label: "Asig.", width: 52, align: "right" },
              { key: "recolectadas", label: "Rec.", width: 52, align: "right" },
              { key: "litros", label: "Litros", width: 64, align: "right" },
              { key: "baldes", label: "Baldes", width: 58, align: "right" },
              { key: "galoneras", label: "Galon.", width: 58, align: "right" },
            ]}
            rows={snapshot.porAsignador.map((item) => ({
              id: item.id,
              nombre: item.nombre,
              asignadas: formatQty(item.asignadas),
              recolectadas: formatQty(item.recolectadas),
              litros: formatQty(item.litros),
              baldes: formatQty(item.baldes),
              galoneras: formatQty(item.galoneras),
            }))}
          />

          <ReportTableCard
            title="Por operador"
            subtitle={`${snapshot.porConductor.length} operador${snapshot.porConductor.length === 1 ? "" : "es"}`}
            columns={[
              { key: "nombre", label: "Operador", width: 130 },
              { key: "total", label: "Total", width: 52, align: "right" },
              { key: "recolectado", label: "Rec.", width: 56, align: "right" },
              { key: "programado", label: "Prog.", width: 52, align: "right" },
              { key: "enRuta", label: "En ruta", width: 58, align: "right" },
              { key: "cerrado", label: "Cerr.", width: 52, align: "right" },
              { key: "litros", label: "Litraje", width: 64, align: "right" },
              { key: "baldes", label: "Baldes", width: 58, align: "right" },
              { key: "galoneras", label: "Galon.", width: 58, align: "right" },
            ]}
            rows={snapshot.porConductor.map((item) => ({
              id: item.id,
              nombre: item.nombre,
              total: formatQty(item.total),
              recolectado: formatQty(item.recolectado),
              programado: formatQty(item.programado),
              enRuta: formatQty(item.enRuta + item.llego),
              cerrado: formatQty(item.cerrado),
              litros: formatQty(item.litros),
              baldes: formatQty(item.baldes),
              galoneras: formatQty(item.galoneras),
            }))}
          />

          <ReportTableCard
            title="Locales visitados"
            subtitle="Top 20 por visitas"
            columns={[
              { key: "rank", label: "#", width: 36, align: "center" },
              { key: "local", label: "Local", width: 160 },
              { key: "total", label: "Total", width: 52, align: "right" },
              { key: "recolectado", label: "Rec.", width: 56, align: "right" },
              { key: "programado", label: "Prog.", width: 52, align: "right" },
              { key: "cerrado", label: "Cerr.", width: 52, align: "right" },
            ]}
            rows={snapshot.porLocal.map((item, index) => ({
              id: item.id,
              rank: String(index + 1),
              local: item.nombre,
              total: formatQty(item.total),
              recolectado: formatQty(item.recolectado),
              programado: formatQty(item.programado),
              cerrado: formatQty(item.cerrado),
            }))}
          />
        </>
      ) : null}

      {hasPlanta ? (
        <ReportPlantaSection snapshot={snapshot} rangeLabel={rangeLabel} />
      ) : null}
    </View>
  );
}
