import { formatFechaLabel, todayIso } from "@/features/hoja-ruta/lib/format";
import { theme } from "@/lib/theme";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type HojaHeaderCardProps = {
  chofer: string;
  placa: string;
  fecha: string;
  acompanante: string;
  onFecha: (iso: string) => void;
  onAcompanante: (value: string) => void;
};

function toIso(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function HojaHeaderCard({
  chofer,
  placa,
  fecha,
  acompanante,
  onFecha,
  onAcompanante,
}: HojaHeaderCardProps) {
  const [picker, setPicker] = useState(false);
  const isHoy = fecha === todayIso();

  const onPick = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setPicker(false);
    if (Platform.OS === "ios" && event.type === "dismissed") {
      setPicker(false);
      return;
    }
    if (event.type === "dismissed" || !date) return;
    onFecha(toIso(date));
    if (Platform.OS === "ios") setPicker(false);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Datos de la jornada</Text>

      <View style={styles.grid}>
        <Field label="Chofer" value={chofer || "—"} />
        <Field label="Placa" value={placa || "—"} />

        {Platform.OS === "web" ? (
          <View style={styles.field}>
            <Text style={styles.label}>Fecha</Text>
            <TextInput
              value={fecha}
              onChangeText={(v) => {
                if (/^\d{4}-\d{2}-\d{2}$/.test(v)) onFecha(v);
              }}
              placeholder="AAAA-MM-DD"
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.fechaInput}
            />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cambiar fecha"
            onPress={() => setPicker(true)}
            style={styles.field}
          >
            <Text style={styles.label}>Fecha{isHoy ? " · Hoy" : ""}</Text>
            <Text style={styles.value} numberOfLines={1}>
              {formatFechaLabel(fecha)}
            </Text>
          </Pressable>
        )}
      </View>

      {picker && Platform.OS !== "web" ? (
        <DateTimePicker
          value={new Date(`${fecha}T12:00:00`)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={onPick}
        />
      ) : null}

      <TextInput
        value={acompanante}
        onChangeText={onAcompanante}
        placeholder="Operador acompañante"
        placeholderTextColor={theme.colors.muted}
        style={styles.input}
      />
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.accentDeep,
    gap: 10,
  },
  title: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
  grid: {
    flexDirection: "row",
    gap: 6,
  },
  field: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  label: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  value: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  fechaInput: {
    padding: 0,
    margin: 0,
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
});
