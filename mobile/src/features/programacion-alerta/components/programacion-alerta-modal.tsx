import { dismissRecordatorio, wasDismissed } from "@/features/programacion-alerta/lib/dismiss";
import type { Recordatorio, RecordatoriosHoy } from "@/features/programacion-alerta/types";
import { fetchRecordatoriosHoy } from "@/features/programacion-alerta/api";
import { theme } from "@/lib/theme";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ROLES = new Set(["administrador", "asesor"]);

function frecuenciaLabel(valor: string) {
  if (valor === "semanal") return "Semanal";
  if (valor === "quincenal") return "Quincenal";
  if (valor === "mensual") return "Mensual";
  return valor;
}

function Fila({ item }: { item: Recordatorio }) {
  const extra = [item.conductorNombre || "Operador", frecuenciaLabel(item.frecuencia)]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.item}>
      <View style={styles.itemCopy}>
        <Text style={styles.local} numberOfLines={2}>
          {item.localNombre || "Local"}
        </Text>
        {item.localDireccion ? (
          <Text style={styles.dir} numberOfLines={1}>
            {item.localDireccion}
          </Text>
        ) : null}
        <Text style={styles.meta} numberOfLines={1}>
          {extra}
        </Text>
      </View>
      {item.hora ? (
        <View style={styles.hora}>
          <Text style={styles.horaText}>{item.hora}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function ProgramacionAlerta() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const rol = (user?.rol ?? "").toLowerCase();
  const visible = ROLES.has(rol);
  const [data, setData] = useState<RecordatoriosHoy | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancel = false;
    void (async () => {
      try {
        const next = await fetchRecordatoriosHoy();
        if (cancel || next.total < 1 || !next.fecha) return;
        if (await wasDismissed(next.fecha)) return;
        if (cancel) return;
        setData(next);
        setOpen(true);
      } catch {
        // Sin aviso si la programación no responde.
      }
    })();
    return () => {
      cancel = true;
    };
  }, [visible]);

  const close = async () => {
    if (data?.fecha) await dismissRecordatorio(data.fecha);
    setOpen(false);
  };

  const openProgramacion = async () => {
    await close();
    router.push("/rutas?tab=programacion");
  };

  if (!open || !data) return null;

  const titulo =
    data.total === 1 ? "1 recojo programado hoy" : `${data.total} recojos programados hoy`;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => void close()}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { marginBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.kicker}>Programación</Text>
          <Text style={styles.title}>{titulo}</Text>
          <Text style={styles.fecha}>{data.fecha}</Text>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {data.items.map((item) => (
              <Fila key={item.id} item={item} />
            ))}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable onPress={() => void openProgramacion()} style={styles.link}>
              <Text style={styles.linkText}>Ver programación</Text>
            </Pressable>
            <Pressable onPress={() => void close()} style={styles.ok}>
              <Text style={styles.okText}>Entendido</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    maxHeight: "80%",
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 4,
  },
  kicker: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: { color: theme.colors.ink, fontSize: 20, fontWeight: "800" },
  fecha: { color: theme.colors.muted, fontSize: 13, fontWeight: "600", marginBottom: 8 },
  list: { flexGrow: 0 },
  listContent: { gap: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
  },
  itemCopy: { flex: 1, minWidth: 0, gap: 2 },
  local: { color: theme.colors.ink, fontSize: 14, fontWeight: "800" },
  dir: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  meta: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  hora: {
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  horaText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 12 },
  link: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.cream,
  },
  linkText: { color: theme.colors.accent, fontSize: 13, fontWeight: "800" },
  ok: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.colors.accent,
  },
  okText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
