import type { DataModel, UITree } from "@json-render/core";
import { z } from "zod";

export const RENDER_UI_TOOL_NAME = "render_ui" as const;

const RegistryKindSchema = z.enum(["todolist", "dashboard"]);
export type RegistryKind = z.infer<typeof RegistryKindSchema>;

const ModeSchema = z.enum(["live", "snapshot"]);
export type RenderUiMode = z.infer<typeof ModeSchema>;

export const RenderUiToolInputSchema = z.object({
  title: z.string().min(1).max(60).optional(),
  registry: RegistryKindSchema,
  mode: ModeSchema.optional().default("snapshot"),
  tree: z.object({
    root: z.string(),
    elements: z.record(z.string(), z.any()),
  }),
  dataSnapshot: z.record(z.string(), z.any()).optional(),
  expiryPolicy: z
    .union([
      z.literal("none"),
      z.literal("after_next_assistant"),
      z.literal("after_consumed"),
      z.object({ ttlMs: z.number().int().positive() }),
    ])
    .optional()
    .default("none"),
});

export type RenderUiToolInput = Omit<
  z.infer<typeof RenderUiToolInputSchema>,
  "tree" | "dataSnapshot"
> & { tree: UITree; dataSnapshot?: DataModel };

export const RenderUiToolOutputSchema = RenderUiToolInputSchema;
export type RenderUiToolOutput = RenderUiToolInput;

