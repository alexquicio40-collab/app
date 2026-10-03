import { dash } from "@/features/operador-inicio/palette";
import type { AvisoRuta } from "@/features/operador-inicio/types";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AvisosSheetProps = {
  open: boolean;
  avisos: AvisoRuta[];
  onClose: () => void;
};

export function AvisosSheet({ open, avisos, onClose }: AvisosSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Cerrar avisos" style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Pendientes de hoy</Text>
          <Text style={styles.sub}>
            {avisos.length === 0
              ? "No hay locales pendientes."
              : `${avisos.length} local${avisos.length === 1 ? "" : "es"} por atender`}
          </Text>
          <ScrollView contentContainerStyle={styles.list}>
            {avisos.length === 0 ? (
              <Text style={styles.empty}>Cuando te asignen una parada, aparece aquí.</Text>
            ) : (
              avisos.map((item) => (
                <View key={item.id} style={styles.item}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.titulo}
                  </Text>
                  {item.detalle ? (
                    <Text style={styles.itemDetail} numberOfLines={2}>
                      {item.detalle}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(10, 24, 18, 0.45)",
  },
  dismiss: {
    flex: 1,
  },
  sheet: {
    maxHeight: "70%",
    backgroundColor: dash.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 4,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 99,
    backgroundColor: dash.line,
    marginBottom: 8,
  },
  title: {
    color: dash.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  sub: {
    color: dash.muted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  list: {
    gap: 8,
    paddingBottom: 8,
  },
  item: {
    borderWidth: 1,
    borderColor: dash.line,
    borderRadius: 14,
    padding: 12,
    gap: 3,
    backgroundColor: "#F8FBF9",
  },
  itemTitle: {
    color: dash.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  itemDetail: {
    color: dash.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  empty: {
    color: dash.muted,
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 12,
  },
});
