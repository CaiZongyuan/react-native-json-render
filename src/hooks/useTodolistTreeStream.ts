import type { JsonPatch, UIElement, UITree } from "@json-render/core";
import { setByPath } from "@json-render/core";
import type { UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

function parsePatchLine(line: string): JsonPatch | null {
  let trimmed = line.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("```")) return null;
  if (trimmed.startsWith("//")) return null;

  if (trimmed.startsWith("data:")) {
    trimmed = trimmed.slice("data:".length).trim();
  }

  trimmed = trimmed.replace(/,+\s*$/, "");

  try {
    return JSON.parse(trimmed) as JsonPatch;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as JsonPatch;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function applyPatch(tree: UITree, patch: JsonPatch): UITree {
  const newTree: UITree = { ...tree, elements: { ...tree.elements } };

  switch (patch.op) {
    case "set":
    case "add":
    case "replace": {
      if (patch.path === "/root") {
        newTree.root = patch.value as string;
        return newTree;
      }

      if (patch.path.startsWith("/elements/")) {
        const pathParts = patch.path.slice("/elements/".length).split("/");
        const elementKey = pathParts[0];
        if (!elementKey) return newTree;

        if (pathParts.length === 1) {
          newTree.elements[elementKey] = patch.value as UIElement;
        } else {
          const element = newTree.elements[elementKey];
          if (element) {
            const propPath = "/" + pathParts.slice(1).join("/");
            const nextElement = { ...element };
            setByPath(nextElement as unknown as Record<string, unknown>, propPath, patch.value);
            newTree.elements[elementKey] = nextElement;
          }
        }
      }
      break;
    }
    case "remove": {
      if (patch.path.startsWith("/elements/")) {
        const elementKey = patch.path.slice("/elements/".length).split("/")[0];
        if (elementKey) {
          const { [elementKey]: _, ...rest } = newTree.elements;
          newTree.elements = rest;
        }
      }
      break;
    }
  }

  return newTree;
}

export type TreeStreamState = {
  tree: UITree | null;
  parseError: string | null;
  reset: () => void;
};

export function useTodolistTreeStream(messages: UIMessage[]): TreeStreamState {
  const [tree, setTree] = useState<UITree | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const currentTreeRef = useRef<UITree>({ root: "", elements: {} });
  const bufferRef = useRef<string>("");
  const processedTextLengthRef = useRef<Record<string, number>>({});

  const reset = useMemo(
    () => () => {
      currentTreeRef.current = { root: "", elements: {} };
      bufferRef.current = "";
      processedTextLengthRef.current = {};
      setParseError(null);
      setTree(null);
    },
    [],
  );

  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;

      const text = message.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("");

      const prevLen = processedTextLengthRef.current[message.id] ?? 0;
      if (text.length <= prevLen) continue;

      const delta = text.slice(prevLen);
      processedTextLengthRef.current[message.id] = text.length;

      bufferRef.current += delta;

      const lines = bufferRef.current.split("\n");
      bufferRef.current = lines.pop() ?? "";

      for (const line of lines) {
        const patch = parsePatchLine(line);
        if (!patch) continue;

        try {
          currentTreeRef.current = applyPatch(currentTreeRef.current, patch);
          setTree({ ...currentTreeRef.current });
        } catch (err) {
          setParseError(err instanceof Error ? err.message : String(err));
        }
      }

      const trailingPatch = parsePatchLine(bufferRef.current);
      if (trailingPatch) {
        try {
          currentTreeRef.current = applyPatch(currentTreeRef.current, trailingPatch);
          setTree({ ...currentTreeRef.current });
          bufferRef.current = "";
        } catch (err) {
          setParseError(err instanceof Error ? err.message : String(err));
        }
      }
    }
  }, [messages]);

  return { tree, parseError, reset };
}
