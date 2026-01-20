import type { Action } from "@json-render/core";
import { getByPath } from "@json-render/core";
import type { ComponentRenderProps, ComponentRegistry } from "@json-render/react";
import { useData, useDataBinding } from "@json-render/react";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  type LayoutChangeEvent,
  Platform,
  Modal,
  TouchableOpacity,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

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
    <View className="bg-[#111827] border border-[#243041] rounded-xl p-3">
      <Text className="text-[#9ca3af]">Unknown component: {element.type}</Text>
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
    <View className={`bg-[#111827] border border-[#243041] rounded-xl`} style={{ padding: spacing(padding) }}>
      {!!title && <Text className="text-[#e5e7eb] font-extrabold text-base">{title}</Text>}
      {!!description && (
        <Text className="text-[#9ca3af] text-xs mt-1">{description}</Text>
      )}
      <View className={title || description ? "mt-3" : ""}>{children}</View>
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
    <View onLayout={onLayout} className="flex-row flex-wrap">
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
    <Text className="text-[#e5e7eb]" style={{ fontSize, fontWeight: 700 }}>
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
    <View className="py-1 px-2.5 rounded-full border self-flex-start" style={{ backgroundColor: background, borderColor: border }}>
      <Text className="text-[#e5e7eb] text-xs font-semibold">
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
    <View className="bg-[#111827] border rounded-xl p-3" style={{ borderColor: accent, backgroundColor: "#0f172a" }}>
      <Text className="text-[#e5e7eb] font-bold">{title}</Text>
      {!!message && <Text className="text-[#9ca3af] text-xs mt-1.5">{message}</Text>}
    </View>
  );
}

export function Divider({ element }: ComponentRenderProps) {
  const { label } = element.props as { label?: string | null };
  return (
    <View className="my-3">
      {!!label && <Text className="text-[#9ca3af] text-xs mb-2">{label}</Text>}
      <View className="h-px bg-[#243041]" />
    </View>
  );
}

export function Empty({ element }: ComponentRenderProps) {
  const { title, description } = element.props as {
    title: string;
    description?: string | null;
  };
  return (
    <View className="bg-[#111827] border border-[#243041] rounded-xl p-3 items-center">
      <Text className="text-[#e5e7eb] font-bold">{title}</Text>
      {!!description && <Text className="text-[#9ca3af] text-xs mt-1.5">{description}</Text>}
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
      <Text className="text-[#9ca3af] text-xs">{label}</Text>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        className="text-[#e5e7eb] text-[26px] font-extrabold flex-shrink"
      >
        {displayValue}
      </Text>
      {(trend || trendValue) && (
        <Text className="text-[13px] font-semibold mt-1" style={{ color: trendColor }}>
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
    return <Text className="text-[#9ca3af] text-xs">No data</Text>;
  }

  const values = chartData.map((d) => (typeof d.value === "number" ? d.value : Number(d.value)));
  const maxValue = Math.max(...values.filter((n) => Number.isFinite(n)), 1);

  return (
    <View>
      {!!title && (
        <Text className="text-[#e5e7eb] font-bold mb-2.5">
          {title}
        </Text>
      )}
      <View className="flex-row items-end" style={{ height: chartHeight }}>
        {chartData.map((d, idx) => {
          const v = values[idx] ?? 0;
          const clamped = Number.isFinite(v) ? Math.max(0, v) : 0;
          const barHeight = Math.max(4, (clamped / maxValue) * chartHeight);
          return (
          <View key={d.label} className="flex-1 items-center h-full">
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
              className="text-[#9ca3af] text-[11px] mt-1.5 max-w-[60px]"
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
      <Text className="text-[#9ca3af] text-xs">
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
        <Text className="text-[#e5e7eb] font-bold mb-2.5">
          {title}
        </Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
        <View className="min-w-[520px] flex-1">
          <View className="flex-row py-2.5 border-b border-[#243041]">
            {columns.map((col) => (
              <Text key={col.key} className="w-[140px] text-[#9ca3af] text-xs font-bold uppercase">
                {col.label}
              </Text>
            ))}
          </View>
          {tableData.map((row, idx) => (
            <View key={idx} className="flex-row py-2.5 border-b border-[#243041]">
              {columns.map((col) => (
                <Text key={col.key} className="w-[140px] text-[#e5e7eb] text-xs">
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
      className="py-2.5 px-3.5 rounded-xl border"
      style={{
        backgroundColor,
        borderColor,
        opacity,
      }}
    >
      <Text className="text-[14px] font-bold" style={{ color: textColor }}>
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
      {!!label && <Text className="text-[#9ca3af] text-xs">{label}</Text>}
      {!value && !!placeholder && (
        <Text className="text-[#9ca3af] text-xs">{placeholder}</Text>
      )}
      <View className="flex-row flex-wrap mt-2">
        {options.map((opt, idx) => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setValue(opt.value)}
              className={`mr-2 mb-2 py-2 px-2.5 rounded-xl border ${active ? "bg-[#13294b] border-[#60a5fa]" : "border-[#243041]"}`}
              style={{
                marginRight: idx % 3 === 2 ? 0 : 8,
              }}
            >
              <Text className="text-[#e5e7eb] font-semibold">
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
  const [showPicker, setShowPicker] = useState(false);

  // Parse stored value to Date object
  const parsedDate = useMemo(() => {
    if (!value) return new Date();
    try {
      return new Date(value);
    } catch {
      return new Date();
    }
  }, [value]);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (event.type === "set" && selectedDate) {
      // Format as YYYY-MM-DD
      const formatted = selectedDate.toISOString().split("T")[0];
      setValue(formatted);
    }
  };

  const displayValue = value ?? (placeholder ?? "Select date...");

  return (
    <View>
      {!!label && <Text className="text-[#9ca3af] text-xs">{label}</Text>}
      <Pressable
        onPress={() => setShowPicker(true)}
        className="bg-[#0f172a] border border-[#243041] rounded-xl py-2.5 px-3 mt-2"
      >
        <Text style={{ color: value ? color.foreground : color.muted }}>
          {displayValue}
        </Text>
      </Pressable>

      {/* Modal wrapper for iOS to prevent layout shift */}
      {Platform.OS === "ios" && showPicker && (
        <Modal
          transparent
          visible={showPicker}
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/50 justify-end"
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          >
            <View className="bg-[#111827] rounded-t-2xl pb-10 pt-5 px-5 items-center">
              <DateTimePicker
                value={parsedDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                style={{ width: 320 }}
              />
              <TouchableOpacity
                className="bg-[#e5e7eb] py-3 px-8 rounded-xl mt-4"
                onPress={() => setShowPicker(false)}
              >
                <Text className="text-[#0b0f19] font-bold text-base">Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Android: uses native dialog, no modal needed */}
      {Platform.OS === "android" && showPicker && (
        <DateTimePicker
          value={parsedDate}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
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
