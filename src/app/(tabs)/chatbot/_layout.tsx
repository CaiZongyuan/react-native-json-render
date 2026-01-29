import { Slot } from "expo-router";
import { INITIAL_DATA } from "@/src/lib/todolist/initialData";
import { ActionProvider, DataProvider, VisibilityProvider, useData } from "@json-render/react";
import { useMemo, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

type TodoData = typeof INITIAL_DATA & {
  todoAssistant?: { suggestions?: { text: string; selected?: boolean }[] };
};

function InnerLayout() {
  const { data, update } = useData();
  const typedData = data as TodoData;

  const todosRef = useRef(typedData.todos ?? []);
  const newTodoRef = useRef(typedData.form?.newTodo ?? "");
  const suggestionsRef = useRef(typedData.todoAssistant?.suggestions ?? []);

  todosRef.current = typedData.todos ?? [];
  newTodoRef.current = typedData.form?.newTodo ?? "";
  suggestionsRef.current = typedData.todoAssistant?.suggestions ?? [];

  const ACTION_HANDLERS = useMemo(
    () => ({
      todo_add_custom: () => {
        const text = newTodoRef.current.trim();
        if (!text) return;

        const next = [
          ...todosRef.current,
          { id: String(Date.now()), text, completed: false },
        ];

        update({
          "/todos": next,
          "/form/newTodo": "",
        });
      },
      todo_add_selected: () => {
        const selectedTexts = (suggestionsRef.current ?? [])
          .filter((s) => Boolean(s.selected))
          .map((s) => s.text)
          .map((s) => s.trim())
          .filter(Boolean);

        if (selectedTexts.length === 0) return;

        const existing = new Set(
          (todosRef.current ?? []).map((t) => String(t.text ?? "").toLowerCase()),
        );

        const additions = selectedTexts
          .filter((t) => !existing.has(t.toLowerCase()))
          .map((t, i) => ({
            id: `${Date.now()}-${i}`,
            text: t,
            completed: false,
          }));

        const next = [...todosRef.current, ...additions];

        update({
          "/todos": next,
          "/todoAssistant/suggestions": (suggestionsRef.current ?? []).map((s) => ({
            ...s,
            selected: false,
          })),
        });
      },
      todo_clear_completed: () => {
        const next = (todosRef.current ?? []).filter((t) => !t.completed);
        update({ "/todos": next });
      },
    }),
    [update],
  );

  return (
    <VisibilityProvider>
      <ActionProvider handlers={ACTION_HANDLERS}>
        <Slot />
      </ActionProvider>
    </VisibilityProvider>
  );
}

export default function Layout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0f19" }}>
      <DataProvider initialData={INITIAL_DATA}>
        <InnerLayout />
      </DataProvider>
    </SafeAreaView>
  );
}
