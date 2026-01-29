import type { UITree } from "@json-render/core";
import { z } from "zod";

export const TODO_UI_TOOL_NAME = "todo_ui" as const;

export const TodoUiToolInputSchema = z.object({
  title: z.string().min(1).max(60).optional(),
  assistantMessage: z.string().min(1).max(280).optional(),
  suggestions: z.array(z.string().min(1).max(80)).max(6).optional(),
});

export type TodoUiToolInput = z.infer<typeof TodoUiToolInputSchema>;

export const TodoUiToolOutputSchema = z.object({
  title: z.string().optional(),
  assistantMessage: z.string().optional(),
  suggestions: z.array(z.string()).default([]),
  tree: z.object({
    root: z.string(),
    elements: z.record(z.string(), z.any()),
  }),
});

export type TodoUiToolOutput = Omit<
  z.infer<typeof TodoUiToolOutputSchema>,
  "tree"
> & { tree: UITree };

/**
 * Returns intelligent fallback suggestions based on keyword matching.
 * Used when AI doesn't provide specific suggestions.
 *
 * @param seed - The seed string to match against (e.g., user message or title)
 * @returns An array of contextually relevant suggestions
 */
function pickFallbackSuggestions(seed?: string): string[] {
  const s = (seed ?? "").toLowerCase();

  // Work/project scenario
  if (s.includes("work") || s.includes("project") || s.includes("meeting")) {
    return [
      "Review today's priorities",
      "Reply to important emails",
      "Prepare meeting notes",
      "Update project status",
    ];
  }

  // Shopping scenario
  if (s.includes("shopping") || s.includes("grocery") || s.includes("buy")) {
    return [
      "Buy groceries",
      "Restock essentials",
      "Plan meals for tomorrow",
      "Check pantry inventory",
    ];
  }

  // Default productivity suggestions
  return [
    "Plan the top 3 tasks",
    "Add one quick win",
    "Schedule a break",
    "Review unfinished tasks",
  ];
}

/**
 * Resolves and validates todo suggestions from tool input.
 * Falls back to intelligent suggestions if input is empty.
 *
 * @param input - The tool input containing optional suggestions array
 * @returns A cleaned array of suggestions (max 6 items)
 */
export function resolveTodoSuggestions(input: TodoUiToolInput): string[] {
  // Clean and limit suggestions from AI input
  const suggestions = (input.suggestions ?? [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  // Return AI suggestions if available, otherwise use fallback
  return suggestions.length > 0
    ? suggestions
    : pickFallbackSuggestions(input.assistantMessage ?? input.title);
}

export function buildTodoAssistantTree(options: {
  title?: string;
  assistantMessage?: string;
  suggestions: string[];
}): UITree {
  const title = options.title ?? "Todo Assistant";
  const note =
    options.assistantMessage ??
    "Here’s your todo list. Toggle items, then add from suggestions or type your own.";

  const suggestionKeys = options.suggestions.map((_, idx) => `sug_${idx}`);

  return {
    root: "root",
    elements: {
      root: {
        key: "root",
        type: "Stack",
        props: { gap: "md" },
        children: [
          "header",
          "showCompleted",
          "table",
          "suggestionsTitle",
          ...suggestionKeys,
          "newTodo",
          "actions",
        ],
      },
      header: {
        key: "header",
        type: "Title",
        props: { text: title },
      },
      showCompleted: {
        key: "showCompleted",
        type: "Checkbox",
        props: { label: "Show completed", bindPath: "/settings/showCompleted" },
      },
      table: {
        key: "table",
        type: "Table",
        props: { dataPath: "/todos", showCompletedPath: "/settings/showCompleted" },
      },
      suggestionsTitle: {
        key: "suggestionsTitle",
        type: "Text",
        props: {
          content: note,
          variant: "muted",
        },
      },
      ...Object.fromEntries(
        options.suggestions.map((text, idx) => [
          `sug_${idx}`,
          {
            key: `sug_${idx}`,
            type: "Checkbox",
            props: {
              label: text,
              bindPath: `/todoAssistant/suggestions/${idx}/selected`,
            },
          },
        ]),
      ),
      newTodo: {
        key: "newTodo",
        type: "Input",
        props: {
          label: "Add a new todo",
          bindPath: "/form/newTodo",
          placeholder: "Type and tap Add",
        },
      },
      actions: {
        key: "actions",
        type: "Stack",
        props: { gap: "sm", direction: "horizontal" },
        children: ["addSelected", "addCustom", "clearCompleted"],
      },
      addSelected: {
        key: "addSelected",
        type: "Button",
        props: { label: "Add selected", action: "todo_add_selected" },
      },
      addCustom: {
        key: "addCustom",
        type: "Button",
        props: { label: "Add", action: "todo_add_custom", variant: "secondary" },
      },
      clearCompleted: {
        key: "clearCompleted",
        type: "Button",
        props: {
          label: "Clear done",
          action: "todo_clear_completed",
          variant: "danger",
        },
      },
    },
  };
}
