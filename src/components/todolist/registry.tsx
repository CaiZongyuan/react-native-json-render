import type { Action } from "@json-render/core";
import type { ComponentRenderProps, ComponentRegistry } from "@json-render/react";
import { useDataBinding, useDataValue } from "@json-render/react";
import React, { useEffect, useRef, useState } from "react";
import { Text, View, Pressable, Modal, TextInput, Animated } from "react-native";

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
      <Text className="text-[#9ca3af]">Unknown: {element.type}</Text>
    </View>
  );
}

// Title component
export function Title({ element }: ComponentRenderProps) {
  const { text } = element.props as { text: string };
  return (
    <Text className="text-[#e5e7eb] text-xl font-bold">{text}</Text>
  );
}

// Text component
export function TodoText({ element }: ComponentRenderProps) {
  const { content, variant } = element.props as {
    content: string;
    variant?: "default" | "muted" | "success" | "warning" | "danger" | null;
  };

  const textColor =
    variant === "muted"
      ? color.muted
      : variant === "success"
        ? color.success
        : variant === "warning"
          ? color.warning
          : variant === "danger"
            ? color.danger
            : color.foreground;

  return <Text style={{ color: textColor }}>{content}</Text>;
}

// Table component for todolist
export function TodoTable({ element }: ComponentRenderProps) {
  const { dataPath, showCompletedPath } = element.props as {
    dataPath: string;
    showCompletedPath?: string | null;
  };

  const normalizedDataPath = normalizePath(dataPath);
  const [todos, setTodos] = useDataBinding<Record<string, unknown>[]>(normalizedDataPath);

  const showCompleted =
    useDataValue(normalizePath(showCompletedPath ?? "/settings/showCompleted")) ?? true;

  const tableData = Array.isArray(todos) ? todos : [];
  const visibleRows = showCompleted
    ? tableData
    : tableData.filter((t) => !(t.completed as boolean | undefined));

  if (visibleRows.length === 0) {
    return <Text className="text-[#9ca3af] text-sm">No data</Text>;
  }

  return (
    <View className="border border-[#243041] rounded-xl overflow-hidden">
      {visibleRows.map((row, idx) => {
        const completed = row.completed as boolean | undefined;
        return (
          <Pressable
            key={String(row.id ?? idx)}
            onPress={() => {
              const rowId = row.id;
              const next = tableData.map((t) =>
                rowId != null && t.id === rowId
                  ? { ...t, completed: !(t.completed as boolean | undefined) }
                  : t === row
                    ? { ...t, completed: !(t.completed as boolean | undefined) }
                    : t,
              );
              setTodos(next);
            }}
            className={`py-3 px-3 ${idx !== visibleRows.length - 1 ? "border-b border-[#243041]" : ""}`}
          >
            <View className="flex-row items-start">
              <View
                className={`w-5 h-5 rounded border mr-3 items-center justify-center ${completed ? "bg-[#22c55e] border-[#22c55e]" : "border-[#243041]"}`}
              >
                {completed && <Text className="text-[#0b0f19] text-xs">✓</Text>}
              </View>
              <Text
                className={`flex-1 text-sm ${completed ? "text-[#9ca3af] line-through" : "text-[#e5e7eb]"}`}
                style={{ flexShrink: 1 }}
              >
                {String(row.text ?? "")}
              </Text>
            </View>

            <Text
              className={`text-xs mt-1 ml-8 ${completed ? "text-[#22c55e]" : "text-[#9ca3af]"}`}
            >
              {completed ? "Done" : "Pending"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Checkbox component
export function Checkbox({ element }: ComponentRenderProps) {
  const { label, bindPath } = element.props as {
    label?: string | null;
    bindPath: string;
  };

  const [value, setValue] = useDataBinding<boolean>(normalizePath(bindPath));
  const checked = Boolean(value);

  return (
    <Pressable
      onPress={() => setValue(!checked)}
      className="flex-row items-center py-2"
    >
      <View
        className={`w-5 h-5 rounded border mr-3 items-center justify-center ${checked ? "bg-[#22c55e] border-[#22c55e]" : "border-[#243041]"}`}
      >
        {checked && <Text className="text-[#0b0f19] text-xs font-bold">✓</Text>}
      </View>
      {!!label && (
        <Text className="text-[#e5e7eb] text-sm">{label}</Text>
      )}
    </Pressable>
  );
}

// Button component
export function TodoButton({ element, onAction, loading }: ComponentRenderProps) {
  const { label, variant, action } = element.props as {
    label: string;
    variant?: "primary" | "secondary" | "danger" | null;
    action: string | { name: string };
  };

  const actionObj: Action = typeof action === "string" ? { name: action } : action;

  const bgColor = variant === "danger" ? color.danger : color.foreground;
  const textColor = color.background;

  return (
    <Pressable
      onPress={() => onAction?.(actionObj)}
      disabled={loading}
      className="py-2.5 px-4 rounded-xl"
      style={{ backgroundColor: bgColor, opacity: loading ? 0.6 : 1 }}
    >
      <Text className="text-[#0b0f19] text-sm font-bold">
        {loading ? "..." : label}
      </Text>
    </Pressable>
  );
}

// Confirm dialog - handled via action
export function Confirm({ element, onAction }: ComponentRenderProps) {
  const { label, action, confirm } = element.props as {
    label: string;
    action: string;
    confirm: { title: string; message: string };
  };

  const [showDialog, setShowDialog] = useState(false);

  const handlePress = () => {
    setShowDialog(true);
  };

  const handleConfirm = () => {
    setShowDialog(false);
    onAction?.({ name: action, confirm });
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        className="py-2.5 px-4 rounded-xl border border-[#ef4444]"
      >
        <Text className="text-[#ef4444] text-sm font-bold">{label}</Text>
      </Pressable>

      {showDialog && (
        <Modal
          transparent
          visible={showDialog}
          animationType="fade"
          onRequestClose={() => setShowDialog(false)}
        >
          <Pressable
            className="flex-1 bg-black/60 justify-center items-center px-6"
            onPress={() => setShowDialog(false)}
          >
            <View
              className="bg-[#111827] border border-[#243041] rounded-2xl p-5 w-full max-w-sm"
              onStartShouldSetResponder={() => true}
            >
              <Text className="text-[#e5e7eb] text-lg font-bold mb-2">
                {confirm.title}
              </Text>
              <Text className="text-[#9ca3af] text-sm mb-5">
                {confirm.message}
              </Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowDialog(false)}
                  className="flex-1 py-3 rounded-xl border border-[#243041] items-center"
                >
                  <Text className="text-[#e5e7eb] font-bold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirm}
                  className="flex-1 py-3 rounded-xl bg-[#ef4444] items-center"
                >
                  <Text className="text-[#0b0f19] font-bold">Confirm</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

// Loading/Waiting component
export function Waiting({ element, loading }: ComponentRenderProps) {
  const { text } = element.props as { text?: string | null };
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    }
  }, [loading, spinValue]);

  if (!loading) return null;

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View className="flex-row items-center py-2">
      <Animated.View
        className="w-4 h-4 rounded-full border-2 border-[#60a5fa]"
        style={{
          borderTopColor: "transparent",
          transform: [{ rotate: spin }],
        }}
      />
      <Text className="text-[#9ca3af] text-sm ml-2">
        {text ?? "Loading..."}
      </Text>
    </View>
  );
}

// Input component
export function TodoInput({ element }: ComponentRenderProps) {
  const { label, bindPath, placeholder } = element.props as {
    label?: string | null;
    bindPath: string;
    placeholder?: string | null;
  };

  const [value, setValue] = useDataBinding<string>(normalizePath(bindPath));

  return (
    <View>
      {!!label && <Text className="text-[#9ca3af] text-xs mb-1">{label}</Text>}
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder ?? ""}
        placeholderTextColor="#9ca3af"
        className="bg-[#0f172a] border border-[#243041] rounded-xl py-2.5 px-3 text-[#e5e7eb]"
      />
    </View>
  );
}

// Stack layout
export function TodoStack({ element, children }: ComponentRenderProps) {
  const { gap, direction, align } = element.props as {
    gap?: "sm" | "md" | "lg" | null;
    direction?: "horizontal" | "vertical" | null;
    align?: "start" | "center" | "end" | "stretch" | null;
  };
  const gapSize = gap === "sm" ? 8 : gap === "lg" ? 20 : 12;
  const items = React.Children.toArray(children);
  const isRow = (direction ?? "vertical") === "horizontal";
  const alignItems =
    align === "center"
      ? "center"
      : align === "end"
        ? "flex-end"
        : align === "stretch"
          ? "stretch"
          : align === "start"
            ? "flex-start"
            : isRow
              ? "center"
              : "stretch";

  return (
    <View style={{ flexDirection: isRow ? "row" : "column", alignItems }}>
      {items.map((child, idx) => (
        <View
          key={idx}
          style={
            isRow
              ? { marginRight: idx === items.length - 1 ? 0 : gapSize }
              : { marginBottom: idx === items.length - 1 ? 0 : gapSize }
          }
        >
          {child}
        </View>
      ))}
    </View>
  );
}

export const todolistRegistry: ComponentRegistry = {
  Title,
  Text: TodoText,
  Table: TodoTable,
  Checkbox,
  Button: TodoButton,
  Confirm,
  Waiting,
  Input: TodoInput,
  Stack: TodoStack,
};
