# PixelLift Style Guide

This document outlines the design system for PixelLift, covering typography, color palettes, and UI component definitions for both Light and Dark modes.

## 1. Typography

**Font Family**: `Inter` (sans-serif) - System UI fallback.
*   The application uses the default Tailwind/Shadcn sans-serif stack.
*   CSS: `font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";`

**Font Weights**
*   **Regular (400)**: Body text, inputs.
*   **Medium (500)**: Buttons, navigation links, labels, subheaders.
*   **Semibold (600)**: Section headers, emphasized actions.
*   **Bold (700)**: Main titles, logos.
*   **Extra Bold (800)**: Hero headlines.

**Type Scale**
| Name | Class | Size (rem) | Size (px) | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `text-6xl` | 3.75rem | 60px | Hero headlines (Desktop) |
| **H1** | `text-4xl` | 2.25rem | 36px | Hero headlines (Mobile), Page Titles |
| **H2** | `text-2xl` | 1.5rem | 24px | Section Headers, Modal Titles |
| **H3** | `text-xl` | 1.25rem | 20px | Card Titles, Large Labels |
| **Body Large** | `text-lg` | 1.125rem | 18px | Intro text, Lead paragraphs |
| **Body** | `text-base` | 1rem | 16px | Default content, Inputs, Buttons |
| **Small** | `text-sm` | 0.875rem | 14px | Captions, Secondary text, Helpers |
| **Tiny** | `text-xs` | 0.75rem | 12px | Badges, Labels, Metadata |

---

## 2. Color Palette (Primitives)

### Brand Colors (Emerald)
Used for primary actions, active states, and success indicators.

| Token | Class | Hex Code | Usage |
| :--- | :--- | :--- | :--- |
| Brand Light | `bg-emerald-400` | `#34d399` | Hover states (Dark Mode) |
| **Brand Primary** | `bg-emerald-500` | `#10b981` | **Primary Buttons**, Active Toggles, Progress Bars |
| Brand Dark | `bg-emerald-600` | `#059669` | Hover states (Light Mode) |
| Brand Subtle | `bg-emerald-500/10` | `#10b981` (10%) | Active backgrounds, badges |

### Neutral Colors (Slate)
Used for text, borders, and backgrounds.

| Token | Class | Hex Code | Usage |
| :--- | :--- | :--- | :--- |
| Slate 50 | `bg-slate-50` | `#f8fafc` | Page Background (Light Mode) |
| Slate 100 | `bg-slate-100` | `#f1f5f9` | Card Background (Light Mode) |
| Slate 200 | `border-slate-200` | `#e2e8f0` | Borders (Light Mode) |
| Slate 300 | `text-slate-300` | `#cbd5e1` | Disabled text, Placeholders |
| Slate 400 | `text-slate-400` | `#94a3b8` | Muted text (Dark Mode) |
| Slate 500 | `text-slate-500` | `#64748b` | Muted text (Light Mode) |
| Slate 600 | `text-slate-600` | `#475569` | Body text (Light Mode) |
| Slate 700 | `border-slate-700` | `#334155` | Borders (Dark Mode) |
| Slate 800 | `bg-slate-800` | `#1e293b` | Secondary Backgrounds (Dark Mode) |
| Slate 900 | `bg-slate-900` | `#0f172a` | Card Backgrounds (Dark Mode), Headings (Light Mode) |

### Base Colors

| Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **White** | `#ffffff` | Text (Dark Mode), Backgrounds (Light Mode) |
| **Black** | `#000000` | Text (Light Mode), Backgrounds (Dark Mode) |
| **Rich Black**| `#0f0f11` | Canvas Background (Dark Mode), Image Containers |

---

## 3. Theme Semantic Mapping

This table shows how color tokens map to UI elements in each mode.

| UI Element | Light Mode | Dark Mode |
| :--- | :--- | :--- |
| **Page Background** | `bg-slate-50` (#f8fafc) | `bg-black` (#000000) |
| **Card / Surface** | `bg-white` (#ffffff) | `bg-slate-900/50` (Transparent Slate) |
| **Canvas / Editor** | `bg-slate-100` (#f1f5f9) | `bg-[#0f0f11]` (Rich Black) |
| **Primary Text** | `text-slate-900` (#0f172a) | `text-slate-200` (#e2e8f0) |
| **Secondary Text** | `text-slate-500` (#64748b) | `text-slate-400` (#94a3b8) |
| **Borders** | `border-slate-200` (#e2e8f0) | `border-white/10` (10% White) or `border-slate-800` |
| **Primary Button** | `bg-emerald-500` text-white | `bg-emerald-500` text-white |
| **Secondary Button** | `bg-white` border-slate-200 | `bg-slate-900` border-slate-700 |
| **Hover State (Row)** | `hover:bg-slate-50` | `hover:bg-slate-800/50` |

---

## 4. UI Components & Effects

### Radius
*   **Standard**: `rounded-xl` (0.75rem / 12px) - Used for Cards, Modals, Upload Zone.
*   **Buttons/Inputs**: `rounded-lg` (0.5rem / 8px) - Used for interactive controls.
*   **Full**: `rounded-full` - Used for Badges, Icon containers.

### Shadows (Light Mode Only)
Dark mode relies more on borders and background contrast than shadows.
*   **Card**: `shadow-sm` (0 1px 2px 0 rgb(0 0 0 / 0.05))
*   **Dropdown/Popover**: `shadow-lg` (0 10px 15px -3px rgb(0 0 0 / 0.1))
*   **Glow Effect**: `shadow-lg shadow-emerald-500/20` (Used on Primary Actions in both modes).

### Transitions
*   **Global**: `transition-colors duration-300` - Used for theme toggling.
*   **Hover**: `transition-all duration-200` - Used for buttons and interactive cards.
*   **Animation**: Uses `framer-motion` (now `motion/react`) for smooth entry/exit (fade-in, slide-up).

### Iconography
*   **Library**: Lucide React
*   **Stroke Width**: 2px (Default)
*   **Size**:
    *   Small: 16px (`w-4 h-4`)
    *   Medium: 20px (`w-5 h-5`)
    *   Large: 24px (`w-6 h-6`)
    *   Hero: 32px+ (`w-8 h-8`)
