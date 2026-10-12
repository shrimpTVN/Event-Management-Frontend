---
trigger: always_on
---

# Agent Instructions: React Feature-Based Architecture

## [1] Execution Workflow (Mandatory Lifecycle)
You must strictly follow this lifecycle for every feature request or technical task:

### Phase 1: Analysis & Architectural Planning
1. **Requirement Analysis:** Analyze the task against business logic, existing interfaces, and data models. 
- If the task involves UI, components, or styling, read `AGENTS.md` at the project root on demand to reference and apply the Figma design specification (color tokens, typography scales, spacing, radius).
- if the task need database schema or API information read 'docs/materials' folder to find schema.sql or api_documentations.md file
2. **Ambiguity Resolution:** If any requirements, edge cases, or dependencies are unclear, immediately halt and ask concise clarifying questions.
3. **Structured Plan:** Draft a step-by-step implementation plan detailing:
   - Target feature directory (`src/features/<feature-name>/...`).
   - UI components required (distinguish existing shadcn primitives vs. components to install/compose).
   - Files to create or modify (components, custom hooks, API calls, types).
   - State management, validation schemas (e.g., Zod), and data fetching strategies.
4. **HALT EXECUTION:** You must explicitly pause and prompt the user:
   > *"Please approve this plan before I begin implementation."*
   **Do NOT write, scaffold, or modify functional code during this phase.**

### Phase 2: Execution & Implementation
1. Proceed only after receiving explicit user confirmation.
2. Build components strictly within the planned feature boundaries.
3. Include brief inline comments explaining non-trivial business logic, side effects, or complex UI calculations.
4. Only write unit test when you are asked.


---

## [2] Workspace & File System Constraints
You have automated access to the IDE file system, subject to the following rules:

- **Creating Files:** ALLOWED automatically. Adhere strictly to the feature directory structure and naming conventions.
- **Editing Files:** ALLOWED automatically.
- **Deleting Files: STRICTLY RESTRICTED.** 
  - Never run `rm` or programmatically delete files/directories without prior approval.
  - When deletion or file movement is necessary, halt execution, explain the rationale, list the target paths, and ask for explicit confirmation.

---

## [3] Architecture, UI & Coding Standards

### 3.1 Feature-Based Directory Layout
Organize code primarily by domain/feature rather than technical layer:

```text
src/
├── assets/                  # Global static assets (images, icons, fonts)
├── components/
│   ├── ui/                  # shadcn/ui primitives (button, dialog, input, form, etc.)
│   └── common/              # Global shared layouts & components (Navbar, Footer, ErrorBoundary)
├── features/
│   └── [feature-name]/      # Encapsulated business domain (e.g., auth, checkin, certificates)
│       ├── api/             # API queries, mutations, hooks (TanStack Query, Axios, etc.)
│       ├── components/      # UI components exclusive to this feature
│       ├── hooks/           # Custom React hooks exclusive to this feature
│       ├── types/           # TypeScript interfaces, schemas, and types for this feature
│       ├── utils/           # Helper functions isolated to this feature
│       └── index.ts         # Public API entry point (export only what other modules need)
├── hooks/                   # Cross-cutting global hooks (e.g., useDebounce, useMediaQuery)
├── lib/                     # Global third-party setups & utils (e.g., `utils.ts` for cn(), axios instance)
├── types/                   # Shared system-wide TypeScript types
└── utils/                   # Shared system-wide utility functions


### 3.2 Modularity & Isolation Rules
- **Encapsulation:** Feature internals (`features/<feature-name>/components/*`) are private. External consumers (other features or app routes) must import only through the feature's public barrel file (`src/features/<feature-name>/index.ts`).
- **Dependency Inversion:** A feature must never import internal files from another feature (e.g., forbidden: `import X from '@/features/auth/components/internal/X'`).
- **Promotion Rule:** When a component, hook, or type is required across 2 or more distinct features, move it to the shared layer (`src/components/common/`, `src/hooks/`, or `src/types/`).

### 3.3 shadcn/ui & Tailwind CSS Standards
- **Component Priority:**
  - Check `@/components/ui/` first before creating any UI element.
  - Always use shadcn/ui primitives (e.g., `Button`, `Dialog`, `Sheet`, `DropdownMenu`, `Card`, `Form`) over native HTML elements (`<button>`, `<input>`, `<select>`).
  - Only write custom primitives if shadcn does not provide them and no official registry block exists.
- **Styling Rules:**
  - Style exclusively with Tailwind CSS utility classes. Avoid inline `style={{ ... }}` and custom CSS blocks unless handling external dynamic coordinates or keyframe animations.
  - Always merge conditional classes using the `cn()` utility (`clsx` + `tailwind-merge`).
  - Use theme design tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`) rather than hardcoded hex colors to preserve dark mode support.
- **TypeScript & React Standards:**
  - All props, state variables, and API responses must have explicit TypeScript types. Never use `any`.
  - Prefer functional components and standard React hooks.
  - Keep components modular: split any file exceeding ~150–200 lines into sub-components under the feature's `components/` directory.

### 3.5 Dependency & "Library-First" Standard (Do Not Reinvent the Wheel)
Before implementing custom solutions for complex, non-trivial, or common utility logic, strictly prioritize standard web APIs and established libraries:

- **Resolution Hierarchy:**
   - **Step 1 (Check Installed Dependencies):** Inspect `package.json` to verify if an already-installed package fulfills the requirement (e.g., TanStack Query for server state/cache, Zustand for client state, Lucide for icons, Radix UI for primitives).
   - **Step 2 (Evaluate Modern Native Web APIs):** Check if modern standard browser/JS APIs natively handle the task with zero bundle cost (e.g., `Intl` for localization/currency, `URLSearchParams`, `crypto.randomUUID()`).
   - **Step 3 (Evaluate Ecosystem Standard):** If neither applies, identify an industry-standard, tree-shakeable, actively maintained, and permissively licensed (MIT/Apache-2.0) library (e.g., `zod` + `react-hook-form` for complex forms, `date-fns` for date manipulation, `@tanstack/react-table` for complex tables).
   - **Step 4 (Proposal During Planning Phase):** In the Phase 1 architectural proposal, explicitly declare any new library to be added along with its rationale and bundle impact.
   - **Step 5 (Custom Implementation as Last Resort):** Only write manual code if:
     - The utility is trivial (pure logic under ~10 lines without edge-case surface area).
     - Adding an external package introduces disproportionate bundle bloat or security risks.
     - You provide explicit technical justification in the design plan or pull request.

- **Strictly Prohibited Manual Reinventions:**
   - **Date/Time Arithmetic & Timezones:** Do NOT write custom date calculations or parsing (use `date-fns`).
   - **Form State & Schema Validation:** Do NOT write custom validation engines or multi-step form state managers (use `react-hook-form` + `zod`).
   - **Accessible UI Primitives:** Do NOT build custom modals, dialogs, dropdowns, popovers, or tooltips from scratch (use shadcn / Radix UI primitives for built-in ARIA compliance and focus trapping).
   - **Data Fetching & Cache Management:** Do NOT write custom fetch wrappers with manual retry, caching, or deduplication logic (use `axios` / `ky` + `@tanstack/react-query`).
   - **Icons:** Do NOT draw inline SVGs manually (use `lucide-react`).

### [4] Context Retrieval & Codebase Navigation
- **Primary Navigation Tool:** Always prioritize semantic navigation tools (such as codegraph) to trace symbol definitions, call hierarchies, interfaces, and architecture.
- **UI & Component Discovery:**
  - Check existing shadcn components via codebase search or shadcn CLI discovery before writing new UI components.
- **Search Constraints:**
  - Avoid unstructured traversal, blind grep, or arbitrary recursive filesystem scans across `node_modules` or build directories.
  - Rely on semantic graph queries and targeted path queries.
- **Fallback Protocol:**
  - Standard text or regex searches are permitted only if semantic tools error out, time out, or need to locate unindexed, freshly created files.