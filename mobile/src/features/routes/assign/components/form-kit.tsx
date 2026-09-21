import { theme } from "@/lib/theme";
import { useMemo, useState, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export function PanelCard({
  title,
  subtitle,
  children,
  collapsible = false,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Si true, el cuerpo se abre/cierra como acordeón. */
  collapsible?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp ?? internalOpen;

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const toggle = () => setOpen(!open);

  if (!collapsible) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.body}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        style={styles.accordionHead}
      >
        <View style={styles.accordionCopy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && open ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.accordionIcon}>
          <Text style={styles.accordionIconText}>{open ? "−" : "+"}</Text>
        </View>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

export function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

/** Dos campos en la misma fila horizontal. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <View style={styles.fieldRow}>{children}</View>;
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  maxLength,
  secureTextEntry,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad" | "phone-pad" | "email-address" | "numeric";
  maxLength?: number;
  secureTextEntry?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.muted}
      multiline={multiline}
      keyboardType={keyboardType}
      maxLength={maxLength}
      secureTextEntry={secureTextEntry}
      style={[styles.input, multiline ? styles.inputMulti : null]}
    />
  );
}

export function SelectField({
  label,
  value,
  options,
  placeholder,
  onChange,
  searchable,
  flex,
}: {
  label: string;
  value: string | null;
  options: { value: string; label: string; hint?: string }[];
  placeholder: string;
  onChange: (value: string | null) => void;
  searchable?: boolean;
  flex?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = useMemo(
    () => options.find((item) => item.value === value)?.label ?? null,
    [options, value],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.hint ?? "").toLowerCase().includes(q),
    );
  }, [options, query]);

  return (
    <View style={[styles.field, flex ? styles.fieldFlex : null]}>
      <FieldLabel>{label}</FieldLabel>
      <Pressable
        onPress={() => {
          setQuery("");
          setOpen(true);
        }}
        style={[styles.input, styles.select]}
      >
        <Text style={[styles.selectText, !selected ? styles.placeholder : null]} numberOfLines={1}>
          {selected ?? placeholder}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            {searchable ? (
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar…"
                placeholderTextColor={theme.colors.muted}
                style={[styles.input, styles.search]}
              />
            ) : null}
            <ScrollView style={styles.sheetList}>
              <Option
                label="Ninguno"
                active={!value}
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
              />
              {filtered.map((item) => (
                <Option
                  key={item.value}
                  label={item.label}
                  hint={item.hint}
                  active={value === item.value}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Option({
  label,
  hint,
  active,
  onPress,
}: {
  label: string;
  hint?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.option, active ? styles.optionOn : null]}>
      <Text style={[styles.optionText, active ? styles.optionTextOn : null]}>{label}</Text>
      {hint ? <Text style={styles.optionHint}>{hint}</Text> : null}
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.primary, (disabled || loading) && styles.disabled]}
    >
      <Text style={styles.primaryText}>{loading ? "Guardando…" : label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.ghost}>
      <Text style={styles.ghostText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 12,
    gap: 4,
  },
  accordionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accordionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  accordionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  accordionIconText: {
    color: theme.colors.accent,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  title: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 2,
  },
  body: {
    gap: 10,
    marginTop: 2,
  },
  field: {
    gap: 4,
  },
  fieldFlex: {
    flex: 1,
    minWidth: 0,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  label: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  input: {
    minHeight: 38,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.cream,
    paddingHorizontal: 10,
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  inputMulti: {
    minHeight: 72,
    paddingTop: 8,
    textAlignVertical: "top",
  },
  select: {
    justifyContent: "center",
  },
  selectText: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  placeholder: {
    color: theme.colors.muted,
    fontWeight: "600",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,61,48,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "72%",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 8,
  },
  sheetTitle: {
    paddingHorizontal: 16,
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  search: {
    marginHorizontal: 12,
  },
  sheetList: {
    paddingHorizontal: 8,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 2,
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
  optionHint: {
    color: theme.colors.muted,
    fontSize: 11,
  },
  primary: {
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  ghost: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostText: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.55,
  },
});
