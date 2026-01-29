import {
  TodoUiToolOutputSchema,
  type TodoUiToolOutput,
} from "@/src/lib/todolist/todoAssistantTool";
import {
  buildTodoAssistantTree,
  resolveTodoSuggestions,
  TodoUiToolInputSchema,
} from "@/src/lib/todolist/todoAssistantTool";
import {
  todolistRegistry,
  UnknownComponent,
} from "@/src/components/todolist/registry";
import { Renderer, useData } from "@json-render/react";
import { useEffect, useMemo } from "react";
import { Text, View } from "react-native";

function isSuggestionsShape(
  value: unknown,
): value is Array<{ text?: unknown; selected?: unknown }> {
  return Array.isArray(value);
}

export function TodoAssistantCard({
  state,
  input,
  output,
  loading,
}: {
  state: string;
  input?: unknown;
  output?: unknown;
  loading?: boolean;
}) {
  const { get, set } = useData();

  const parsedOutput = useMemo(() => {
    const res = TodoUiToolOutputSchema.safeParse(output);
    return res.success ? (res.data as TodoUiToolOutput) : null;
  }, [output]);

  const parsedInput = useMemo(() => {
    if (!input || typeof input !== "object") return null;
    const res = TodoUiToolInputSchema.safeParse(input);
    return res.success ? res.data : null;
  }, [input]);

  const derived = useMemo(() => {
    if (parsedOutput) {
      return {
        title: parsedOutput.title ?? "Todo Assistant",
        suggestions: parsedOutput.suggestions ?? [],
        tree: parsedOutput.tree,
      };
    }

    const suggestions =
      parsedInput ? resolveTodoSuggestions(parsedInput) : [];

    return {
      title: parsedInput?.title ?? "Todo Assistant",
      suggestions,
      tree: buildTodoAssistantTree({
        title: parsedInput?.title,
        assistantMessage: parsedInput?.assistantMessage,
        suggestions,
      }),
    };
  }, [parsedOutput, parsedInput]);

  useEffect(() => {
    const incoming = derived.suggestions ?? [];
    if (incoming.length === 0) return;

    const existing = get("/todoAssistant/suggestions");
    const existingTexts =
      isSuggestionsShape(existing) ? existing.map((s) => String(s.text ?? "")) : [];

    const isSame =
      existingTexts.length === incoming.length &&
      existingTexts.every((t, i) => t === incoming[i]);

    if (!isSame) {
      set(
        "/todoAssistant/suggestions",
        incoming.map((text) => ({ text, selected: false })),
      );
    }
  }, [derived.suggestions, get, set]);

  if (!derived.tree?.root) {
    return (
      <View className="mt-2 rounded-2xl border border-[#243041] bg-[#111827] p-3">
        <Text className="text-gray-400 text-xs">
          Failed to render todo UI (invalid tool output).
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-2 rounded-2xl border border-[#243041] bg-[#111827] p-3">
      {!parsedOutput && (state === "input-streaming" || state === "input-available") && (
        <Text className="text-gray-400 text-xs mb-2">
          Building todo UI…
        </Text>
      )}
      <Renderer
        tree={derived.tree}
        registry={todolistRegistry}
        loading={loading}
        fallback={UnknownComponent}
      />
    </View>
  );
}
