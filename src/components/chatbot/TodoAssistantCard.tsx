import {
  TodoUiToolOutputSchema,
  type TodoUiToolOutput,
} from "@/src/lib/todolist/todoAssistantTool";
import {
  buildTodoAssistantTree,
  resolveTodoSuggestions,
  TodoUiToolInputSchema,
} from "@/src/lib/todolist/todoAssistantTool";
import type { UITree } from "@json-render/core";
import {
  todolistRegistry,
  UnknownComponent,
} from "@/src/components/todolist/registry";
import { ActionProvider, Renderer, useData } from "@json-render/react";
import { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import { createUserEvent, type UserEvent } from "@/src/lib/chatbot/userEvent";

function isSuggestionsShape(
  value: unknown,
): value is { text?: unknown; selected?: unknown }[] {
  return Array.isArray(value);
}

export function TodoAssistantCard({
  blockId,
  state,
  input,
  output,
  loading,
  onUserEvent,
}: {
  blockId: string;
  state: string;
  input?: unknown;
  output?: unknown;
  loading?: boolean;
  onUserEvent?: (event: UserEvent) => void;
}) {
  const { get, set } = useData();

  const blockPath = useMemo(() => `/blocks/${blockId}`, [blockId]);

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

  const scopedTree = useMemo((): UITree | null => {
    if (!derived.tree) return null;

    const scopePath = (path: string): string => {
      if (!path || typeof path !== "string" || !path.startsWith("/")) return path;
      if (path.startsWith("/todoAssistant/") || path === "/todoAssistant") {
        return `${blockPath}${path}`;
      }
      if (path.startsWith("/form/") || path === "/form") {
        return `${blockPath}${path}`;
      }
      return path;
    };

    const patchElementProps = (
      props: Record<string, unknown> | undefined,
    ): Record<string, unknown> => {
      const next: Record<string, unknown> = { ...(props ?? {}) };

      for (const key of ["bindPath", "dataPath", "showCompletedPath", "valuePath"]) {
        if (typeof next[key] === "string") {
          next[key] = scopePath(next[key] as string);
        }
      }
      return next;
    };

    return {
      root: derived.tree.root,
      elements: Object.fromEntries(
        Object.entries(derived.tree.elements ?? {}).map(([key, el]) => [
          key,
          {
            ...el,
            props: patchElementProps(
              (el as { props?: Record<string, unknown> }).props,
            ),
          },
        ]),
      ),
    };
  }, [blockPath, derived.tree]);

  useEffect(() => {
    const incoming = derived.suggestions ?? [];
    if (incoming.length === 0) return;

    const existing = get(`${blockPath}/todoAssistant/suggestions`);
    const existingTexts =
      isSuggestionsShape(existing) ? existing.map((s) => String(s.text ?? "")) : [];

    const isSame =
      existingTexts.length === incoming.length &&
      existingTexts.every((t, i) => t === incoming[i]);

    if (!isSame) {
      set(
        `${blockPath}/todoAssistant/suggestions`,
        incoming.map((text) => ({ text, selected: false })),
      );
    }
  }, [blockPath, derived.suggestions, get, set]);

  if (!scopedTree?.root) {
    return (
      <View className="mt-2 rounded-2xl border border-[#243041] bg-[#111827] p-3">
        <Text className="text-gray-400 text-xs">
          Failed to render todo UI (invalid tool output).
        </Text>
      </View>
    );
  }

  const ACTION_HANDLERS = useMemo(
    () => ({
      todo_add_custom: () => {
        const text = String(get(`${blockPath}/form/newTodo`) ?? "").trim();
        if (!text) return;

        const currentTodos = (get("/todos") as unknown[]) ?? [];
        const next = [
          ...currentTodos,
          { id: String(Date.now()), text, completed: false },
        ];

        set("/todos", next);
        set(`${blockPath}/form/newTodo`, "");

        onUserEvent?.(
          createUserEvent({
            name: "todo_add_custom",
            blockId,
            action: { name: "todo_add_custom", params: { text } },
          }),
        );
      },
      todo_add_selected: () => {
        const suggestions = (get(`${blockPath}/todoAssistant/suggestions`) ??
          []) as unknown[];

        const selectedTexts = suggestions
          .filter((s) => Boolean((s as { selected?: unknown }).selected))
          .map((s) => String((s as { text?: unknown }).text ?? "").trim())
          .filter(Boolean);

        if (selectedTexts.length === 0) return;

        const currentTodos = (get("/todos") as unknown[]) ?? [];
        const existing = new Set(
          currentTodos.map((t) =>
            String((t as { text?: unknown }).text ?? "").toLowerCase(),
          ),
        );

        const additions = selectedTexts
          .filter((t) => !existing.has(t.toLowerCase()))
          .map((t, i) => ({
            id: `${Date.now()}-${i}`,
            text: t,
            completed: false,
          }));

        set("/todos", [...currentTodos, ...additions]);
        set(
          `${blockPath}/todoAssistant/suggestions`,
          suggestions.map((s) => ({
            ...(s as Record<string, unknown>),
            selected: false,
          })),
        );

        onUserEvent?.(
          createUserEvent({
            name: "todo_add_selected",
            blockId,
            action: { name: "todo_add_selected", params: { items: selectedTexts } },
          }),
        );
      },
      todo_clear_completed: () => {
        const currentTodos = (get("/todos") as unknown[]) ?? [];
        const next = currentTodos.filter(
          (t) => !Boolean((t as { completed?: unknown }).completed),
        );
        set("/todos", next);

        onUserEvent?.(
          createUserEvent({
            name: "todo_clear_completed",
            blockId,
            action: { name: "todo_clear_completed" },
          }),
        );
      },
    }),
    [blockId, blockPath, get, onUserEvent, set],
  );

  return (
    <View className="mt-2 rounded-2xl border border-[#243041] bg-[#111827] p-3">
      {!parsedOutput && (state === "input-streaming" || state === "input-available") && (
        <Text className="text-gray-400 text-xs mb-2">
          Building todo UI…
        </Text>
      )}
      <ActionProvider handlers={ACTION_HANDLERS}>
        <Renderer
          tree={scopedTree}
          registry={todolistRegistry}
          loading={loading}
          fallback={UnknownComponent}
        />
      </ActionProvider>
    </View>
  );
}
