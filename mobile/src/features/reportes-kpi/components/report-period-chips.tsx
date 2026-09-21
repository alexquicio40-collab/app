import type { ReportPeriodo } from "@/features/reportes-kpi/types";
import { theme } from "@/lib/theme";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const PERIODOS: { key: ReportPeriodo; label: string }[] = [
  { key: "dia", label: "Día" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
  { key: "personalizado", label: "Personalizado" },
];

type ReportPeriodChipsProps = {
  value: ReportPeriodo;
  onChange: (periodo: ReportPeriodo) => void;
};

export function ReportPeriodChips({ value, onChange }: ReportPeriodChipsProps) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {PERIODOS.map((item) => {
          const on = item.key === value;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => onChange(item.key)}
              style={[styles.chip, on ? styles.chipOn : null]}
            >
              <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 10,
    marginTop: 8,
  },
  row: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
  },
  chipOn: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  chipText: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  chipTextOn: {
    color: theme.colors.accent,
  },
});
