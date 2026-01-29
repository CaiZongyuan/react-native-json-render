import { ActionProvider, DataProvider, Renderer, VisibilityProvider } from "@json-render/react";
import type { UITree } from "@json-render/core";
import { dashboardRegistry, UnknownComponent as DashboardUnknownComponent } from "@/src/components/dashboard/registry";
import { todolistRegistry, UnknownComponent as TodoUnknownComponent } from "@/src/components/todolist/registry";
import {
  RenderUiToolInputSchema,
  RenderUiToolOutputSchema,
  type RenderUiToolOutput,
} from "@/src/lib/chatbot/renderUiTool";
import type { UserEvent } from "@/src/lib/chatbot/userEvent";
import { createUserEvent } from "@/src/lib/chatbot/userEvent";
import { useMemo } from "react";
import { Text, View } from "react-native";

export function JsonRenderCard({
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
  const parsedOutput = useMemo(() => {
    const res = RenderUiToolOutputSchema.safeParse(output);
    return res.success ? (res.data as RenderUiToolOutput) : null;
  }, [output]);

  const parsedInput = useMemo(() => {
    if (!input || typeof input !== "object") return null;
    const res = RenderUiToolInputSchema.safeParse(input);
    return res.success ? res.data : null;
  }, [input]);

  const derived = useMemo(() => {
    const source = parsedOutput ?? parsedInput;
    if (!source) return null;
    return {
      title: source.title ?? "UI",
      registry: source.registry,
      mode: source.mode,
      expiryPolicy: source.expiryPolicy,
      tree: source.tree as unknown as UITree,
      dataSnapshot: (source.dataSnapshot ?? {}) as Record<string, unknown>,
    };
  }, [parsedInput, parsedOutput]);

  const registry = derived?.registry === "dashboard" ? dashboardRegistry : todolistRegistry;
  const fallback =
    derived?.registry === "dashboard" ? DashboardUnknownComponent : TodoUnknownComponent;

  const handlers = useMemo(() => {
    const emit = (params: Record<string, unknown>) => {
      const name = String(params.name ?? "").trim();
      if (!name) return;
      onUserEvent?.(
        createUserEvent({
          name,
          blockId,
          action: { name: "emit_user_event", params },
          dedupeKey: typeof params.dedupeKey === "string" ? params.dedupeKey : undefined,
        }),
      );
    };

    return {
      emit_user_event: emit,
      refresh_data: (params: Record<string, unknown>) => {
        onUserEvent?.(
          createUserEvent({
            name: "refresh_data",
            blockId,
            action: { name: "refresh_data", params },
          }),
        );
      },
      view_details: (params: Record<string, unknown>) => {
        onUserEvent?.(
          createUserEvent({
            name: "view_details",
            blockId,
            action: { name: "view_details", params },
          }),
        );
      },
      apply_filter: (params: Record<string, unknown>) => {
        onUserEvent?.(
          createUserEvent({
            name: "apply_filter",
            blockId,
            action: { name: "apply_filter", params },
          }),
        );
      },
    };
  }, [blockId, onUserEvent]);

  if (!derived?.tree?.root) {
    return (
      <View className="mt-2 rounded-2xl border border-[#243041] bg-[#111827] p-3">
        <Text className="text-gray-400 text-xs">
          Failed to render UI (invalid tool output).
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-2 rounded-2xl border border-[#243041] bg-[#111827] p-3">
      {!parsedOutput && (state === "input-streaming" || state === "input-available") && (
        <Text className="text-gray-400 text-xs mb-2">Building UI…</Text>
      )}
      <DataProvider initialData={derived.dataSnapshot}>
        <VisibilityProvider>
          <ActionProvider handlers={handlers}>
            <Renderer
              tree={derived.tree}
              registry={registry}
              loading={loading}
              fallback={fallback}
            />
          </ActionProvider>
        </VisibilityProvider>
      </DataProvider>
    </View>
  );
}
