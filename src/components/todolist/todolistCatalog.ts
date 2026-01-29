import { createCatalog } from "@json-render/core";
import { z } from "zod";

export const todolistCatalog = createCatalog({
  name: "expo-todolist",
  components: {
    Title: {
      props: z.object({ text: z.string() }),
      description: "Heading text",
    },
    Text: {
      props: z.object({
        content: z.string(),
        variant: z
          .enum(["default", "muted", "success", "warning", "danger"])
          .nullable(),
      }),
      description: "Paragraph text",
    },
    Table: {
      props: z.object({
        dataPath: z.string(),
        showCompletedPath: z.string().nullable().optional(),
      }),
      description: "Todo list table",
    },
    Checkbox: {
      props: z.object({
        label: z.string().nullable().optional(),
        bindPath: z.string(),
      }),
      description: "Checkbox input",
    },
    Button: {
      props: z.object({
        label: z.string(),
        variant: z.enum(["primary", "secondary", "danger"]).nullable().optional(),
        action: z.union([
          z.string(),
          z.object({ name: z.string(), params: z.record(z.string(), z.any()).optional() }),
        ]),
      }),
      description: "Action button",
    },
    Confirm: {
      props: z.object({
        label: z.string(),
        action: z.string(),
        confirm: z.object({ title: z.string(), message: z.string() }),
      }),
      description: "Button with confirmation dialog",
    },
    Waiting: {
      props: z.object({ text: z.string().nullable().optional() }),
      description: "Loading indicator (only shows when parent is loading)",
    },
    Input: {
      props: z.object({
        label: z.string().nullable().optional(),
        bindPath: z.string(),
        placeholder: z.string().nullable().optional(),
      }),
      description: "Text input field",
    },
    Stack: {
      props: z.object({
        gap: z.enum(["sm", "md", "lg"]).nullable().optional(),
        direction: z.enum(["horizontal", "vertical"]).nullable().optional(),
        align: z.enum(["start", "center", "end", "stretch"]).nullable().optional(),
      }),
      hasChildren: true,
      description: "Layout container",
    },
  },
  actions: {
    todo_add_custom: { description: "Add a custom todo from input" },
    todo_add_selected: { description: "Add selected suggestion todos" },
    todo_clear_completed: { description: "Remove completed todos" },
    emit_user_event: {
      description: "Emit a structured user event back into the chat",
      params: z.object({
        name: z.string().min(1).max(80),
        payload: z.record(z.string(), z.any()).optional(),
        dedupeKey: z.string().min(1).max(120).optional(),
      }),
    },
  },
  validation: "strict",
});

export const todolistComponentList = todolistCatalog.componentNames as string[];
