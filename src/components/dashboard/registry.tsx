import type { Action } from "@json-render/core";
import { getByPath } from "@json-render/core";
import type { ComponentRenderProps, ComponentRegistry } from "@json-render/react";
import { useData, useDataBinding } from "@json-render/react";
import React, { useMemo } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  View,
  Pressable,
  StyleSheet,
  type LayoutChangeEvent,
} from "react-native";

type Spacing = "sm" | "md" | "lg";

const spacing = (value: Spacing | null | undefined) => {
  switch (value) {
    case "sm":
      return 8;
    case "lg":
      return 20;
    case "md":
    default:
      return 12;
  }
};

const color = {
  background: "#0b0f19",
  card: "#111827",
  border: "#243041",
  foreground: "#e5e7eb",
  muted: "#9ca3af",
  danger: "#ef4444",
  success: "#22c55e",
  warning: "#f59e0b",
  info: "#60a5fa",
};

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes(".") && !trimmed.includes("/")) {
    return "/" + trimmed.split(".").filter(Boolean).join("/");
  }
  return trimmed;
}

export function UnknownComponent({ element }: ComponentRenderProps) {
  return (
    <View style={[styles.card, { borderColor: color.border }]}>
      <Text style={{ color: color.muted }}>Unknown component: {element.type}</Text>
    </View>
  );
}

export function Card({ element, children }: ComponentRenderProps) {
  const { title, description, padding } = element.props as {
    title?: string | null;
    description?: string | null;
    padding?: Spacing | null;
  };

  return (
    <View style={[styles.card, { padding: spacing(padding) }]}>
      {!!title && <Text style={styles.cardTitle}>{title}</Text>}
      {!!description && (
        <Text style={[styles.mutedText, { marginTop: 4 }]}>{description}</Text>
      )}
      <View style={{ marginTop: title || description ? 12 : 0 }}>{children}</View>
    </View>
  );
}

export function Grid({ element, children }: ComponentRenderProps) {
  const { columns, gap } = element.props as {
    columns?: number | null;
    gap?: Spacing | null;
  };

  const gapPx = spacing(gap);
  const items = React.Children.toArray(children);
  const [containerWidth, setContainerWidth] = React.useState<number>(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (Number.isFinite(w) && w > 0 && w !== containerWidth) {
      setContainerWidth(w);
    }
  };

  const requestedCols = Math.max(1, Math.min(4, columns ?? 2));
  const cols =
    containerWidth > 0 && requestedCols > 2 && containerWidth < 360
      ? 2
      : containerWidth > 0 && requestedCols > 1 && containerWidth < 260
        ? 1
        : requestedCols;

  const itemWidth =
    containerWidth > 0
      ? (containerWidth - gapPx * (cols - 1)) / cols
      : undefined;

  return (
    <View onLayout={onLayout} style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {items.map((child, idx) => {
        const isEndOfRow = idx % cols === cols - 1;
        return (
          <View
            key={idx}
            style={{
              width: itemWidth,
              marginRight: isEndOfRow ? 0 : gapPx,
              marginBottom: gapPx,
              alignSelf: "stretch",
            }}
          >
            {child}
          </View>
        );
      })}
    </View>
  );
}

export function Stack({ element, children }: ComponentRenderProps) {
  const { direction, gap, align } = element.props as {
    direction?: "horizontal" | "vertical" | null;
    gap?: Spacing | null;
    align?: "start" | "center" | "end" | "stretch" | null;
  };

  const isRow = (direction ?? "vertical") === "horizontal";
  const gapPx = spacing(gap);
  const items = React.Children.toArray(children);

  const alignItems =
    align === "center"
      ? "center"
      : align === "end"
        ? "flex-end"
        : align === "stretch"
          ? "stretch"
          : "flex-start";

  return (
    <View style={{ flexDirection: isRow ? "row" : "column", alignItems }}>
      {items.map((child, idx) => (
        <View
          key={idx}
          style={
            isRow
              ? { marginRight: idx === items.length - 1 ? 0 : gapPx }
              : { marginBottom: idx === items.length - 1 ? 0 : gapPx }
          }
        >
          {child}
        </View>
      ))}
    </View>
  );
}

export function Heading({ element }: ComponentRenderProps) {
  const { text, level } = element.props as {
    text: string;
    level?: "h1" | "h2" | "h3" | "h4" | null;
  };

  const fontSize =
    level === "h1"
      ? 28
      : level === "h2"
        ? 22
        : level === "h4"
          ? 16
          : 18;

  return (
    <Text style={{ color: color.foreground, fontSize, fontWeight: 700 }}>
      {text}
    </Text>
  );
}

export function TextBlock({ element }: ComponentRenderProps) {
  const { content, variant, color: variantColor } = element.props as {
    content: string;
    variant?: "body" | "caption" | "label" | null;
    color?: "default" | "muted" | "success" | "warning" | "danger" | null;
  };

  const fontSize = variant === "caption" ? 12 : variant === "label" ? 13 : 14;
  const textColor =
    variantColor === "muted"
      ? color.muted
      : variantColor === "success"
        ? color.success
        : variantColor === "warning"
          ? color.warning
          : variantColor === "danger"
            ? color.danger
            : color.foreground;

  return <Text style={{ color: textColor, fontSize }}>{content}</Text>;
}

export function Badge({ element }: ComponentRenderProps) {
  const { text, variant } = element.props as {
    text: string;
    variant?: "default" | "success" | "warning" | "danger" | "info" | null;
  };

  const background =
    variant === "success"
      ? "#12361f"
      : variant === "warning"
        ? "#3a2a12"
        : variant === "danger"
          ? "#3a1414"
          : variant === "info"
            ? "#152a46"
            : "#1f2937";

  const border =
    variant === "success"
      ? "#1b5a30"
      : variant === "warning"
        ? "#6b4b17"
        : variant === "danger"
          ? "#7f1d1d"
          : variant === "info"
            ? "#1d4ed8"
            : color.border;

  return (
    <View style={[styles.badge, { backgroundColor: background, borderColor: border }]}>
      <Text style={{ color: color.foreground, fontSize: 12, fontWeight: 600 }}>
        {text}
      </Text>
    </View>
  );
}

export function Alert({ element }: ComponentRenderProps) {
  const { type, title, message } = element.props as {
    type: "info" | "success" | "warning" | "error";
    title: string;
    message?: string | null;
  };

  const accent =
    type === "success"
      ? color.success
      : type === "warning"
        ? color.warning
        : type === "error"
          ? color.danger
          : color.info;

  return (
    <View style={[styles.card, { borderColor: accent, backgroundColor: "#0f172a" }]}>
      <Text style={{ color: color.foreground, fontWeight: 700 }}>{title}</Text>
      {!!message && <Text style={[styles.mutedText, { marginTop: 6 }]}>{message}</Text>}
    </View>
  );
}

export function Divider({ element }: ComponentRenderProps) {
  const { label } = element.props as { label?: string | null };
  return (
    <View style={{ marginVertical: 12 }}>
      {!!label && <Text style={[styles.mutedText, { marginBottom: 8 }]}>{label}</Text>}
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: color.border }} />
    </View>
  );
}

export function Empty({ element }: ComponentRenderProps) {
  const { title, description } = element.props as {
    title: string;
    description?: string | null;
  };
  return (
    <View style={[styles.card, { alignItems: "center" }]}>
      <Text style={{ color: color.foreground, fontWeight: 700 }}>{title}</Text>
      {!!description && <Text style={[styles.mutedText, { marginTop: 6 }]}>{description}</Text>}
    </View>
  );
}

export function Metric({ element }: ComponentRenderProps) {
  const { label, valuePath, format, trend, trendValue } = element.props as {
    label: string;
    valuePath: string;
    format?: "number" | "currency" | "percent" | null;
    trend?: "up" | "down" | "neutral" | null;
    trendValue?: string | null;
  };

  const { data } = useData();
  const rawValue = getByPath(data, normalizePath(valuePath));

  const displayValue = useMemo(() => {
    if (rawValue === null || rawValue === undefined) return "-";
    if (typeof rawValue !== "number") return String(rawValue);
    try {
      if (format === "currency") {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(rawValue);
      }
      if (format === "percent") {
        return new Intl.NumberFormat("en-US", {
          style: "percent",
          minimumFractionDigits: 1,
        }).format(rawValue);
      }
      if (format === "number") {
        return new Intl.NumberFormat("en-US").format(rawValue);
      }
    } catch {
      return String(rawValue);
    }
    return String(rawValue);
  }, [rawValue, format]);

  const trendColor =
    trend === "up" ? color.success : trend === "down" ? color.danger : color.muted;

  return (
    <View>
      <Text style={styles.mutedText}>{label}</Text>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{
          color: color.foreground,
          fontSize: 26,
          fontWeight: 800,
          flexShrink: 1,
        }}
      >
        {displayValue}
      </Text>
      {(trend || trendValue) && (
        <Text style={{ color: trendColor, fontSize: 13, fontWeight: 600, marginTop: 4 }}>
          {trendValue ?? ""}
        </Text>
      )}
    </View>
  );
}

export function Chart({ element }: ComponentRenderProps) {
  const { title, dataPath, height } = element.props as {
    title?: string | null;
    dataPath: string;
    height?: number | null;
  };

  const { data } = useData();
  const chartData = getByPath(data, normalizePath(dataPath)) as
    | { label: string; value: number }[]
    | undefined;

  const chartHeight = Math.max(80, Math.min(200, height ?? 120));

  if (!Array.isArray(chartData) || chartData.length === 0) {
    return <Text style={styles.mutedText}>No data</Text>;
  }

  const values = chartData.map((d) => (typeof d.value === "number" ? d.value : Number(d.value)));
  const maxValue = Math.max(...values.filter((n) => Number.isFinite(n)), 1);

  return (
    <View>
      {!!title && (
        <Text style={{ color: color.foreground, fontWeight: 700, marginBottom: 10 }}>
          {title}
        </Text>
      )}
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: chartHeight }}>
        {chartData.map((d, idx) => {
          const v = values[idx] ?? 0;
          const clamped = Number.isFinite(v) ? Math.max(0, v) : 0;
          const barHeight = Math.max(4, (clamped / maxValue) * chartHeight);
          return (
          <View key={d.label} style={{ flex: 1, alignItems: "center", height: "100%" }}>
            <View
              style={{
                width: "70%",
                height: barHeight,
                backgroundColor: color.info,
                borderRadius: 6,
              }}
            />
            <Text
              numberOfLines={1}
              style={[styles.mutedText, { fontSize: 11, marginTop: 6, maxWidth: 60 }]}
            >
              {d.label}
            </Text>
          </View>
        );
        })}
      </View>
    </View>
  );
}

export function Table({ element }: ComponentRenderProps) {
  const { title, dataPath, columns } = element.props as {
    title?: string | null;
    dataPath: string;
    columns: { key: string; label: string; format?: string | null }[];
  };

  const { data } = useData();
  const normalizedDataPath = normalizePath(dataPath);
  const tableData = getByPath(data, normalizedDataPath) as
    | Record<string, unknown>[]
    | undefined;

  if (!Array.isArray(tableData) || tableData.length === 0) {
    return (
      <Text style={styles.mutedText}>
        No data ({normalizedDataPath})
      </Text>
    );
  }

  const formatCell = (value: unknown, format?: string | null) => {
    if (value === null || value === undefined) return "-";
    if (format === "currency" && typeof value === "number") {
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value);
      } catch {
        return String(value);
      }
    }
    if (format === "date" && typeof value === "string") {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    }
    return String(value);
  };

  return (
    <View>
      {!!title && (
        <Text style={{ color: color.foreground, fontWeight: 700, marginBottom: 10 }}>
          {title}
        </Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
        <View style={{ minWidth: 520, flexGrow: 1 }}>
          <View style={styles.tableHeaderRow}>
            {columns.map((col) => (
              <Text key={col.key} style={styles.tableHeaderCell}>
                {col.label}
              </Text>
            ))}
          </View>
          {tableData.map((row, idx) => (
            <View key={idx} style={styles.tableRow}>
              {columns.map((col) => (
                <Text key={col.key} style={styles.tableCell}>
                  {formatCell(row[col.key], col.format)}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function Button({ element, onAction, loading }: ComponentRenderProps) {
  const { label, variant, action, disabled } = element.props as {
    label: string;
    variant?: "primary" | "secondary" | "danger" | "ghost" | null;
    action: string | { name: string };
    disabled?: boolean | null;
  };

  const actionObj: Action = typeof action === "string" ? { name: action } : action;

  const backgroundColor =
    variant === "danger"
      ? color.danger
      : variant === "secondary"
        ? "transparent"
        : variant === "ghost"
          ? "transparent"
          : color.foreground;

  const borderColor = variant === "secondary" ? color.border : "transparent";
  const textColor =
    variant === "secondary" || variant === "ghost" ? color.foreground : color.background;

  const opacity = disabled || loading ? 0.6 : 1;

  return (
    <Pressable
      onPress={() => {
        if (disabled || loading) return;
        onAction?.(actionObj);
      }}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor,
        borderWidth: 1,
        borderColor,
        opacity,
      }}
    >
      <Text style={{ color: textColor, fontWeight: 700, fontSize: 14 }}>
        {loading ? "Loading..." : label}
      </Text>
    </Pressable>
  );
}

export function Select({ element }: ComponentRenderProps) {
  const { label, bindPath, options, placeholder } = element.props as {
    label?: string | null;
    bindPath: string;
    options: { value: string; label: string }[];
    placeholder?: string | null;
  };

  const [value, setValue] = useDataBinding<string>(normalizePath(bindPath));

  return (
    <View>
      {!!label && <Text style={styles.mutedText}>{label}</Text>}
      {!value && !!placeholder && (
        <Text style={[styles.mutedText, { fontSize: 12 }]}>{placeholder}</Text>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
        {options.map((opt, idx) => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setValue(opt.value)}
              style={{
                marginRight: idx % 3 === 2 ? 0 : 8,
                marginBottom: 8,
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: active ? color.info : color.border,
                backgroundColor: active ? "#13294b" : "transparent",
              }}
            >
              <Text style={{ color: color.foreground, fontWeight: 600 }}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function DatePicker({ element }: ComponentRenderProps) {
  const { label, bindPath, placeholder } = element.props as {
    label?: string | null;
    bindPath: string;
    placeholder?: string | null;
  };

  const [value, setValue] = useDataBinding<string>(normalizePath(bindPath));

  return (
    <View>
      {!!label && <Text style={styles.mutedText}>{label}</Text>}
      <TextInput
        value={value ?? ""}
        onChangeText={setValue}
        placeholder={placeholder ?? "YYYY-MM-DD"}
        placeholderTextColor={color.muted}
        style={[styles.input, { marginTop: 8 }]}
      />
    </View>
  );
}

export const dashboardRegistry: ComponentRegistry = {
  Card,
  Grid,
  Stack,
  Metric,
  Chart,
  Table,
  Button,
  Select,
  DatePicker,
  Heading,
  Text: TextBlock,
  Badge,
  Alert,
  Divider,
  Empty,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 14,
    padding: 12,
  },
  cardTitle: {
    color: color.foreground,
    fontWeight: 800,
    fontSize: 16,
  },
  mutedText: {
    color: color.muted,
    fontSize: 13,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  tableHeaderRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  tableHeaderCell: {
    width: 140,
    color: color.muted,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  tableCell: {
    width: 140,
    color: color.foreground,
    fontSize: 13,
  },
  input: {
    backgroundColor: "#0f172a",
    borderColor: color.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: color.foreground,
  },
});
