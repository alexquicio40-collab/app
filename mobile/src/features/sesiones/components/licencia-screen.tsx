import { theme } from "@/lib/theme";
import { BrandLogo } from "@/ui/brand-logo";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLicenciaGate } from "../licencia-gate";
import { getDispositivo } from "../lib/dispositivo";
import { anunciarDispositivo, consultarDispositivo } from "../lib/estado";

export function LicenciaScreen() {
  const { confirmar } = useLicenciaGate();
  const [codigo, setCodigo] = useState("");
  const [listo, setListo] = useState(false);
  const [aviso, setAviso] = useState("Esperando que un administrador lo registre…");
  const cerrado = useRef(false);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const disp = await getDispositivo();
        if (!alive) return;
        setCodigo(disp.codigo);
        const res = await anunciarDispositivo({ ...disp, plataforma: "android" }).catch(() =>
          consultarDispositivo(disp),
        );
        if (!alive || cerrado.current) return;
        if (res.autorizado) {
          cerrado.current = true;
          setListo(true);
          setAviso("Dispositivo registrado");
          setTimeout(() => {
            void confirmar();
          }, 1200);
          return;
        }
        setAviso("Esperando que un administrador lo registre…");
      } catch {
        if (alive) setAviso("Sin conexión. Se reintenta solo.");
      }
      if (alive && !cerrado.current) timer = setTimeout(() => void tick(), 2500);
    }

    void tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [confirmar]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.box}>
        <BrandLogo height={72} />
        <Text style={styles.label}>{"Código de este aparato"}</Text>
        <Text style={styles.codigo} selectable>
          {codigo || "····-····"}
        </Text>
        <Text style={styles.hint}>
          {"Actívalo una vez y listo."}
        </Text>
        <Text style={styles.hintSoft}>
          {"Tu equipo te da acceso en Sesiones y este teléfono queda habilitado para siempre."}
        </Text>
        <View style={styles.wait}>
          {listo ? null : <ActivityIndicator color={theme.colors.gold} />}
          <Text style={[styles.waitText, listo ? styles.ok : null]}>{aviso}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.accentDeep,
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  box: {
    alignItems: "center",
    gap: 16,
  },
  label: {
    marginTop: 18,
    color: "#C8E6D8",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  codigo: {
    color: "#FFFFFF",
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    lineHeight: 64,
  },
  hint: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 28,
    textAlign: "center",
    fontWeight: "800",
    paddingHorizontal: 8,
  },
  hintSoft: {
    color: "#B7D4C8",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    fontWeight: "600",
    paddingHorizontal: 12,
  },
  wait: {
    marginTop: 10,
    alignItems: "center",
    gap: 10,
  },
  waitText: {
    color: theme.colors.gold,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  ok: {
    color: "#7CFFB2",
  },
});
