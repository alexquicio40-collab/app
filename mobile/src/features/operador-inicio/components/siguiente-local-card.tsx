import { DashIcon, type IconName } from "@/features/operador-inicio/components/dash-icon";
import { cardShadow, dash } from "@/features/operador-inicio/palette";
import type { SiguienteLocal } from "@/features/operador-inicio/types";
import { Pressable, StyleSheet, Text, View } from "react-native";

type SiguienteLocalCardProps = {
  local: SiguienteLocal | null;
  onOpen: () => void;
};

export function SiguienteLocalCard({ local, onOpen }: SiguienteLocalCardProps) {
  if (!local) {
    return (
      <View style={styles.card}>
        <Text style={styles.kicker}>Siguiente local</Text>
        <Text style={styles.empty}>No queda ningún local por atender.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.kickerRow}>
          <DashIcon name="pin" color={dash.ink} size={16} />
          <Text style={styles.kicker}>Siguiente local</Text>
        </View>
        <Text style={styles.count}>
          # {local.posicion} de {local.total}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.mark}>
          <Text style={styles.markText}>{local.inicial}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={2}>
            {local.nombre}
          </Text>
          <Meta icon="pin" text={local.direccion} />
          <Meta icon="clock" text={local.horario} />
          <View style={styles.lastRow}>
            <View style={styles.extra}>
              <Meta icon="drop" text={local.extra} />
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Ver local" onPress={onOpen} style={styles.button}>
              <DashIcon name="book" color="#FFFFFF" size={13} />
              <Text style={styles.buttonText} numberOfLines={1}>
                VER LOCAL
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function Meta({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.meta}>
      <DashIcon name={icon} color={icon === "drop" ? dash.blue : dash.muted} size={13} />
      <Text style={styles.metaText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dash.card,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: dash.line,
    ...cardShadow,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  kicker: {
    color: dash.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  count: {
    color: dash.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  body: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: dash.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: {
    color: dash.greenDeep,
    fontSize: 32,
    fontWeight: "800",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: dash.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    flex: 1,
    color: dash.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  lastRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  extra: {
    flex: 1,
    minWidth: 0,
  },
  button: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: dash.green,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  empty: {
    color: dash.muted,
    fontSize: 13,
    fontWeight: "600",
  },
});
