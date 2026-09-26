import { theme } from "@/lib/theme";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export type SearchableOption = {
  value: string;
  label: string;
};

type SearchableOptionSheetProps = {
  visible: boolean;
  title: string;
  options: SearchableOption[];
  value: string | null;
  allLabel?: string;
  placeholder?: string;
  onSelect: (value: string | null) => void;
  onClose: () => void;
};

export function SearchableOptionSheet({
  visible,
  title,
  options,
  value,
  allLabel = "Todos",
  placeholder = "Buscar…",
  onSelect,
  onClose,
}: SearchableOptionSheetProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((item) => item.label.toLowerCase().includes(q));
  }, [options, query]);

  const pick = (next: string | null) => {
    onSelect(next);
    setQuery("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setQuery("");
        onClose();
      }}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            setQuery("");
            onClose();
          }}
        />
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.count}>
              {filtered.length}
              {filtered.length !== options.length ? ` / ${options.length}` : ""}
            </Text>
          </View>

          <View style={styles.searchBox}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.muted}
              style={styles.search}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query ? (
              <Pressable onPress={() => setQuery("")} hitSlop={8} style={styles.clear}>
                <Text style={styles.clearGlyph}>×</Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            contentContainerStyle={styles.listBody}
          >
            <OptionRow label={allLabel} active={!value} onPress={() => pick(null)} />
            {filtered.map((item) => (
              <OptionRow
                key={item.value}
                label={item.label}
                active={value === item.value}
                onPress={() => pick(item.value)}
              />
            ))}
            {filtered.length === 0 ? (
              <Text style={styles.empty}>Sin resultados</Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function OptionRow({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.option, active ? styles.optionOn : null]}>
      <Text style={[styles.optionText, active ? styles.optionTextOn : null]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "72%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 8,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  title: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  count: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  searchBox: {
    marginHorizontal: 12,
    height: 34,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 2,
  },
  search: {
    flex: 1,
    paddingVertical: 0,
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  clear: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  clearGlyph: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 17,
  },
  list: { paddingHorizontal: 8 },
  listBody: { paddingBottom: 8 },
  option: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 9,
  },
  optionOn: {
    backgroundColor: theme.colors.accentSoft,
  },
  optionText: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  optionTextOn: {
    color: theme.colors.accent,
    fontWeight: "800",
  },
  empty: {
    paddingHorizontal: 10,
    paddingVertical: 14,
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
