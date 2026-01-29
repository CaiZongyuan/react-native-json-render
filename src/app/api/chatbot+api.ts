import { CHATBOT_SYSTEM_PROMPT } from "@/src/lib/chatbot/systemPrompt";
import {
  buildTodoAssistantTree,
  resolveTodoSuggestions,
  TODO_UI_TOOL_NAME,
  TodoUiToolInputSchema,
} from "@/src/lib/todolist/todoAssistantTool";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, tool, UIMessage } from "ai";

const glm = createOpenAICompatible({
  name: "glm",
  baseURL: "https://open.bigmodel.cn/api/coding/paas/v4",
  apiKey: process.env.GLM_API_KEY,
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: glm.chatModel("glm-4.7"),
    system: CHATBOT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: {
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
    },
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
