---
name: figma-to-components
description: Use when given a Figma URL, file key, or node ID and asked to inspect designs via Figma MCP, decompose UI into React components, or decide on component and library choices for a Figma design.
---

# Figma to React Components via MCP

Inspect Figma design trees via the Figma MCP server, decompose into a React component hierarchy mapped to the project's feature-based architecture, and resolve library choices before writing code.

> **If this is a new feature** (not just implementing an existing design spec), consult the `brainstorming` skill first.

## When to Use

- User provides a Figma URL, file key, or node ID to implement
- User asks to "read this UI from Figma", "convert this Figma screen", or "implement this design"
- Agent needs to extract layout, spacing, colors, or assets from Figma

---

## Prerequisites (Check Before Every Run)

### Dependency Check
Verify `package.json` for these libraries. If any are missing, propose `npm install` before proceeding:

| Library | Purpose |
|---------|---------|
| `react-hook-form` | Form state management |
| `zod` | Schema validation |
| `date-fns` | Date formatting & arithmetic |

### shadcn Check
If `components.json` does not exist at project root:
1. Run `npx shadcn@latest init` first
2. Install needed primitives: `npx shadcn@latest add <component>`

If `src/components/ui/` exists but a specific primitive is missing, run `npx shadcn@latest add <component>`.

---

## Phase 1: Figma MCP Ingestion

### 1.1 Parse the URL
- **File Key**: Alphanumeric string after `/design/` or `/file/` — e.g., `figma.com/design/AbCdEf12345/...` → `fileKey: "AbCdEf12345"`
- **Node ID**: From `node-id=<id>` query param. Decode `%3A` → `:`, `-` → `:`. Instance paths like `I5666:180910;1:10515` are a single node ID.

### 1.2 Fetch Design Tree
```json
{ "ServerName": "figma", "ToolName": "get_figma_data",
  "Arguments": { "fileKey": "<key>", "nodeId": "<id>" } }
```
Do NOT set `depth` unless specifically requested.

### 1.3 Download Assets (if needed)
For custom illustrations or brand assets (not Lucide-available icons):
```json
{ "ServerName": "figma", "ToolName": "download_figma_images",
  "Arguments": { "fileKey": "<key>", "localPath": "<relative-path>",
    "nodes": [{ "nodeId": "<id>", "fileName": "asset.svg" }] } }
```

> **Important:** `localPath` is relative to the MCP server's `--image-dir` flag (defaults to the IDE application directory, NOT the project root). Verify where files are saved and copy to `src/assets/` if needed. Consider setting `--image-dir` to the project root in your MCP config.

---

## Phase 2: Component Decomposition

Analyze the fetched hierarchy and group into atomic tiers:

| Layer | Examples | Placement |
|---|---|---|
| **Atom** | Button, Badge, Input, Avatar | `src/components/ui/` (shadcn) |
| **Molecule** | SearchInput, EventDatePill | Feature or common component |
| **Organism** | EventCard, FilterSidebar | `src/features/<feature>/components/` |
| **Template** | EventsPage, DashboardPage | `src/pages/<PageName>.tsx` |

### Placement Decision Tree
```
Component already exists in src/?
  YES → Re-use; do NOT recreate.
  NO  → shadcn/ui or installed package provides it?
          YES → src/components/ui/<component>.tsx
          NO  → Needed in 2+ features?
                  YES → src/components/common/<Name>.tsx
                  NO  → src/features/<feature>/components/<Name>.tsx
                         Export via src/features/<feature>/index.ts
```

> **Actual project conventions:** Existing shared components live in `src/components/layout/` (Navbar, Footer, PageShell) and `src/components/auth/`. New cross-feature components should use `src/components/common/`.

---

## Phase 3: Library & Primitives Resolution

Consult the **Library-First Standard (Section 3.5 of agent-rules)**:

### State Management

| Need | Library | Location |
|---|---|---|
| Server state / API cache | `@tanstack/react-query` + `axios` | `src/features/<feature>/services/` (follow existing convention; some features use `api/`) |
| Global client state | `zustand` | `src/store/` (root) or `src/features/<feature>/store/` |
| Form inputs & validation | `react-hook-form` + `zod` | Schema in `src/features/<feature>/types/` |
| Local UI state | `useState` / `useReducer` | Inline in component |

### Date & Time
**Mandatory:** `date-fns` (`format`, `parseISO`, `isAfter`). Never write manual `Date` arithmetic or regex date parsers.

### Component Resolution

| Element | Strategy |
|---|---|
| Buttons, Inputs, Badges | shadcn: `src/components/ui/` |
| Modals, Drawers, Dropdowns | shadcn: `Dialog`, `Sheet`, `DropdownMenu` |
| Icons | `lucide-react` — never inline SVGs |
| Domain organisms | Manual composition in `src/features/<feature>/components/` |

---

## Phase 4: Pre-Implementation Output

Before writing code, produce this structure for user approval:

```
## Figma UI Decomposition: <Screen Name>
### 1. Source — fileKey, nodeId, top-level container
### 2. Component Inventory — table: Component | Layer | Source | Path | EXISTS/NEW
### 3. Library Decisions — server data, forms, dates, icons, client state
### 4. Design Token Mapping — Figma values → Tailwind semantic classes
### 5. Files to Create (NEW) — checklist
### 6. Files to Review/Modify (EXISTS) — checklist
```
> **HALT:** "Please approve this plan before I begin implementation."

---

## Common Rationalizations

| Shortcut | Counter-measure |
|---|---|
| Writing `<button>` instead of shadcn `Button` | Always import from `@/components/ui/button` |
| Manual date formatting with `toLocaleDateString()` | Always use `date-fns` |
| Inline `<svg>` for icons | Use `lucide-react` |
| Custom form validation logic | Use `react-hook-form` + `zod` schema |
| Skipping existing component check | Search `src/` first; mark `EXISTS` or `NEW` |
