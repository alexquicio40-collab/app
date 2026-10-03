import type { ReactNode } from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type AdminIconName =
  | "drop"
  | "house"
  | "truck"
  | "cart"
  | "bars"
  | "cert"
  | "users"
  | "warn"
  | "calendar"
  | "chevron"
  | "bell"
  | "person"
  | "pin"
  | "plus"
  | "receipt"
  | "bolt"
  | "building"
  | "home"
  | "chart"
  | "map"
  | "phone"
  | "whatsapp"
  | "clock"
  | "target";

type GlyphProps = { color: string; size: number };

const stroke = {
  fill: "none" as const,
  strokeWidth: 1.7,
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

function Drop({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M12 3.4s-6.2 6.6-6.2 10.4a6.2 6.2 0 0 0 12.4 0c0-3.8-6.2-10.4-6.2-10.4z" fill={color} />
    </Frame>
  );
}

function House({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M4.2 11.2 12 4.6l7.8 6.6" stroke={color} {...stroke} />
      <Path d="M7 10.8V19h10v-8.2" stroke={color} {...stroke} />
      <Path d="M10 19v-4.4h4V19" stroke={color} {...stroke} />
    </Frame>
  );
}

function Truck({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M3 8.2h10.4v7.4H3z" stroke={color} {...stroke} />
      <Path d="M13.4 11H17l2.8 2.6v2H13.4z" stroke={color} {...stroke} />
      <Circle cx={7} cy={17.6} r={1.5} stroke={color} {...stroke} />
      <Circle cx={16.4} cy={17.6} r={1.5} stroke={color} {...stroke} />
    </Frame>
  );
}

function Cart({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M4 5h2.2l1.2 9.2h10.4l1.6-6.4H7.2" stroke={color} {...stroke} />
      <Circle cx={9.2} cy={18.2} r={1.4} fill={color} />
      <Circle cx={16.4} cy={18.2} r={1.4} fill={color} />
    </Frame>
  );
}

function Bars({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M5 18V11M10 18V6M15 18v-5M20 18V8" stroke={color} {...stroke} />
    </Frame>
  );
}

function Cert({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M7 3.8h7.2L18.4 8v12.2H7V3.8z" stroke={color} {...stroke} />
      <Path d="M14.1 3.9V8h4.1M9.2 12.2l1.8 1.8 3.6-3.8" stroke={color} {...stroke} />
    </Frame>
  );
}

function Users({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Circle cx={9} cy={8.2} r={2.6} stroke={color} {...stroke} />
      <Path d="M4.2 18.4c.5-3.2 2.4-4.6 4.8-4.6s4.3 1.4 4.8 4.6" stroke={color} {...stroke} />
      <Circle cx={16.2} cy={9} r={2.1} stroke={color} {...stroke} />
      <Path d="M14.2 18.4c.3-2.2 1.4-3.3 3.2-3.6 1.6.2 2.6 1.4 2.8 3.6" stroke={color} {...stroke} />
    </Frame>
  );
}

function Warn({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M12 4.2 21 19.2H3L12 4.2z" stroke={color} {...stroke} />
      <Path d="M12 10v4.2M12 16.6v.6" stroke={color} {...stroke} />
    </Frame>
  );
}

function Calendar({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Rect x={4} y={5.4} width={16} height={14.4} rx={2} stroke={color} {...stroke} />
      <Path d="M4 10h16M8 3.8v3.2M16 3.8v3.2" stroke={color} {...stroke} />
    </Frame>
  );
}

function Chevron({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M7 10l5 5 5-5" stroke={color} {...stroke} />
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

function Person({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Circle cx={12} cy={8} r={3} fill={color} />
      <Path d="M5.2 19.4c.8-3.4 3.3-5 6.8-5s6 1.6 6.8 5H5.2z" fill={color} />
    </Frame>
  );
}

function Pin({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" stroke={color} {...stroke} />
      <Circle cx={12} cy={11} r={2} stroke={color} {...stroke} />
    </Frame>
  );
}

function Plus({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Rect x={5} y={5} width={14} height={14} rx={3} stroke={color} {...stroke} />
      <Path d="M12 9v6M9 12h6" stroke={color} {...stroke} />
    </Frame>
  );
}

function Receipt({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M7 3.6h7.2L18 7.2v13.2l-2.2-1.2-2.2 1.2-2.2-1.2-2.2 1.2-2.2-1.2V3.6z" stroke={color} {...stroke} />
      <Path d="M10 10.4h5M10 13.6h5" stroke={color} {...stroke} />
    </Frame>
  );
}

function Bolt({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M13.2 3.4 6.4 13.2h5.2l-1 7.4 7-10.2h-5.2z" fill={color} />
    </Frame>
  );
}

function Building({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M5 20V6.2h9.2V20" stroke={color} {...stroke} />
      <Path d="M14.2 10.2H19V20" stroke={color} {...stroke} />
      <Path d="M7.6 9.2h1.8M7.6 12.4h1.8M7.6 15.6h1.8M11 20v-3.2h2.4V20" stroke={color} {...stroke} />
    </Frame>
  );
}

function Home({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M4 11.2 12 4.4l8 6.8V20H4z" stroke={color} {...stroke} />
      <Path d="M10 20v-5.2h4V20" stroke={color} {...stroke} />
    </Frame>
  );
}

function Chart({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M4.6 18.6V5.4M4.6 18.6H19.4" stroke={color} {...stroke} />
      <Path d="M8 14.4 11.4 10l3 2.6 4.4-6" stroke={color} {...stroke} />
    </Frame>
  );
}

function Phone({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path
        d="M7.2 3.8h3.2l1.2 3-1.6 1.4a10.4 10.4 0 0 0 6.8 6.8l1.4-1.6 3 1.2v3.2c0 .8-.6 1.4-1.4 1.4C10.6 19.2 4.8 13.4 4.8 5.2c0-.8.6-1.4 1.4-1.4z"
        stroke={color}
        {...stroke}
      />
    </Frame>
  );
}

function Whatsapp({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path
        d="M12 3.6A8.2 8.2 0 0 0 5.2 16.4L4.4 20.4l4.1-.8A8.2 8.2 0 1 0 12 3.6z"
        stroke={color}
        {...stroke}
      />
      <Path
        d="M9.2 9.4c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .5.4.2.6.6 1.8.6 1.8.1.2 0 .4-.1.6l-.6.7c.8 1.6 2 2.7 3.6 3.4l.8-.6c.2-.2.4-.2.6 0 .4.2 1.4.7 1.6.8.2.1.3.3.2.6-.2.6-1.1 1-1.6 1.1-.4 0-1 .1-3.2-.8-2.6-1.1-4.3-3.2-5-5.6-.2-.8-.2-1.5 0-2 .2-.5.6-1.2 1.1-1.4z"
        fill={color}
      />
    </Frame>
  );
}

function Clock({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Circle cx={12} cy={12} r={7.2} stroke={color} {...stroke} />
      <Path d="M12 8.2V12l2.8 1.8" stroke={color} {...stroke} />
    </Frame>
  );
}

function Target({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Circle cx={12} cy={12} r={7.2} stroke={color} {...stroke} />
      <Circle cx={12} cy={12} r={3.8} stroke={color} {...stroke} />
      <Circle cx={12} cy={12} r={1.4} fill={color} />
    </Frame>
  );
}

function Map({ color, size }: GlyphProps) {
  return (
    <Frame size={size}>
      <Path d="M3.4 7.2 8.4 4.6 12 7.6l3.6-3 4.8 2.6v11.2l-4.8 2.6L12 17.4l-3.6 2.6-5-2.6V7.2z" stroke={color} {...stroke} />
      <Path d="M8.4 4.6v15.4M15.6 4.6v15.4" stroke={color} {...stroke} />
    </Frame>
  );
}

const GLYPHS: Record<AdminIconName, (props: GlyphProps) => ReactNode> = {
  drop: Drop,
  house: House,
  truck: Truck,
  cart: Cart,
  bars: Bars,
  cert: Cert,
  users: Users,
  warn: Warn,
  calendar: Calendar,
  chevron: Chevron,
  bell: Bell,
  person: Person,
  pin: Pin,
  plus: Plus,
  receipt: Receipt,
  bolt: Bolt,
  building: Building,
  home: Home,
  chart: Chart,
  map: Map,
  phone: Phone,
  whatsapp: Whatsapp,
  clock: Clock,
  target: Target,
};

export function AdminIcon({ name, color, size = 16 }: { name: AdminIconName; color: string; size?: number }) {
  const Glyph = GLYPHS[name];
  if (!Glyph) return null;
  return <Glyph color={color} size={size} />;
}
