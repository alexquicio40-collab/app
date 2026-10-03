import { theme } from "@/lib/theme";
import { type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ACCIONES_FILTRO, MODULOS_FILTRO, PERIODOS_FILTRO } from "../lib/labels";
import type { BitacoraFiltros, BitacoraPeriodo } from "../types";

type Props = {
  filtros: BitacoraFiltros;
  onPeriodo: (periodo: BitacoraPeriodo) => void;
  onAccion: (accion: string | null) => void;
  onModulo: (modulo: string | null) => void;
  onQ: (q: string) => void;
};

export function BitacoraFilters({ filtros, onPeriodo, onAccion, onModulo, onQ }: Props) {
  return (
    <View style={styles.wrap}>
      <Block title="Periodo">
        {PERIODOS_FILTRO.map((item) => (
          <Chip
            key={item.key}
            label={item.label}
            on={filtros.periodo === item.key}
            onPress={() => onPeriodo(item.key)}
          />
        ))}
      </Block>
      <Block title="Acción">
        {ACCIONES_FILTRO.map((item) => (
          <Chip
            key={item.key || "all-a"}
            label={item.label}
            on={(filtros.accion || "") === item.key}
            onPress={() => onAccion(item.key || null)}
          />
        ))}
      </Block>
      <Block title="Módulo">
        {MODULOS_FILTRO.map((item) => (
          <Chip
            key={item.key || "all-m"}
            label={item.label}
            on={(filtros.modulo || "") === item.key}
            onPress={() => onModulo(item.key || null)}
          />
        ))}
      </Block>
      <TextInput
        value={filtros.q}
        onChangeText={onQ}
        placeholder="Buscar usuario, IP o movimiento"
        placeholderTextColor={theme.colors.muted}
        style={styles.search}
      />
    </View>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.block}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.scroll}
      >
        {children}
      </ScrollView>
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on ? styles.chipOn : null]}>
      <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, paddingTop: 6, paddingBottom: 2 },
  block: { flexDirection: "row", alignItems: "center", minHeight: 28 },
  title: {
    width: 54,
    marginLeft: 10,
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  scroll: { flex: 1 },
  row: { gap: 4, paddingRight: 10 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
  },
  chipOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.muted, fontSize: 10, fontWeight: "800" },
  chipTextOn: { color: "#FFFFFF" },
  search: {
    marginHorizontal: 10,
    marginTop: 2,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: theme.colors.ink,
  },
});
