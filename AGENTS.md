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

- **Primary Font**: `Readex Pro` (Body, Buttons, Navigation, Labels, Calendar)
- **Heading / Display / Numbers Font**: `K2D` (Brand Logo, Event Titles, Big Scores, Classifications)
- **Fallback Font**: `Inter`, system sans-serif.

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

---

## 5. Core UX/UI Principles & User Preferences (Nguyên tắc thiết kế cốt lõi)

Mọi màn hình, form nhập liệu và component được phát triển phải tuân thủ nghiêm ngặt các nguyên tắc sau:

### 5.1. Triết lý Tối giản & Thực dụng (No Fluff / Minimalist UX)
- **Không chữ thừa / Không giải thích hiển nhiên**: Tuyệt đối không thêm các câu hướng dẫn lặp lại (ví dụ: *"Sau khi chọn hãy bấm..."*, *"Tự động gán quyền..."*, *"Quyền: làm được những gì"* hay chức danh lặp lại *"• Cán bộ quản lý"*).
- **Không dùng phân mục rườm rà**: Tuyệt đối không dùng số La Mã `I, II, III`, không dùng steppers `01, 02, 03` nếu không phải luồng wizard phức tạp nhiều bước.
- **Nhãn tự nhiên, chuẩn người dùng**: Không để lọt từ ngữ kỹ thuật/schema như `(Help contact)`, `(Help phone)` hay lời khuyên hiển nhiên như `(khuyên dùng ảnh vuông 1:1)`.
- **Bỏ nút thừa**: Không thêm nút "Quay lại" ở các màn hình hub/dashboard đầu tiên sau đăng nhập.

### 5.2. Cấu trúc Lưới cân xứng & Mật độ vừa vặn (Balanced Grid & Compact Layout)
- **Lưới form chuẩn 2 cột**: Mọi form thông tin phải chia thành lưới 2 cột cân xứng (`grid-cols-1 md:grid-cols-2 gap-5`), các trường dài (mô tả, tệp đính kèm) chiếm `md:col-span-2`. Tuyệt đối không chia cột tùy hứng (ví dụ: đang 2 cột lại chèn 1 hàng 3 cột ép chữ).
- **Danh sách 1 cột (Single-column list)**: Danh sách lựa chọn, danh sách fanpage ưu tiên hiển thị dạng 1 cột hàng ngang với hover action mượt mà (`Đi tới trang này →`), nhấp toàn thẻ để điều hướng; không dùng thanh action bar lỉnh kỉnh dưới đáy.
- **Tránh khung rỗng (No large empty boxes)**: Tuyệt đối không dùng khung viền nét đứt (dashed container) kéo dài hết chiều ngang chỉ để chứa một nút nhỏ bên trái với khoảng trắng thừa thãi. Khung logo phải gọn gàng, tỉ lệ tương xứng (80x80px).

### 5.3. Trực quan thực tế (Real Previews, Not Dev URLs)
- **Tải ảnh thật**: Ảnh đại diện / Logo fanpage phải là ô tải tệp từ thiết bị (`PNG, JPG, WEBP`) kèm khung xem trước trực tiếp (Live Preview), không dùng ô dán URL thô.
- **Logo Fanpage hình tròn**: Mọi ảnh đại diện / logo của Fanpage ở toàn bộ hệ thống phải luôn hiển thị dạng hình tròn (`rounded-full`), tuyệt đối không dùng hình vuông hay bo góc (`rounded-lg`, `rounded-2xl`).
- **Thông tin người dùng ở đầu**: Khối người nộp hồ sơ đặt ở đầu form nhưng phải tinh gọn (Avatar + Tên + Email), đóng vai trò định danh nhẹ nhàng, không chiếm nhiều diện tích.

### 5.4. Chuẩn Component thư viện (shadcn / Radix UI)
- **Bắt buộc dùng Radix / shadcn UI**: Không dùng thẻ HTML nguyên thủy (`<input>`, `<select>`, `<textarea>`, `<button>`). Phải dùng các primitives trong `@/components/ui/` (`Input`, `Select`, `Textarea`, `Label`, `Button`).
- **Nút bấm chuẩn Form**: Nút phải có chiều cao (`h-8` hoặc `h-10`) và bo góc chữ nhật chuẩn `rounded-lg` (8px), không được biến dạng thành hình viên thuốc (pill capsule).
- **Placeholder dịu mắt**: Màu placeholder phải dùng màu xám nhạt (`#9CA3AF` / Tailwind `gray-400`), tuyệt đối không dùng màu xám đậm khiến chữ gợi ý trông như đã nhập.

