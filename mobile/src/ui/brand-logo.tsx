import { Image, type ImageStyle, type StyleProp, View } from "react-native";

const SOURCE = require("../../assets/images/logo-bioclim.png");
const RATIO = 376 / 277;

type BrandLogoProps = {
  height?: number;
  plated?: boolean;
  style?: StyleProp<ImageStyle>;
};

export function BrandLogo({ height = 40, plated = false, style }: BrandLogoProps) {
  const image = (
    <Image
      accessibilityLabel="BIO CLIM"
      source={SOURCE}
      resizeMode="contain"
      style={[{ width: Math.round(height * RATIO), height }, style]}
    />
  );
  if (!plated) return image;
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: Math.max(8, Math.round(height * 0.28)),
        paddingHorizontal: Math.round(height * 0.18),
        paddingVertical: Math.round(height * 0.1),
      }}
    >
      {image}
    </View>
  );
}
