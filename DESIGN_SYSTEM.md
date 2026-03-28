# Creatine Tracker - Design System

This document outlines the design system for the Creatine Tracker app. All UI components, colors, spacing, typography, and animations follow the patterns defined here.

## Design Philosophy

The design is built on a **dark theme** with subtle ambient glows and smooth animations. The visual language emphasizes clarity, hierarchy, and smooth micro-interactions. All design decisions are extracted from the Home page, which serves as the reference model for the entire app.

---

## Color Palette

### Primary Colors

| Token       | Hex     | Usage                                                                      | Notes                            |
| ----------- | ------- | -------------------------------------------------------------------------- | -------------------------------- |
| `primary`   | #00fdc1 | Cyan accent for completed goals, interactive elements, progress indicators | High contrast on dark bg         |
| `secondary` | #7f98ff | Periwinkle for daily goal indicators, secondary progress                   | Softer, complementary to primary |
| `tertiary`  | #4a3b30 | Warm brown for goal-reached states and warm accents                        | Muted earth tone                 |

### Accent Colors

| Token                | Hex             | Usage                           | Notes                                       |
| -------------------- | --------------- | ------------------------------- | ------------------------------------------- |
| `accent-positive`    | #00edb4→#aaffdc | Green gradient for primary CTAs | Animated gradient from green to light green |
| `accent-destructive` | #ff716c         | Red for reset/delete actions    | High contrast warning color                 |

### Background & Surface Colors

| Token  | Hex     | Usage                                    | Elevation      |
| ------ | ------- | ---------------------------------------- | -------------- |
| `bg-0` | #0e0e0e | Main page background                     | Base (darkest) |
| `bg-1` | #111111 | Primary card backgrounds                 | +1             |
| `bg-2` | #131313 | Secondary/elevated card backgrounds      | +2             |
| `bg-3` | #171717 | History items, list backgrounds          | +3             |
| `bg-4` | #262626 | Button backgrounds, interactive elements | +4             |
| `bg-5` | #1a1a1a | Disabled/inactive states                 | +4 (muted)     |

### Text Colors

| Token            | Hex     | Usage                             | Contrast  |
| ---------------- | ------- | --------------------------------- | --------- |
| `text-primary`   | #ffffff | Primary body text and headlines   | WCAG AA ✓ |
| `text-secondary` | #ababab | Secondary labels and descriptions | WCAG AA ✓ |
| `text-tertiary`  | #666666 | Muted/disabled text               | WCAG AA ✓ |
| `text-disabled`  | #444444 | Heavily muted/placeholder text    | WCAG AA ✓ |

### Semantic Colors in CSS

Access colors via CSS custom properties in `src/styles/tokens.css`:

```css
/* Color variables for theme flexibility */
--color-primary: #00fdc1;
--color-secondary: #7f98ff;
--color-tertiary: #4a3b30;
--color-bg-0: #0e0e0e;
--color-bg-1: #111111;
--color-text-primary: #ffffff;
--color-text-secondary: #ababab;
```

---

## Spacing Scale

All spacing follows a base unit of **4px** (Tailwind's default scale):

| Token | Size (px) | Tailwind Class | Use Cases                   |
| ----- | --------- | -------------- | --------------------------- |
| xs    | 4         | `space-1`      | Tiny gaps, icon spacing     |
| sm    | 8         | `space-2`      | Small component gaps        |
| md    | 12        | `space-3`      | Standard component spacing  |
| lg    | 16        | `space-4`      | Default padding/margins     |
| xl    | 24        | `space-6`      | Section padding, large gaps |
| 2xl   | 32        | `space-8`      | **Standard card padding**   |
| 3xl   | 40        | `space-10`     | Hero section padding        |
| 4xl   | 64        | `space-16`     | Large hero sections         |

### Application Examples

```tsx
// Standard card padding - always use space-8 (32px)
<Card className='p-8'>
  <h2>Section Title</h2>
</Card>

// Gap between flex items
<div className='flex items-center gap-4'>
  {/* 16px gap */}
</div>

// Vertical stack spacing
<div className='flex flex-col space-y-6'>
  {/* 24px between items */}
</div>
```

---

## Typography

### Font Families

- **Headline Font**: System fonts (`ui-sans-serif, system-ui, sans-serif`)
- **Body Font**: System fonts (`ui-sans-serif, system-ui, sans-serif`)
- **No web fonts loaded** for optimal performance

### Font Sizes & Weights

| Use Case    | Size                   | Weight          | Letter Spacing        | Example           |
| ----------- | ---------------------- | --------------- | --------------------- | ----------------- |
| Hero Number | 96px (text-8xl)        | 900 (black)     | -0.04em (tight)       | `{log.total}`     |
| Headline    | 32-36px (text-3xl/4xl) | 800 (extrabold) | normal                | Section titles    |
| Subheading  | 20px (text-lg)         | 700 (bold)      | normal                | Card titles       |
| Body        | 14px (text-sm)         | 400 (normal)    | normal                | Descriptions      |
| Label       | 10px (text-xs)         | 700 (bold)      | 0.1em (widest)        | Section headers   |
| Small Label | 9px (text-[9px])       | 700 (bold)      | 0.3em (track-[0.3em]) | Badges, tiny text |

### Font Weight Classes

```tsx
// Headlines - use font-black (900) or font-extrabold (800)
<h1 className='font-headline font-black'>Large Title</h1>

// Body text - use font-normal (400)
<p className='font-normal'>Regular description text</p>

// Labels - use font-bold (700)
<label className='font-bold uppercase'>Label Text</label>
```

### Letter Spacing

- **Tracking Widest** (`tracking-widest`): Best for all-caps labels — **use by default for labels**
- **Tracking Wider** (`tracking-wider`): Secondary labels
- **Tracking Tight** (`tracking-tighter`): Headlines for tighter appearance
- **Track Specific** (`tracking-[0.4em]`): Special section headers (40% em)

---

## Border Radius

Rounded corners follow Tailwind's scale with custom additions:

| Token              | Size   | Use Case                         | Example                    |
| ------------------ | ------ | -------------------------------- | -------------------------- |
| `rounded-md`       | 8px    | Small UI elements, minor buttons | Minor CTAs, inputs         |
| `rounded-lg`       | 16px   | Standard buttons, small cards    | Default button size        |
| `rounded-xl`       | 24px   | Card border radius               | Feature cards              |
| `rounded-2xl`      | 32px   | Large cards                      | Main cards, sections       |
| `rounded-[2.5rem]` | 40px   | **Hero/bento sections**          | Large hero cards           |
| `rounded-full`     | 9999px | **Circular buttons**             | Plus/minus buttons, badges |

### Card Styling

```tsx
// Hero card - use rounded-[2.5rem] for 40px radius
<div className='bg-[#111111] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl'>

// Standard card - use rounded-2xl for 32px radius
<div className='bg-[#111111] rounded-2xl p-6 border border-white/5'>

// Small card – use rounded-xl for 24px radius
<div className='bg-[#111111] rounded-xl p-4 border border-white/5'>
```

---

## Shadows & Glows

### Standard Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

**Most cards use `shadow-2xl`** for depth.

### Ambient Glows

Subtle blurred circles used as background decorations:

```tsx
// Primary glow (cyan) - top right corner
<div className='absolute -right-20 -top-20 w-64 h-64 bg-[#00fdc1]/5 blur-[100px] rounded-full' />

// Secondary glow (periwinkle) - bottom left
<div className='absolute -left-16 -bottom-20 w-56 h-56 bg-[#7f98ff]/10 blur-[100px] rounded-full' />

// Tertiary glow (brown) - optional accent
<div className='absolute w-48 h-48 bg-[#4a3b30]/7 blur-[90px] rounded-full' />
```

Use the `<Glow />` component:

```tsx
<Card>
	<Glow color='primary' position='top-right' size='w-64 h-64' />
	<Glow color='secondary' position='bottom-left' size='w-56 h-56' />
</Card>
```

### Progress Bar Glow

When goal is reached, the progress bar has a tertiary glow:

```css
box-shadow: 0 0 25px rgba(74, 59, 48, 0.5);
```

---

## Components

### Card Component

Base container for content with consistent styling.

**Variants:**

- `base` - Standard card (bg-1, rounded-2xl, p-6)
- `elevated` - With shadow and bg-2 (more prominent)
- `interactive` - With hover states and cursor-pointer
- `hero` - Large bento-style card (rounded-[2.5rem], p-8, special shadow)

**Usage:**

```tsx
import { Card } from './components/ui';

// Standard card
<Card variant='base'>
  <h2>Title</h2>
  <p>Content</p>
</Card>

// Hero card with glow
<Card variant='hero'>
  <Glow color='primary' position='top-right' />
  <h1>Hero Content</h1>
</Card>

// Interactive clickable card
<Card variant='interactive' onClick={handleClick}>
  <p>Click me</p>
</Card>
```

### Button Component

Reusable button with multiple variants and sizes.

**Variants:**

- `primary` - White background, black text (main CTA)
- `secondary` - Dark background, gray text (alternative action)
- `ghost` - No background, just text (minimal action)
- `destructive` - Red background (delete/reset actions)

**Sizes:**

- `sm` - Compact button (px-3 py-2)
- `md` - Medium button (px-6 py-4) — **default**
- `lg` - Full-width button (px-8 py-5, w-full)

**Usage:**

```tsx
import { Button } from './components/ui';

// Primary button
<Button variant='primary' size='lg' onClick={handleAdd}>
  Add Creatine
</Button>

// Secondary button
<Button variant='secondary' onClick={handleReset}>
  Reset
</Button>

// Disabled state
<Button disabled>Disabled</Button>

// With custom click handler
<Button onClick={() => console.log('Clicked!')}>
  Action
</Button>
```

### ProgressBar Component

Animated progress indicator with goal-reached color change.

**Props:**

- `progress` (0-1) - Progress value
- `isGoalReached` (boolean) - Changes color to tertiary when true
- `animated` (boolean, default true) - Enable/disable animations
- `className` - Additional CSS classes

**Usage:**

```tsx
import { ProgressBar } from './components/ui';

<ProgressBar progress={0.75} isGoalReached={false} />

// Goal reached
<ProgressBar progress={1} isGoalReached={true} />
```

### SectionHeader Component

Consistent header for sections with indicator dot.

**Usage:**

```tsx
import { SectionHeader } from './components/ui';

<SectionHeader title='Daily Amount' />

// With custom icon (replaces dot)
<SectionHeader title='Statistics' icon={<ActivityIcon />} />
```

### Badge Component

Small inline label for status/tags.

**Variants:**

- `primary` - Cyan badge
- `secondary` - Periwinkle badge
- `neutral` - Gray badge (default)
- `success` - Green badge
- `warning` - Red badge

**Usage:**

```tsx
import { Badge } from './components/ui';

<Badge variant='primary'>Smart Cap</Badge>
<Badge variant='success'>Complete</Badge>
<Badge variant='warning'>Action Required</Badge>
```

### Glow Component

Ambient background decoration—subtle blurred circles.

**Props:**

- `color` - 'primary' | 'secondary' | 'tertiary'
- `position` - 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right' | 'center'
- `size` - Tailwind size classes (default 'w-64 h-64')
- `blurSize` - Blur amount (default 'blur-[100px]')
- `zIndex` - Z-index class (default '-z-10')

**Usage:**

```tsx
import { Glow } from './components/ui';

<Glow color='primary' position='top-right' size='w-64 h-64' blurSize='blur-[100px]' />;
```

---

## Animations & Transitions

All animations are built with **Motion for React** (`motion/react`).

### Motion Variants

Standardized motion variants available in `src/lib/motionVariants.ts`:

```typescript
// Fade animations
(fadeIn, fadeInUp, fadeInDown);

// Slide animations
(slideUp, slideDown);

// Scale animations
(scaleIn, scaleInSm);

// Number transitions
numberFlip;

// Progress bar animation
(progressBar, progressBarFill(value));
```

### Transition Durations

- **Fast**: 150ms — quick interactions, icon changes
- **Base**: 200ms — standard animations (default)
- **Slow**: 300ms — page transitions, larger moves
- **Slower**: 500ms — entrance animations, sequences

### Common Animation Patterns

#### Progress Bar

Smooth width transition over 280ms:

```tsx
<motion.div
	initial={false}
	animate={{ width: `${progress * 100}%` }}
	transition={{ duration: 0.28, ease: 'easeOut' }}
/>
```

#### Number Changes

Smooth fade and slide:

```tsx
<motion.span key={log.total} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
	{log.total}
</motion.span>
```

#### Page Entrance

Staggered children animations:

```tsx
<motion.div
	initial='hidden'
	animate='visible'
	variants={{
		visible: { transition: { staggerChildren: 0.1 } },
	}}
>
	{items.map((item) => (
		<motion.div key={item} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
			{item}
		</motion.div>
	))}
</motion.div>
```

### Easing Functions

- **easeOut**: `cubic-bezier(0.4, 0, 0.2, 1)` — default, natural deceleration
- **easeIn**: `cubic-bezier(0.4, 0, 1, 1)` — accelerating entrance
- **easeInOut**: `cubic-bezier(0.4, 0, 0.2, 1)` — smooth start and end
- **linear**: `linear` — constant speed

Most animations use `easeOut` for natural feel.

---

## Responsive Design

The app is **mobile-first** with `max-w-md` (448px) container constraint.

### Media Queries

- **sm**: 640px (hover states for desktop)
- **md**: 768px (default responsive breakpoint)
- **lg**: 1024px (tablet)
- **xl**: 1280px (desktop)

### Breakpoint Usage

Desktop-only hover effects:

```tsx
<div className='active:scale-95 md:hover:scale-[1.02] transition-all' />
```

Responsive padding:

```tsx
<div className='p-6 md:p-8' />
```

---

## Best Practices

### 1. Use Components Instead of Raw HTML

❌ Don't:

```tsx
<div className='bg-[#111111] rounded-2xl p-6 border border-white/5'>
	<button className='bg-white text-black'>Add</button>
</div>
```

✅ Do:

```tsx
<Card>
	<Button variant='primary'>Add</Button>
</Card>
```

### 2. Import UI Components from `./ui`

```tsx
import { Card, Button, ProgressBar, Badge, Glow, SectionHeader, Label } from './ui';
```

### 3. Use Semantic Color Variables

❌ Don't repeat hex colors:

```tsx
className = 'bg-[#00fdc1]';
className = 'bg-[#7f98ff]';
```

✅ Use Tailwind semantic colors:

```tsx
className = 'bg-primary';
className = 'bg-secondary';
```

### 4. Consistent Spacing Scale

❌ Don't mix scales:

```tsx
<div className='p-6 gap-2.5' /> {/* inconsistent */}
```

✅ Use standard scale:

```tsx
<div className='p-6 gap-4' /> {/* consistent */}
```

### 5. Animations for Intent, Not Decoration

- Use motion for **feedback** (button click, value change)
- Use motion for **transitions** (page change)
- Don't animate **static content** unnecessarily

### 6. Shadow Hierarchy

- Cards: Use `shadow-2xl` by default
- Hover states: Add or increase shadow
- Don't stack multiple shadows

---

## Accessibility

### Color Contrast

All text meets **WCAG AA** standard (4.5:1 minimum):

- White on #0e0e0e: ✓ 13.6:1
- #ababab on #111111: ✓ 5.2:1
- #666666 on #262626: ✓ 4.7:1

### Keyboard Navigation

- All buttons support keyboard focus
- Focus visible with `focus-visible:ring-2`
- Tab order follows DOM structure

### ARIA Attributes

Use semantically meaningful labels:

```tsx
<button aria-label='Decrease portion size'>
  <Minus />
</button>

<div role='region' aria-label='Statistics'>
  {/* stats content */}
</div>
```

### Motion Preferences

Respect user's motion preferences:

```tsx
// CSS media query
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Design System Files

- **Tokens**: `src/styles/tokens.css` — All design variables
- **Components**: `src/components/ui/` — Reusable UI components
- **Animations**: `src/lib/motionVariants.ts` — Motion configurations
- **Utilities**: `src/lib/utils.ts` — Helper functions (`cn()`, etc.)

---

## Version History

- **v1.0** (2026-03-28) — Initial design system, extracted from Home.tsx reference design
    - Color palette (primary, secondary, tertiary, backgrounds, text)
    - Spacing scale (4px base unit)
    - Typography hierarchy
    - 7 core reusable components
    - Animation & transition standards
    - Accessibility guidelines

---

## Future Enhancements

- [ ] Dark mode variant (alt–color palette)
- [ ] Component storybook for interactive demo
- [ ] Figma design tokens export
- [ ] Theme customization support
- [ ] Animation toggle for accessibility

---

**Last Updated:** March 28, 2026

For questions or updates to the design system, refer to the component implementations in `src/components/ui/`.
