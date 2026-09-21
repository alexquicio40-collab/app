import { theme } from "@/lib/theme";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export type ReportColumn = {
  key: string;
  label: string;
  width: number;
  align?: "left" | "right" | "center";
};

type ReportTableCardProps = {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  rows: Record<string, string>[];
  emptyText?: string;
  accent?: "ink" | "accent";
};

export function ReportTableCard({
  title,
  subtitle,
  columns,
  rows,
  emptyText = "Sin datos",
  accent = "ink",
}: ReportTableCardProps) {
  const minWidth = columns.reduce((sum, col) => sum + col.width, 0);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View
          style={[
            styles.accentBar,
            { backgroundColor: accent === "accent" ? theme.colors.accent : theme.colors.info },
          ]}
        />
        <View style={styles.headCopy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {rows.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth }}>
            <View style={styles.headerRow}>
              {columns.map((col) => (
                <Text
                  key={col.key}
                  style={[
                    styles.headerCell,
                    { width: col.width, textAlign: col.align ?? "left" },
                  ]}
                  numberOfLines={1}
                >
                  {col.label}
                </Text>
              ))}
            </View>
            {rows.map((row, index) => (
              <View
                key={`${index}-${row.id ?? row.nombre ?? index}`}
                style={[styles.bodyRow, index % 2 === 1 ? styles.bodyRowAlt : null]}
              >
                {columns.map((col) => (
                  <Text
                    key={col.key}
                    style={[
                      styles.bodyCell,
                      { width: col.width, textAlign: col.align ?? "left" },
                      col.key === "nombre" || col.key === "local" || col.key === "proveedor"
                        ? styles.bodyStrong
                        : null,
                    ]}
                    numberOfLines={1}
                  >
                    {row[col.key] ?? "—"}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    gap: 10,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accentBar: {
    width: 4,
    height: 28,
    borderRadius: 2,
  },
  headCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  title: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  empty: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 8,
  },
  headerRow: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  headerCell: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    paddingHorizontal: 4,
  },
  bodyRow: {
    flexDirection: "row",
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  bodyRowAlt: {
    backgroundColor: theme.colors.cream,
  },
  bodyCell: {
    color: theme.colors.ink,
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 4,
  },
  bodyStrong: {
    fontWeight: "800",
  },
});
