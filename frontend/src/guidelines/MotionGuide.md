# PixelLift Motion & Interaction Guide

This document outlines the motion design principles and key interaction patterns used in the PixelLift application. The goal of these animations is to guide the user through the linear enhancement process (Upload -> Configure -> Result) while making the application feel responsive and modern.

## 1. Motion Principles

*   **Fluidity**: Transitions between steps should feel continuous, not abrupt. We use cross-fades and slight vertical movement to indicate progress.
*   **Feedback**: Every interactive element (button, card, drop zone) provides immediate visual feedback on hover, focus, or click.
*   **Performance**: Animations are kept lightweight, primarily animating `opacity`, `transform` (scale/translate), and colors to ensure 60fps performance.
*   **Respectful**: Animations respect user preference. In a real production environment, we would check `prefers-reduced-motion`.

## 2. Global Transitions (Step Flow)

The application moves through three distinct states: `Upload` -> `Configure` -> `Result`.
We use `framer-motion`'s `<AnimatePresence mode="wait">` to handle these stage transitions.

### Transition Spec
*   **Exit**: The current step fades out (`opacity: 0`) and moves slightly upward or scales down (`scale: 0.95`).
*   **Enter**: The new step fades in (`opacity: 1`) and moves into place (`y: 0` or `scale: 1`).
*   **Duration**: ~300ms ease-out.

```tsx
<AnimatePresence mode="wait">
  {step === 'upload' && (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      ...
    </motion.div>
  )}
</AnimatePresence>
```

## 3. Key Interactions

### A. Upload Zone (`UploadZone.tsx`)
The entry point of the application needs to feel inviting and reactive.

*   **Idle State**: Subtle pulsing or static border.
*   **Hover State**:
    *   Scale: `1.01` (Slight lift)
    *   Border Color: Transitions to `slate-500` (Light) or `slate-400` (Dark).
*   **Drag Over State**:
    *   **Trigger**: File dragged over the drop zone.
    *   **Visual Change**: Background becomes `emerald-500/10`, border becomes `emerald-500` solid.
    *   **Icon Animation**: The upload icon gets a colored background circle.
*   **Click/Tap**: Scale `0.99` (Tactile feedback).

### B. Configuration Panel (`ConfigurationPanel.tsx`)

#### AI Mode Selection Cards
*   **Hover**:
    *   Scale: `1.01`
    *   Background: Lightens slightly.
    *   Border: Becomes slightly more visible.
*   **Selection**:
    *   **Active State**: Card gets an Emerald border ring (`ring-1`) and a subtle Emerald background tint.
    *   **Icon**: The icon container turns solid Emerald (`bg-emerald-500`) with a shadow.
*   **List Animation**: (Optional) The list of modes can stagger in when the panel loads.

#### Slider
*   **Thumb**: Smoothly tracks the mouse/touch.
*   **Track**: Fills with Emerald color as value increases.

#### "Start Enhancement" Button
*   **Normal**: Emerald background with `shadow-lg shadow-emerald-500/20`.
*   **Hover**: Brightens and shadow expands (`shadow-emerald-500/40`).
*   **Processing State**:
    *   Text is replaced by a spinner.
    *   Button becomes disabled (opacity reduced).

### C. Comparison Slider (`ComparisonSlider.tsx`)
The core interaction of the Result view.

*   **Handle Interaction**:
    *   **Drag**: The handle follows the cursor/finger 1:1.
    *   **Cursor**: Changes to `ew-resize` (east-west resize).
    *   **Active State**: When clicking/dragging, the handle scale increases slightly (`scale-110`) to indicate grip.
*   **Image Reveal**:
    *   Uses CSS `clip-path` for high-performance masking.
    *   No lag between handle movement and image reveal.

## 4. Theme Toggle Interaction
*   **Trigger**: Sun/Moon icon in the navbar.
*   **Effect**:
    *   **Immediate**: The `dark` class is toggled on the root element.
    *   **Transition**: All color-dependent properties (bg, text, border) have a `transition-colors duration-300` class. This creates a smooth "fade" between light and dark modes rather than a harsh strobe effect.

## 5. Technical Stack

*   **Library**: `motion/react` (formerly framer-motion)
    *   Used for layout animations, exit transitions, and complex micro-interactions.
*   **CSS Transitions**: `tailwindcss` utilities
    *   Used for simple state changes (hover colors, focus rings, theme switching).
*   **Lucide React**:
    *   Icons are SVG based and scale perfectly. They are often colored or sized dynamically based on interaction state.
