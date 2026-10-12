# Design System Guidelines (Figma Specification)

This rule establishes the design constraints, color tokens, typography scales, spacing, radius, and layout guidelines derived from the Figma Design System.

---

## 1. Color System (Màu sắc)

### Base Palettes (Ramps 50-900)
- **Blue (Brand Primary)**:
  - `50`: `#EFF5FC` (Ice Blue / Tint)
  - `100`: `#DBEAFE`
  - `200`: `#BFDBFE`
  - `300`: `#93C5FD`
  - `400`: `#60A5FA`
  - `500`: `#3B82F6`
  - `600`: `#1B4B8A` (Brand Action Primary)
  - `700`: `#1E40AF`
  - `800`: `#1E3A8A`
  - `900`: `#0B1626` (Text Brand / Deep Navy)
- **Cyan (Secondary / Accents)**:
  - `50` to `900`: Used for informational badges, highlight chips, subtle secondary indicators.
- **Yellow (Status Warning)**:
  - `50` (`#FEFCE8` / Subtle warning background) to `600` (`#D97706` / Pending status badge & icons).
- **Red (Status Danger / Destructive)**:
  - `50` (`#FEF2F2` / Subtle danger background) to `600` (`#DC2626` / Rejection, error, critical action).

### Semantic Tokens (Mapped to CSS Variables)

| Token | Light Mode (HEX / HSL) | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| `action/primary` (`--primary`) | `#1B4B8A` (`214 67% 32%`) | `#3B82F6` (`217 91% 60%`) | Primary button, active tabs, main CTA |
| `primary-foreground` | `#FFFFFF` (`0 0% 100%`) | `#FFFFFF` (`0 0% 100%`) | Text on primary button |
| `text/brand` (`--foreground`) | `#0B1626` (`216 55% 10%`) | `#F8FAFC` (`210 40% 98%`) | Main text, headings, prominent labels |
| `text/muted` (`--muted-foreground`)| `#5B6675` (`216 12% 41%`) | `#94A3B8` (`215 16% 65%`) | Secondary descriptions, timestamps, metadata |
| `background/base` (`--background`)| `#FFFFFF` (`0 0% 100%`) | `#0B1626` (`216 55% 10%`) | Main page canvas background |
| `background/subtle` (`--card`) | `#F9FAFB` (`210 20% 98%`) | `#132238` (`216 48% 15%`) | Card background, container panels |
| `background/brand-subtle` | `#EFF5FC` (`212 77% 96%`) | `#162E4F` (`215 56% 20%`) | Highlight badge, category pill, soft card tint |
| `border/divider` (`--border`) | `#E5E7EB` (`220 13% 91%`) | `#1E293B` (`215 28% 17%`) | Separators, card borders, table dividers |
| `status/warning` | `#D97706` (`38 92% 50%`) | `#F59E0B` (`38 92% 50%`) | "Chờ duyệt", pending badges |
| `status/danger` | `#DC2626` (`0 84% 60%`) | `#EF4444` (`0 84% 60%`) | "Từ chối", cancellation, errors |
| `status/success` | `#16A34A` (`142 71% 45%`) | `#22C55E` (`142 71% 45%`) | Completed criteria, confirmed events, success states |

---

## 2. Typography Hierarchy

Primary Font: `Inter`, `Roboto`, system sans-serif.

### Desktop Scale
- **Display**: `font-bold text-4xl` (`36px - 40px`, leading: `1.2`)
- **H1**: `font-bold text-3xl` (`28px - 32px`, leading: `1.25`)
- **H2**: `font-semibold text-2xl` (`24px`, leading: `1.3`)
- **H3**: `font-semibold text-xl` (`20px`, leading: `1.35`)
- **H4**: `font-semibold text-base` (`16px`, leading: `1.4`)

### Mobile Scale
- **Display**: `font-bold text-3xl` (`28px - 30px`)
- **H1**: `font-bold text-2xl` (`24px`)
- **H2**: `font-semibold text-xl` (`20px`)
- **H3**: `font-semibold text-base` (`16px`)
- **H4**: `font-semibold text-sm` (`14px`)

### Common Scale
- **Body L**: `text-base` (`16px`, leading: `1.5`, regular) — Main content, guidance
- **Body M**: `text-sm` (`14px`, leading: `1.5`, regular) — Card descriptions, summaries
- **Body S**: `text-xs` (`12px`, leading: `1.4`, regular) — Time, location, metadata
- **Label**: `text-sm font-medium` (`14px`, medium / semibold) — Form field labels
- **Caption**: `text-xs italic text-muted-foreground` (`12px`) — Subtext, helper notes
- **Button Text**: `text-sm md:text-base font-semibold` (`14px - 16px`) — CTAs

---

## 3. Spacing & Radius Rules

### Spacing Scale
- `spacing/4`: `4px` (`gap-1`, `p-1`)
- `spacing/8`: `8px` (`gap-2`, `p-2`)
- `spacing/12`: `12px` (`gap-3`, `p-3`)
- `spacing/16`: `16px` (`gap-4`, `p-4`)
- `spacing/20`: `20px` (`gap-5`, `p-5`)
- `spacing/24`: `24px` (`gap-6`, `p-6`)
- `spacing/32`: `32px` (`gap-8`, `p-8`)
- `spacing/48`: `48px` (`gap-12`, `p-12`)
- `spacing/64`: `64px` (`gap-16`, `p-16`)

*Note: Always use flexbox/grid gaps (`flex flex-col gap-4`) instead of `space-y-*` or `space-x-*`.*

### Radius Scale
- `radius/small`: `4px` (`rounded-sm`) — Mini badges, inner inputs
- `radius/medium`: `8px` (`rounded-md` / `rounded-lg`) — Buttons, dropdowns, inputs
- `radius/large`: `12px` (`rounded-xl`) — Event cards, dialog modals, container panels

---

## 4. Grid & Iconography Rule

### Grid Structure
- **Desktop (>= 1024px)**: 12 columns, `gutter: 24px` (`gap-6`), container max-width: `1294px` / `7xl`.
- **Mobile (< 768px)**: 4 columns, `gutter: 16px` (`gap-4`), padding `px-4`.

### Icons
- Primary set: Material Design / Material Symbols (or clean Lucide React matching 20px / 16px stroke).
