import { ModuleMark } from "@/features/dashboard/components/module-mark";
import type { AppModule } from "@/features/dashboard/types";
import { theme } from "@/lib/theme";
import { type Href, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function ModuleGrid({ modules }: { modules: AppModule[] }) {
  const router = useRouter();

  return (
    <View style={styles.grid}>
      {chunk(modules, 2).map((row) => (
        <View key={row.map((item) => item.key).join("-")} style={styles.row}>
          {row.map((item) => {
            return (
              <Pressable
                key={item.key}
                onPress={() =>
                  router.push(
                    (item.params
                      ? { pathname: item.href, params: item.params }
                      : item.href) as Href,
                  )
                }
                style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
              >
                <View style={styles.head}>
                  <ModuleMark moduleKey={item.key} />
                  <View style={styles.titles}>
                    <Text style={styles.kicker}>{item.hint}</Text>
                    <Text style={styles.label}>{item.label}</Text>
                  </View>
                </View>
                <View style={styles.descWrap}>
                  {item.description.split("\n").map((line) => (
                    <Text key={line} style={styles.description}>
                      {line}
                    </Text>
                  ))}
                </View>
              </Pressable>
            );
          })}
          {row.length === 1 ? <View style={styles.spacer} /> : null}
        </View>
      ))}
    </View>
  );
}

function chunk<T>(items: T[], size: number) {
  return items.reduce<T[][]>((rows, item, index) => {
    if (index % size === 0) rows.push([item]);
    else rows[rows.length - 1]?.push(item);
    return rows;
  }, []);
}

const styles = StyleSheet.create({
  grid: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 10,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  pressed: {
    backgroundColor: theme.colors.accentSoft,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titles: {
    flex: 1,
    gap: 1,
  },
  kicker: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  label: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  descWrap: {
    marginTop: 8,
    gap: 1,
  },
  description: {
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  spacer: {
    flex: 1,
  },
});
