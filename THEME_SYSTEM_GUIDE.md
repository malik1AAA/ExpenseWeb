# Theme System Quick Reference

## Overview

The application uses a CSS variable-based theme system with automatic dark mode support. Colors automatically invert between light and dark modes without requiring manual `dark:` prefixes on every element.

## How It Works

### CSS Variables

**Light Mode (Default):**
```css
--color-surface-50: #f8fafc;   /* Lightest background */
--color-surface-100: #f1f5f9;
--color-surface-200: #e2e8f0;
--color-surface-300: #cbd5e1;
--color-surface-400: #94a3b8;
--color-surface-500: #64748b;
--color-surface-600: #475569;
--color-surface-700: #334155;
--color-surface-800: #1e293b;
--color-surface-900: #0f172a;  /* Darkest text */
```

**Dark Mode (Automatically Inverted):**
```css
.dark {
  --color-surface-50: #0f172a;   /* Now darkest */
  --color-surface-100: #1e293b;
  --color-surface-200: #334155;
  --color-surface-300: #475569;
  --color-surface-400: #64748b;
  --color-surface-500: #94a3b8;
  --color-surface-600: #cbd5e1;
  --color-surface-700: #e2e8f0;
  --color-surface-800: #f1f5f9;
  --color-surface-900: #f8fafc;  /* Now lightest */
}
```

## Usage Guidelines

### ✅ DO: Use Theme-Aware Classes

```jsx
// Good - Automatically adapts to theme
<div className="bg-surface-100 text-surface-900 border-surface-200">
  Content
</div>

<button className="bg-surface-200 hover:bg-surface-300 text-surface-800">
  Click me
</button>
```

### ❌ DON'T: Use Hardcoded Colors

```jsx
// Bad - Won't adapt to dark mode
<div className="bg-white text-black border-gray-200">
  Content
</div>
```

### ✅ DO: Use `dark:` Prefix When Needed

```jsx
// Good - Different behavior in dark mode
<div className="bg-surface-100 dark:bg-surface-900">
  Content
</div>

// Good - Opacity variations
<div className="bg-white/10 dark:bg-white/5">
  Content
</div>
```

## Common Patterns

### Cards and Containers

```jsx
// Standard card
<div className="bg-surface-100 border border-surface-200 rounded-lg p-4">
  Card content
</div>

// Card with hover effect
<div className="bg-surface-100 border border-surface-200 rounded-lg p-4 hover:shadow-lg">
  Card content
</div>
```

### Text Hierarchy

```jsx
// Primary text
<p className="text-surface-900">Main heading</p>

// Secondary text
<p className="text-surface-700">Subheading</p>

// Tertiary text
<p className="text-surface-500">Description</p>

// Muted text
<p className="text-surface-400">Caption</p>
```

### Buttons

```jsx
// Primary button
<button className="bg-primary-600 text-white hover:bg-primary-700">
  Submit
</button>

// Secondary button
<button className="bg-surface-200 text-surface-800 hover:bg-surface-300">
  Cancel
</button>

// Ghost button
<button className="text-surface-700 hover:bg-surface-100">
  Learn more
</button>
```

### Forms

```jsx
// Input field
<input className="bg-surface-100 border border-surface-300 text-surface-900 placeholder:text-surface-500" />

// Select dropdown
<select className="bg-surface-100 border border-surface-300 text-surface-900">
  <option>Option 1</option>
</select>

// Label
<label className="text-surface-700 font-medium">Field name</label>
```

### Navigation

```jsx
// Sidebar (light background, dark text)
<aside className="bg-surface-100 dark:bg-surface-900 text-surface-900 dark:text-white">
  Navigation
</aside>

// Active nav item
<a className="bg-primary-600 text-white">
  Active
</a>

// Inactive nav item
<a className="text-surface-700 dark:text-white/70 hover:bg-surface-200 dark:hover:bg-white/10">
  Inactive
</a>
```

### Tables

```jsx
// Table container
<div className="bg-surface-100 border border-surface-200 rounded-lg">
  <table>
    <thead className="bg-surface-200">
      <tr>
        <th className="text-surface-800">Header</th>
      </tr>
    </thead>
    <tbody>
      <tr className="hover:bg-surface-200">
        <td className="text-surface-900">Cell</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Modals

```jsx
// Modal overlay
<div className="fixed inset-0 bg-black/50">
  <div className="bg-white dark:bg-surface-900 rounded-lg shadow-xl">
    Modal content
  </div>
</div>
```

## Color Scale Reference

### Surface Colors (Neutral)

| Class | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `surface-50` | #f8fafc | #0f172a | Page background |
| `surface-100` | #f1f5f9 | #1e293b | Card background |
| `surface-200` | #e2e8f0 | #334155 | Borders, hover states |
| `surface-300` | #cbd5e1 | #475569 | Input borders |
| `surface-400` | #94a3b8 | #64748b | Muted text, icons |
| `surface-500` | #64748b | #94a3b8 | Secondary text |
| `surface-600` | #475569 | #cbd5e1 | Primary text (dark mode) |
| `surface-700` | #334155 | #e2e8f0 | Headings |
| `surface-800` | #1e293b | #f1f5f9 | Strong text |
| `surface-900` | #0f172a | #f8fafc | Strongest text |

### Primary Colors (Brand)

| Class | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `primary-50` | #eff6ff | #1e3a8a | Lightest accent |
| `primary-100` | #dbeafe | #1e40af | Light backgrounds |
| `primary-200` | #bfdbfe | #1d4ed8 | Hover states |
| `primary-300` | #93c5fd | #2563eb | Borders |
| `primary-400` | #60a5fa | #3b82f6 | Icons |
| `primary-500` | #3b82f6 | #60a5fa | Default primary |
| `primary-600` | #2563eb | #93c5fd | Buttons, links |
| `primary-700` | #1d4ed8 | #bfdbfe | Hover states |
| `primary-800` | #1e40af | #dbeafe | Active states |
| `primary-900` | #1e3a8a | #eff6ff | Darkest accent |

### Semantic Colors

| Class | Usage |
|-------|-------|
| `red-500` | Errors, danger actions |
| `green-500` | Success, positive actions |
| `amber-500` | Warnings, cautions |
| `blue-500` | Information, neutral actions |

## Theme Toggle

The theme toggle is located in the Header component and uses the `useTheme` hook:

```jsx
import { useTheme } from '../context/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

## Persistence

Theme preference is automatically saved to `localStorage` and restored on page load:

```javascript
// Saved automatically
localStorage.setItem('theme', 'dark');

// Restored automatically
const savedTheme = localStorage.getItem('theme');
```

## Testing

### Manual Testing Checklist

1. **Toggle Theme**
   - Click theme toggle button
   - Verify all elements adapt correctly
   - Check text contrast in both modes

2. **Check All Pages**
   - Dashboard
   - Expenses
   - Reports
   - Debts
   - Settings

3. **Check All Components**
   - Cards and containers
   - Forms and inputs
   - Tables and lists
   - Modals and dialogs
   - Navigation and menus
   - Charts and graphs

4. **Check Responsive Layouts**
   - Desktop (1920px+)
   - Laptop (1024px-1920px)
   - Tablet (768px-1024px)
   - Mobile (< 768px)

5. **Check Interactions**
   - Hover states
   - Focus states
   - Active states
   - Disabled states

## Troubleshooting

### Issue: Element doesn't change in dark mode

**Solution:** Check if the element uses hardcoded colors like `bg-white` or `text-black`. Replace with theme-aware classes like `bg-surface-100` or `text-surface-900`.

### Issue: Text is invisible in dark mode

**Solution:** Ensure text uses `text-surface-900` (which becomes light in dark mode) instead of `text-black` or `text-surface-100`.

### Issue: Borders are invisible

**Solution:** Use `border-surface-200` or `border-surface-300` which adapt to both themes.

### Issue: Form inputs have wrong background

**Solution:** The CSS override should handle this automatically. If not, add `bg-surface-100` class to the input.

## Best Practices

1. **Always use theme-aware color classes** (`bg-surface-*`, `text-surface-*`)
2. **Use `dark:` prefix sparingly** - only when you need different behavior
3. **Test in both themes** before committing changes
4. **Check contrast ratios** for accessibility
5. **Use semantic colors** for status indicators (red for errors, green for success)
6. **Maintain consistency** across all components
7. **Document custom theme usage** in component comments

## Resources

- **Tailwind CSS Dark Mode**: https://tailwindcss.com/docs/dark-mode
- **CSS Variables**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **WCAG Contrast Requirements**: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html

---

**Last Updated:** 2026-01-29  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
