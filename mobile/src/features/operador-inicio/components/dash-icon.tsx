import Svg, { Circle, Path, Rect } from "react-native-svg";
import type { ReactNode } from "react";

export type IconName =
  | "book"
  | "calendar"
  | "chevron"
  | "house"
  | "drop"
  | "route"
  | "clock"
  | "truck"
  | "barrel"
  | "play"
  | "pin"
  | "map"
  | "list"
  | "clipboard"
  | "camera"
  | "receipt"
  | "bell"
  | "leaf"
  | "person";

type GlyphProps = { color: string; size: number };

const stroke = {
  fill: "none" as const,
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Frame({ size, children }: { size: number; children: ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {children}
    </Svg>
  );
}

function Book({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path
        d="M12 6.4v11.4M12 6.4C10.2 5.2 7.4 5 4.6 5.8v10.6c2.8-.6 5.4-.2 7.4 1.4M12 6.4c1.8-1.2 4.6-1.4 7.4-.6v10.6c-2.8-.6-5.4-.2-7.4 1.4"
        stroke={color}
        {...stroke}
      />
    </Frame>
  );
}

function Calendar({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Rect x={4} y={5.5} width={16} height={14.5} rx={2} stroke={color} {...stroke} />
      <Path d="M4 10h16M8 3.8v3.2M16 3.8v3.2" stroke={color} {...stroke} />
    </Frame>
  );
}

function Chevron({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M9 6.5 15 12l-6 5.5" stroke={color} {...stroke} />
    </Frame>
  );
}

function House({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M4.5 11.2 12 4.8l7.5 6.4" stroke={color} {...stroke} />
      <Path d="M7 10.6V19h10v-8.4" stroke={color} {...stroke} />
      <Path d="M10.2 19v-4.6h3.6V19" stroke={color} {...stroke} />
    </Frame>
  );
}

function Drop({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M12 3.2s-6 6.4-6 10.2a6 6 0 0 0 12 0c0-3.8-6-10.2-6-10.2z" fill={color} />
    </Frame>
  );
}

function Route({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Circle cx={6.8} cy={16.4} r={2.3} fill={color} />
      <Circle cx={17.2} cy={7.4} r={2.3} fill={color} />
      <Path d="M8.8 15.2c2.2-.4 2.6-6.4 6.2-6.8" stroke={color} {...stroke} />
    </Frame>
  );
}

function Clock({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Circle cx={12} cy={12} r={7.4} stroke={color} {...stroke} />
      <Path d="M12 8.2V12l2.8 2" stroke={color} {...stroke} />
    </Frame>
  );
}

function Truck({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M3 8.5h10.2v7.2H3z" stroke={color} {...stroke} />
      <Path d="M13.2 11.2H17l2.8 2.6v1.9h-6.6v-4.5z" stroke={color} {...stroke} />
      <Circle cx={7} cy={17.6} r={1.6} stroke={color} {...stroke} />
      <Circle cx={16.4} cy={17.6} r={1.6} stroke={color} {...stroke} />
    </Frame>
  );
}

function Barrel({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M8 7.2c0-1.3 1.8-2.2 4-2.2s4 .9 4 2.2v9.2c0 1.3-1.8 2.2-4 2.2s-4-.9-4-2.2V7.2z" stroke={color} {...stroke} />
      <Path d="M8 7.2c0 1.3 1.8 2.2 4 2.2s4-.9 4-2.2M8 12.2c0 1.1 1.8 1.8 4 1.8s4-.7 4-1.8" stroke={color} {...stroke} />
    </Frame>
  );
}

function Play({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M8.2 6.2v11.6L18.2 12 8.2 6.2z" fill={color} />
    </Frame>
  );
}

function Pin({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z"
        stroke={color}
        {...stroke}
      />
      <Circle cx={12} cy={11} r={2} stroke={color} {...stroke} />
    </Frame>
  );
}

function Map({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M3.2 7.2 8.2 4.6 12 7.6l3.8-3 4.8 2.6v11.2l-4.8 2.6L12 17.4l-3.8 2.6L3.2 17.4V7.2z" stroke={color} {...stroke} />
      <Path d="M8.2 4.6v15.4M15.8 4.6v15.4" stroke={color} {...stroke} />
    </Frame>
  );
}

function List({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Rect x={6} y={3.5} width={12} height={17} rx={2} stroke={color} {...stroke} />
      <Path d="M9 8.2h6M9 12h6M9 15.8h4" stroke={color} {...stroke} />
    </Frame>
  );
}

function Clipboard({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Rect x={5.5} y={5} width={13} height={15} rx={2} stroke={color} {...stroke} />
      <Path d="M9 5.2V4.2h6v1M9 10h6M9 13.5h6M9 17h4" stroke={color} {...stroke} />
    </Frame>
  );
}

function Camera({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M8.6 7.2 9.8 5h4.4l1.2 2.2H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.2a2 2 0 0 1 2-2h3.6z" stroke={color} {...stroke} />
      <Circle cx={12} cy={13.2} r={3} stroke={color} {...stroke} />
    </Frame>
  );
}

function Receipt({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M7 3.5h7.2L18 7v13.5H7V3.5z" stroke={color} {...stroke} />
      <Path d="M14 3.8V7.2H18M10 11h5M10 14.2h5M10 17.2h3" stroke={color} {...stroke} />
    </Frame>
  );
}

function Bell({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M6.2 16.2h11.6l-1.2-1.6V10a4.6 4.6 0 0 0-9.2 0v4.6l-1.2 1.6z" stroke={color} {...stroke} />
      <Path d="M10 16.6a2 2 0 0 0 4 0" stroke={color} {...stroke} />
    </Frame>
  );
}

function Leaf({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M5 18.5C5 10 12 4 19.5 4 19.5 12 13.5 18.5 5 18.5z" fill={color} />
      <Path d="M8.2 15.2C11 12.2 14 9 17.2 6.4" stroke="#0E7A40" strokeWidth={1.3} strokeLinecap="round" />
    </Frame>
  );
}

function Person({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Circle cx={12} cy={8} r={3.1} fill={color} />
      <Path d="M5.2 19.6c.9-3.5 3.4-5.1 6.8-5.1s5.9 1.6 6.8 5.1H5.2z" fill={color} />
    </Frame>
  );
}

const GLYPHS: Record<IconName, (props: GlyphProps) => ReactNode> = {
  book: Book,
  calendar: Calendar,
  chevron: Chevron,
  house: House,
  drop: Drop,
  route: Route,
  clock: Clock,
  truck: Truck,
  barrel: Barrel,
  play: Play,
  pin: Pin,
  map: Map,
  list: List,
  clipboard: Clipboard,
  camera: Camera,
  receipt: Receipt,
  bell: Bell,
  leaf: Leaf,
  person: Person,
};

export function DashIcon({ name, color, size = 18 }: { name: IconName; color: string; size?: number }) {
  const Glyph = GLYPHS[name];
  return <Glyph color={color} size={size} />;
}
