export type UserEvent = {
  name: string;
  blockId: string;
  action: { name: string; params?: Record<string, unknown> };
  at: string;
  dedupeKey?: string;
};

export function createUserEvent(options: {
  name: string;
  blockId: string;
  action: { name: string; params?: Record<string, unknown> };
  dedupeKey?: string;
}): UserEvent {
  return {
    name: options.name,
    blockId: options.blockId,
    action: options.action,
    at: new Date().toISOString(),
    dedupeKey: options.dedupeKey,
  };
}

