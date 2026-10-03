import { AdminIcon } from "@/features/gerencia-dia/components/admin-icon";
import { theme } from "@/lib/theme";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";

type LocalPortadaProps = {
  uri?: string | null;
  size?: number;
  radius?: number;
  fallbackColor?: string;
  fallbackIconColor?: string;
};

export function LocalPortada({
  uri,
  size = 40,
  radius = 10,
  fallbackColor = theme.colors.cream,
  fallbackIconColor = theme.colors.muted,
}: LocalPortadaProps) {
  const [broken, setBroken] = useState(false);
  const show = Boolean(uri) && !broken;

  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: radius, backgroundColor: fallbackColor }]}>
      {show ? (
        <Image
          source={{ uri: uri! }}
          style={[styles.img, { borderRadius: radius }]}
          onError={() => setBroken(true)}
        />
      ) : (
        <AdminIcon name="building" color={fallbackIconColor} size={Math.round(size * 0.42)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  img: {
    width: "100%",
    height: "100%",
  },
});
