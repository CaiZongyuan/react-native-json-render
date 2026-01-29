import { CHATBOT_SYSTEM_PROMPT } from "@/src/lib/chatbot/systemPrompt";
import {
  buildTodoAssistantTree,
  resolveTodoSuggestions,
  TODO_UI_TOOL_NAME,
  TodoUiToolInputSchema,
} from "@/src/lib/todolist/todoAssistantTool";
import {
  RENDER_UI_TOOL_NAME,
  RenderUiToolInputSchema,
} from "@/src/lib/chatbot/renderUiTool";
import { dashboardCatalog } from "@/src/components/dashboard/dashboardCatalog";
import { todolistCatalog } from "@/src/components/todolist/todolistCatalog";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, tool, UIMessage } from "ai";
import type { DataUIPart } from "ai";

const glm = createOpenAICompatible({
  name: "glm",
  baseURL: "https://open.bigmodel.cn/api/coding/paas/v4",
  apiKey: process.env.GLM_API_KEY,
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const tools = {
    [TODO_UI_TOOL_NAME]: tool({
      description:
        "Render an interactive Todo List UI card with current todos, suggested todo items (multi-select checkboxes), and an input to add a custom todo.",
      inputSchema: TodoUiToolInputSchema,
      execute: async (input) => {
        const suggestions = resolveTodoSuggestions(input);
        return {
          title: input.title ?? "Todo Assistant",
          assistantMessage: input.assistantMessage,
          suggestions,
          tree: buildTodoAssistantTree({
            title: input.title,
            assistantMessage: input.assistantMessage,
            suggestions,
          }),
        };
      },
    }),
    [RENDER_UI_TOOL_NAME]: tool({
      description:
        "Render a generic json-render UI card inside the chat, validated by a registry-specific catalog. Use this to show interactive UI (buttons, inputs, tables) with guardrails.",
      inputSchema: RenderUiToolInputSchema,
      execute: async (input) => {
        const catalog = input.registry === "dashboard" ? dashboardCatalog : todolistCatalog;
        const validated = catalog.validateTree(input.tree);
        if (!validated.success || !validated.data) {
          throw new Error("Invalid UI tree for selected registry.");
        }

        const maxElements = 300;
        const keys = Object.keys(validated.data.elements ?? {});
        if (keys.length > maxElements) {
          throw new Error(`UI tree too large (max ${maxElements} elements).`);
        }

        return {
          title: input.title,
          registry: input.registry,
          mode: input.mode,
          expiryPolicy: input.expiryPolicy,
          tree: validated.data,
          dataSnapshot: input.dataSnapshot ?? {},
        };
      },
    }),
  } as const;

  const result = streamText({
    model: glm.chatModel("glm-4.7"),
    system: CHATBOT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages, {
      tools,
      convertDataPart: (part: DataUIPart<Record<string, unknown>>) => {
        if (part.type === "data-user_event") {
          return {
            type: "text",
            text: `USER_EVENT: ${JSON.stringify(part.data)}`,
          };
        }
        return undefined;
      },
    }),
    tools,
    providerOptions: {
      glm: {
        thinking: { type: "disabled" },
      },
    },
    onChunk: ({ chunk }) => {
      console.log("Chunk:", chunk);
    },
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "none",
    },
  });
}
