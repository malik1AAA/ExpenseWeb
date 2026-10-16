# Design System

## Color Palette

### Primary Colors
- Primary 50: #eff6ff (Lightest)
- Primary 100: #dbeafe
- Primary 200: #bfdbfe
- Primary 300: #93c5fd
- Primary 400: #60a5fa
- Primary 500: #3b82f6 (Main)
- Primary 600: #2563eb (Hover)
- Primary 700: #1d4ed8 (Active)
- Primary 800: #1e40af
- Primary 900: #1e3a8a (Darkest)

### Surface Colors (Neutral)
- Surface 50: #f8fafc (Background)
- Surface 100: #f1f5f9 (Card background)
- Surface 200: #e2e8f0 (Borders)
- Surface 300: #cbd5e1 (Dividers)
- Surface 400: #94a3b8 (Disabled text)
- Surface 500: #64748b (Secondary text)
- Surface 600: #475569 (Primary text)
- Surface 700: #334155 (Headings)
- Surface 800: #1e293b (Dark text)
- Surface 900: #0f172a (Darkest)

### Semantic Colors
- Success: #10b981 (green-500)
- Warning: #f59e0b (amber-500)
- Error: #ef4444 (red-500)
- Info: #3b82f6 (blue-500)

### Accent Colors
- Purple: #8b5cf6
- Pink: #ec4899
- Indigo: #6366f1
- Teal: #14b8a6

## Typography

### Font Family
- Primary: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- Monospace: 'Courier New', monospace (for code/numbers)

### Font Sizes
- xs: 0.75rem (12px) - Captions, labels
- sm: 0.875rem (14px) - Body text, secondary
- base: 1rem (16px) - Default body
- lg: 1.125rem (18px) - Emphasized text
- xl: 1.25rem (20px) - Small headings
- 2xl: 1.5rem (24px) - Section headings
- 3xl: 1.875rem (30px) - Page titles
- 4xl: 2.25rem (36px) - Large headings

### Font Weights
- normal: 400
- medium: 500
- semibold: 600
- bold: 700

### Line Heights
- tight: 1.25
- normal: 1.5
- relaxed: 1.75

## Spacing System

### Base Unit: 4px (0.25rem)

- 0: 0
- 1: 0.25rem (4px)
- 2: 0.5rem (8px)
- 3: 0.75rem (12px)
- 4: 1rem (16px)
- 5: 1.25rem (20px)
- 6: 1.5rem (24px)
- 8: 2rem (32px)
- 10: 2.5rem (40px)
- 12: 3rem (48px)
- 16: 4rem (64px)
- 20: 5rem (80px)

### Common Spacing
- Component padding: 1rem (16px)
- Section spacing: 1.5rem (24px)
- Page padding: 2rem (32px)
- Card gap: 1rem (16px)
- Form field gap: 1rem (16px)

## Border Radius

- none: 0
- sm: 0.25rem (4px)
- md: 0.375rem (6px)
- lg: 0.5rem (8px)
- xl: 0.75rem (12px)
- 2xl: 1rem (16px)
- full: 9999px

## Shadows

### Elevation Levels
- none: No shadow
- sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
- md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
- lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
- xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)

## Component Guidelines

### Cards
- Background: white
- Border: 1px solid surface-200
- Border radius: xl (12px)
- Padding: 1.5rem (24px)
- Shadow: none (use border for definition)
- Hover: shadow-md (subtle elevation)

### Buttons
- Primary: bg-primary-600, text-white, hover:bg-primary-700
- Secondary: bg-white, border border-surface-300, text-surface-700, hover:bg-surface-50
- Danger: bg-red-600, text-white, hover:bg-red-700
- Ghost: text-surface-600, hover:bg-surface-100
- Border radius: lg (8px)
- Padding: 0.5rem 1rem (8px 16px)
- Font: medium weight, sm size

### Tables
- Header: bg-surface-50, font-semibold, text-surface-700
- Rows: border-b border-surface-200
- Hover: bg-surface-50
- Cell padding: 0.75rem 1rem (12px 16px)
- Font size: sm (14px)

### Forms
- Input height: 2.5rem (40px)
- Border: 1px solid surface-300
- Border radius: lg (8px)
- Focus: ring-2 ring-primary-500
- Label: font-medium, text-surface-700, mb-1
- Error: border-red-500, text-red-600

### Modals
- Overlay: bg-black/50
- Container: bg-white, rounded-2xl, shadow-xl
- Max width: varies by size
- Padding: 1.5rem (24px)
- Header: border-b, font-semibold, text-xl

## Responsive Breakpoints

- sm: 640px (Mobile landscape)
- md: 768px (Tablet)
- lg: 1024px (Desktop)
- xl: 1280px (Large desktop)
- 2xl: 1536px (Extra large)

## Accessibility

### Color Contrast
- Text on white: minimum 4.5:1 ratio
- Large text: minimum 3:1 ratio
- Interactive elements: minimum 3:1 ratio

### Focus States
- All interactive elements must have visible focus
- Use ring-2 ring-primary-500 ring-offset-2
- Focus should be clearly visible

### Touch Targets
- Minimum 44x44px for touch targets
- Buttons: minimum 40px height
- Icon buttons: minimum 44x44px

### Screen Readers
- All images need alt text
- Icons need aria-label
- Forms need proper labels
- Use semantic HTML

## Icons

### Library: Lucide React
- Size: 20px (default), 16px (small), 24px (large)
- Stroke width: 2px
- Color: inherit from parent

### Common Icons
- Actions: Edit, Trash2, Plus, Download, Upload
- Navigation: ChevronLeft, ChevronRight, Menu, X
- Status: CheckCircle, AlertCircle, AlertTriangle
- Data: FileSpreadsheet, DollarSign, TrendingUp, TrendingDown
- UI: Search, Filter, Settings, User

## Animation Guidelines

### Principles
- Subtle and purposeful
- Fast (150-300ms)
- Never excessive
- Only for feedback

### Common Animations
- Hover: transition-colors (150ms)
- Focus: transition-all (150ms)
- Modal: fade-in (200ms)
- Loading: spin (infinite)

### Avoid
- Bouncing
- Sliding from far away
- Excessive scaling
- Long durations (>500ms)
