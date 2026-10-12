---
name: image-to-components
description: Use when given a UI image, screenshot, or mockup and asked to build, scaffold, or plan React components. Triggers before implementing any screen from a visual reference.
---

# Image to React Components

Decompose a UI image into a structured component hierarchy mapped to this project's feature-based architecture before writing any code.

## When to Use

- Agent receives any image (PNG, JPG, Figma export) and must implement it in React
- User says "build this screen", "implement this design", or shares a mockup
- Required before implementing any screen from `docs/design/images/`

**Do NOT skip this skill** when working from visuals — the decomposition step prevents placing components in wrong feature directories.

---

## Phase 1: Visual Analysis (Read the Image)

Locate the exact image path first by running `find docs/design/images/ -type f` (filenames may have leading spaces or unexpected casing). Then call `view_file` on the exact path returned — never assume the path from `README.md` is verbatim correct. Then systematically scan:

1. **Identify Zones** — mentally divide the screen into layout regions:
   - Navigation (header, sidebar, breadcrumb)
   - Content area (lists, grids, detail panels)
   - Overlays (modals, drawers, tooltips)
   - Actions (buttons, FABs, toolbars)
   - Status / feedback (toasts, banners, empty states)

2. **List Every Distinct UI Element** — even small ones (badges, avatars, dividers). Nothing is too small to name.

3. **Group into Atomic Layers:**

| Layer | Description | Examples |
|-------|-------------|---------|
| **Atom** | Single-purpose, no children | Badge, Avatar, Icon, Label, Button |
| **Molecule** | 2-3 atoms with one clear job | SearchBar, FilterChip, StatCard |
| **Organism** | Multiple molecules forming a section | EventCard, SidebarNav, UserHeaderBar |
| **Template** | Full page layout wiring organisms | StudentHomePage, EventDetailPage |

---

## Phase 2: Component Classification

For **each component** identified in Phase 1, apply this decision tree:

```
Does this component already exist in src/?
  YES → Mark as "EXISTS — review/verify" in Phase 3 output; do NOT recreate it
  NO  → Does shadcn/ui already provide this primitive?
          YES → Use src/components/ui/<component> (Button, Dialog, Card, Badge, Input...)
          NO  → Is it used in 2+ distinct features?
                  YES → src/components/common/<ComponentName>.tsx
                  NO  → Which single feature owns it?
                         → src/features/<feature-name>/components/<ComponentName>.tsx
```

**Pre-check step:** Before assigning a path, run a quick codebase search (`find src/ -name "<ComponentName>.tsx"`) to detect existing files. Mark each result as **EXISTS** or **NEW** in the Component Inventory table.

### Feature Ownership Guide

| Visual Content | Feature Directory |
|---------------|-------------------|
| Login, register, password reset | `auth` |
| Event listings, event detail, event card | `events` |
| Registration form, registration status | `registration` |
| Check-in QR, scan interface | `check-in` |
| Certificate download, certificate display | `certificates` |
| Admin approval, content moderation | `moderation` |
| Header, Footer, Navbar (all pages) | `components/common/` |

---

## Phase 3: Structured Output Format

After analysis, produce this exact output structure before any code:

```
## Component Decomposition: <Screen Name>

### Visual Zones
- Zone 1: <name> — <brief description>
- Zone 2: <name> — <brief description>
...

### Component Tree
<TemplateName>
├── <OrganismA>                      → src/features/<feature>/components/
│   ├── <MoleculeA>                  → shadcn: <Card> / custom
│   │   ├── <AtomA>                  → shadcn: <Badge>
│   │   └── <AtomB>                  → shadcn: <Button>
│   └── <MoleculeB>                  → src/features/<feature>/components/
└── <OrganismB>                      → src/components/common/

### Component Inventory

| Component | Type | Source | Path |
|-----------|------|--------|------|
| EventCard | Organism | Custom | `src/features/events/components/EventCard.tsx` |
| StatusBadge | Atom | shadcn Badge | `src/components/ui/badge.tsx` |
| SidebarNav | Organism | Common | `src/components/common/SidebarNav.tsx` |
| ... | ... | ... | ... |

### Design Token Mapping

| Visual Property | Token | Tailwind Class |
|----------------|-------|----------------|
| Primary button bg | `action/primary` | `bg-primary` |
| Card background | `background/subtle` | `bg-card` |
| Muted text | `text/muted` | `text-muted-foreground` |
| Card border | `border/divider` | `border-border` |
| Card radius | `radius/large` | `rounded-xl` |

### Files to Create (NEW)
- [ ] `src/features/<feature>/components/<Name>.tsx` — new
- [ ] `src/features/<feature>/index.ts` — add export for new component
- [ ] `src/components/common/<Name>.tsx` — new (if shared across 2+ features)

### Files to Review / Modify (EXISTS)
- [ ] `src/features/<feature>/components/<ExistingName>.tsx` — verify matches current design
- [ ] `src/pages/<PageName>.tsx` — wire up template layout
```

---

## Phase 4: Design Token Audit

Cross-check every visual style against [`design-rules.md`](../../rules/design-rules.md):

- **Colors** → Never use raw hex. Map to semantic tokens: `bg-primary`, `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`
- **Spacing** → Always `gap-*` / `p-*` matching the spacing scale (4px=`gap-1`, 8px=`gap-2`, 16px=`gap-4`, 24px=`gap-6`)
- **Radius** → Cards/modals: `rounded-xl`; buttons/inputs: `rounded-md`; badges: `rounded-sm`
- **Typography** → Map headings to `text-3xl font-bold`, body to `text-sm`, metadata to `text-xs text-muted-foreground`
- **Custom data-viz (SVG/canvas)** → Use CSS variables from the theme (`var(--primary)`, `var(--muted-foreground)`) as `stroke` / `fill` values in inline SVG. Never hardcode hex in SVG attributes. For circular gauges, use `stroke-dasharray` / `stroke-dashoffset` with `stroke: hsl(var(--primary))`.
- **Missing semantic tokens** → If a required state (e.g., `status/success`) has no token in `design-rules.md`, note it explicitly in the decomposition output as a gap rather than falling back to raw color.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Building a Button from scratch | Check `src/components/ui/button.tsx` first |
| Not checking if a component already exists | Always run `find src/ -name "<Name>.tsx"` before creating; mark as EXISTS or NEW |
| Putting an auth form inside `events/` | Follow the Feature Ownership Guide above |
| Skipping barrel export in `index.ts` | Every new feature component MUST be exported from `src/features/<name>/index.ts` |
| Using `style={{ color: '#1B4B8A' }}` | Use `text-primary` or `bg-primary` Tailwind class |
| Hardcoding hex in SVG attributes | Use `stroke: hsl(var(--primary))` with CSS variables |
| Falling back to raw color when token is missing | Flag the missing token as a design-rules gap instead |
| Importing across feature internals | Forbidden — use the feature's `index.ts` barrel only |
| Creating a shared component for a one-feature thing | Only promote to `common/` when used in 2+ features |
| Mixing CREATE and REVIEW in the Files list | Separate into "Files to Create (NEW)" and "Files to Review/Modify (EXISTS)" |
| Skipping this skill when an image is provided | Do NOT begin coding until decomposition is complete and user acknowledges |

---

## Quick shadcn Primitive Checklist

Before creating any atom-level component, verify:

- Text input → `Input`
- Dropdown/select → `Select` or `DropdownMenu`
- Modal/dialog → `Dialog` or `Sheet`
- Alert/notification → `Alert` or use `sonner` toast
- Status pill → `Badge`
- Container card → `Card`, `CardHeader`, `CardContent`, `CardFooter`
- List item row → `Table` or compose with `Card`
- Loading state → `Skeleton`
- Icon button → `Button` variant `ghost` + Lucide icon

See [shadcn skill](../shadcn/SKILL.md) for component discovery commands.

---

## Reference Images

All design screens for this project live in `docs/design/images/`. Check `docs/design/README.md` for the index of screens and their descriptions.

> **Why no static example here:** a written example would go stale as designs change. Always apply the 4-phase process against the actual live image — the process itself is the example.
