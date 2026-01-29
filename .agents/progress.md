# Progress Log

## 2026-01-29
- Initialized planning files: `task_plan.md`, `findings.md`, `progress.md`.
- Audited current chatbot flow: `useChat` messages + `todo_ui` tool part rendering.
- Studied Next.js reference whitepaper + key implementation files; updated plan direction for RN MVP/V1.
- Confirmed existing Catalog support in RN repo: `src/components/dashboard/dashboardCatalog.ts` (strict Zod validation + action whitelist).
- Moved planning artifacts under `.agents/` and updated `AGENTS.md` to instruct future agents to read them.
- Added root stubs `task_plan.md`/`findings.md`/`progress.md` pointing to `.agents/` (so tooling that expects root files still works).
- Incorporated user decisions: per-action expiry semantics, snapshot UI blocks (e.g. weather), local persistence + local actions, global data source design to be finalized.
- User chose: global store with `shared + blocks[blockId]`, structured `data-*` event parts, and per-block freeze policy for todo; updated plan + noted API needs `convertDataPart`.
- Confirmed event schema; marked Phase 3 complete and started Phase 4 checklist (block-level providers + store + structured user events).
- Implemented per-block Todo UI scoping + action→`data-user_event` injection; added API `convertDataPart` so events become model-visible.
- Added generic `render_ui` tool (catalog-validated) + `JsonRenderCard` renderer; updated chatbot prompt and added `todolistCatalog` for guardrails.
- `bun run lint` currently fails in this environment: `expo lint` cannot find module `eslint` (typecheck passes).
- Fixed Metro crash on Windows caused by `.codex/skills/*` symlinks by blocking `.codex/`, `.agents/`, `.claude/` from Metro crawling (`metro.config.js`).
