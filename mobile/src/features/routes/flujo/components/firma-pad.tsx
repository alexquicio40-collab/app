import { theme } from "@/lib/theme";
import { useMemo, useRef } from "react";
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";

type Point = { x: number; y: number };

type FirmaPadProps = {
  value: string;
  onChange: (value: string) => void;
};

function parseStrokes(value: string): Point[][] {
  if (!value.trim()) return [];
  return value.split("|").map((stroke) =>
    stroke
      .split(" ")
      .map((pair) => {
        const [x, y] = pair.split(",").map(Number);
        return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
      })
      .filter((point): point is Point => point != null),
  );
}

function serialize(strokes: Point[][]) {
  return strokes
    .filter((stroke) => stroke.length > 0)
    .map((stroke) => stroke.map((point) => `${Math.round(point.x)},${Math.round(point.y)}`).join(" "))
    .join("|");
}

/** Firma con el dedo. Se guarda como trazo para enviarla con el recojo. */
export function FirmaPad({ value, onChange }: FirmaPadProps) {
  const strokes = useMemo(() => parseStrokes(value), [value]);
  const live = useRef<Point[][]>([]);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          live.current = [...parseStrokes(valueRef.current), [{ x: locationX, y: locationY }]];
          onChangeRef.current(serialize(live.current));
        },
        onPanResponderMove: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          const next = live.current.map((stroke, index) =>
            index === live.current.length - 1 ? [...stroke, { x: locationX, y: locationY }] : stroke,
          );
          live.current = next;
          onChangeRef.current(serialize(next));
        },
      }),
    [],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.pad} {...responder.panHandlers}>
        <Svg width="100%" height="100%">
          {strokes.map((stroke, index) => (
            <Polyline
              key={`${index}-${stroke.length}`}
              points={stroke.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="none"
              stroke={theme.colors.ink}
              strokeWidth={2.4}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </Svg>
        {strokes.length === 0 ? <Text style={styles.hint}>Firma del encargado</Text> : null}
      </View>
      <Pressable accessibilityRole="button" onPress={() => onChange("")} style={styles.clear}>
        <Text style={styles.clearText}>Borrar firma</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  pad: {
    height: 140,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  hint: {
    position: "absolute",
    left: 14,
    top: 58,
    color: theme.colors.muted,
    fontSize: 15,
    fontWeight: "500",
  },
  clear: { alignSelf: "flex-end", paddingVertical: 4 },
  clearText: { color: theme.colors.accent, fontSize: 14, fontWeight: "600" },
});
