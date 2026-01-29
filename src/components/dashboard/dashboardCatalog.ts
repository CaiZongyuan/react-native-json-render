import { createCatalog } from "@json-render/core";
import { z } from "zod";

export const dashboardCatalog = createCatalog({
  name: "expo-dashboard",
  components: {
    Card: {
      props: z.object({
        title: z.string().nullable(),
        description: z.string().nullable(),
        padding: z.enum(["sm", "md", "lg"]).nullable(),
      }),
      hasChildren: true,
      description: "Card container",
    },
    Grid: {
      props: z.object({
        columns: z.number().min(1).max(4).nullable(),
        gap: z.enum(["sm", "md", "lg"]).nullable(),
      }),
      hasChildren: true,
      description: "Grid layout",
    },
    Stack: {
      props: z.object({
        direction: z.enum(["horizontal", "vertical"]).nullable(),
        gap: z.enum(["sm", "md", "lg"]).nullable(),
        align: z.enum(["start", "center", "end", "stretch"]).nullable(),
      }),
      hasChildren: true,
      description: "Flex layout",
    },
    Metric: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(),
        format: z.enum(["number", "currency", "percent"]).nullable(),
        trend: z.enum(["up", "down", "neutral"]).nullable(),
        trendValue: z.string().nullable(),
      }),
      description: "Metric display",
    },
    Chart: {
      props: z.object({
        type: z.enum(["bar", "line", "pie", "area"]),
        dataPath: z.string(),
        title: z.string().nullable(),
        height: z.number().nullable(),
      }),
      description: "Chart display (simplified)",
    },
    Table: {
      props: z.object({
        title: z.string().nullable(),
        dataPath: z.string(),
        columns: z.array(
          z.object({
            key: z.string(),
            label: z.string(),
            format: z.enum(["text", "currency", "date", "badge"]).nullable(),
          }),
        ),
      }),
      description: "Table display (simplified)",
    },
    Button: {
      props: z.object({
        label: z.string(),
        variant: z.enum(["primary", "secondary", "danger", "ghost"]).nullable(),
        action: z.union([
          z.string(),
          z.object({ name: z.string(), params: z.record(z.string(), z.any()).optional() }),
        ]),
        disabled: z.boolean().nullable(),
      }),
      description: "Button that triggers an action",
    },
    Select: {
      props: z.object({
        label: z.string().nullable(),
        bindPath: z.string(),
        options: z.array(z.object({ value: z.string(), label: z.string() })),
        placeholder: z.string().nullable(),
      }),
      description: "Select input (simplified)",
    },
    DatePicker: {
      props: z.object({
        label: z.string().nullable(),
        bindPath: z.string(),
        placeholder: z.string().nullable(),
      }),
      description: "Date input (simplified)",
    },
    Heading: {
      props: z.object({
        text: z.string(),
        level: z.enum(["h1", "h2", "h3", "h4"]).nullable(),
      }),
      description: "Heading text",
    },
    Text: {
      props: z.object({
        content: z.string(),
        variant: z.enum(["body", "caption", "label"]).nullable(),
        color: z
          .enum(["default", "muted", "success", "warning", "danger"])
          .nullable(),
      }),
      description: "Text paragraph",
    },
    Badge: {
      props: z.object({
        text: z.string(),
        variant: z
          .enum(["default", "success", "warning", "danger", "info"])
          .nullable(),
      }),
      description: "Badge",
    },
    Alert: {
      props: z.object({
        type: z.enum(["info", "success", "warning", "error"]),
        title: z.string(),
        message: z.string().nullable(),
      }),
      description: "Alert banner",
    },
    Divider: {
      props: z.object({
        label: z.string().nullable(),
      }),
      description: "Divider line",
    },
    Empty: {
      props: z.object({
        title: z.string(),
        description: z.string().nullable(),
      }),
      description: "Empty state",
    },
  },
  actions: {
    refresh_data: { description: "Refresh all metrics and charts" },
    view_details: { description: "View detailed information" },
    apply_filter: { description: "Apply current filters" },
  },
  validation: "strict",
});

export const componentList = dashboardCatalog.componentNames as string[];
