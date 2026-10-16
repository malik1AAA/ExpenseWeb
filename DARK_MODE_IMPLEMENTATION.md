# Dark Mode Implementation

## Overview

The application now supports both light and dark modes with a theme toggle in the header. The theme preference is persisted in localStorage and automatically applied across all pages.

## Features

### 1. Theme Toggle
- **Location**: Header component (top right, before search icon)
- **Icons**: 
  - Light mode: Moon icon (click to switch to dark)
  - Dark mode: Sun icon (click to switch to light)
- **Accessibility**: Includes aria-label and title attributes
- **Animation**: Smooth transition between themes

### 2. Persistence
- Theme preference is saved to `localStorage` under the key `theme`
- On app load, the saved theme is restored
- If no saved preference, the system preference is detected using `prefers-color-scheme`
- Falls back to light mode if neither is available

### 3. Automatic System Detection
The app respects the user's system preference:
```javascript
// Check system preference
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  return 'dark';
}
```

## Implementation Details

### ThemeContext
Located at `src/context/ThemeContext.jsx`

**Provides:**
- `theme`: Current theme ('light' or 'dark')
- `setTheme`: Function to set theme directly
- `toggleTheme`: Function to toggle between themes
- `isDark`: Boolean indicating if dark mode is active

**Usage:**
```javascript
import { useTheme } from '../context/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, isDark } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {isDark ? 'Switch to Light' : 'Switch to Dark'}
    </button>
  );
}
```

### CSS Variables

The theme system uses CSS custom properties (variables) that automatically switch based on the `.dark` class on the root element.

**Light Mode (Default):**
```css
--color-surface-50: #f8fafc;
--color-surface-100: #f1f5f9;
--color-surface-200: #e2e8f0;
/* ... */
```

**Dark Mode:**
```css
.dark {
  --color-surface-50: #0f172a;
  --color-surface-100: #1e293b;
  --color-surface-200: #334155;
  /* ... */
}
```

### Component Updates

All components automatically adapt to the theme because they use:
- Tailwind CSS color classes (e.g., `bg-surface-100`, `text-surface-900`)
- CSS variables that change based on theme
- No hardcoded colors

**Example:**
```jsx
// This automatically adapts to both themes
<div className="bg-surface-100 text-surface-900 border-surface-200">
  Content
</div>
```

## Chart Compatibility

Charts (Recharts) remain readable in both themes through CSS overrides:

```css
/* Dark mode chart adjustments */
.dark .recharts-cartesian-grid-horizontal line,
.dark .recharts-cartesian-grid-vertical line {
  stroke: var(--color-surface-300);
}

.dark .recharts-text {
  fill: var(--color-surface-600);
}

.dark .recharts-legend-item-text {
  color: var(--color-surface-700) !important;
}
```

## Tables and Forms

### Tables
- Headers use `bg-surface-50` which adapts to theme
- Rows use `hover:bg-surface-50` for consistent hover states
- Borders use `border-surface-200` for theme-aware borders

### Forms
- Inputs use `bg-surface-100` for background
- Text uses `text-surface-900` for content
- Placeholders use `text-surface-400`
- Focus states use primary colors that adapt to theme

## File Changes

### New Files
1. **`src/context/ThemeContext.jsx`**
   - Theme state management
   - localStorage persistence
   - System preference detection

2. **`src/components/common/ThemeToggle.jsx`**
   - Toggle button component
   - Sun/Moon icons
   - Accessibility attributes

### Modified Files
1. **`src/index.css`**
   - Added dark mode CSS variable overrides
   - Added dark mode specific styles for better contrast
   - Added chart compatibility styles
   - Updated utility classes to use CSS variables

2. **`src/main.jsx`**
   - Wrapped app with `ThemeProvider`

3. **`src/components/layout/Header.jsx`**
   - Added `ThemeToggle` component
   - Updated background to use `bg-surface-100`
   - Updated hover states to use `hover:bg-surface-200`

4. **`src/components/layout/Sidebar.jsx`**
   - Updated to use consistent dark background
   - Improved contrast with white/opacity utilities
   - Updated hover states

5. **`src/components/common/index.js`**
   - Exported `ThemeToggle` component

## Color Palette

### Light Mode
- **Background**: `#f8fafc` (surface-50)
- **Cards**: `#f1f5f9` (surface-100)
- **Borders**: `#e2e8f0` (surface-200)
- **Text Primary**: `#0f172a` (surface-900)
- **Text Secondary**: `#475569` (surface-600)

### Dark Mode
- **Background**: `#0f172a` (surface-50)
- **Cards**: `#1e293b` (surface-100)
- **Borders**: `#334155` (surface-200)
- **Text Primary**: `#f8fafc` (surface-900)
- **Text Secondary**: `#cbd5e1` (surface-600)

### Primary Colors (Adapt to Theme)
- **Light**: Blue shades (#3b82f6 - #1e40af)
- **Dark**: Lighter blue shades (#60a5fa - #1e3a8a)

## Accessibility

### Contrast Ratios
All text meets WCAG AA standards:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

### Keyboard Navigation
- Theme toggle is focusable
- Can be activated with Enter or Space
- Has visible focus indicator

### Screen Readers
- Toggle button has descriptive aria-label
- Title attribute provides additional context
- Theme changes are announced

## Testing Checklist

### Visual Testing
- [x] Light mode displays correctly
- [x] Dark mode displays correctly
- [x] Theme toggle works
- [x] Smooth transitions between themes
- [x] All components adapt to theme
- [x] Charts remain readable in both themes
- [x] Tables are readable in both themes
- [x] Forms are usable in both themes

### Functional Testing
- [x] Theme persists after page reload
- [x] Theme persists after browser restart
- [x] System preference is detected on first load
- [x] Manual selection overrides system preference
- [x] Toggle button works correctly
- [x] No functionality is broken by theme change

### Accessibility Testing
- [x] Toggle is keyboard accessible
- [x] Focus indicator is visible
- [x] Aria labels are correct
- [x] Color contrast meets WCAG AA
- [x] Screen readers announce theme changes

### Responsive Testing
- [x] Theme works on mobile
- [x] Theme works on tablet
- [x] Theme works on desktop
- [x] Toggle is accessible on all screen sizes

## Browser Compatibility

The implementation uses:
- CSS Custom Properties (Variables) - Supported in all modern browsers
- localStorage - Supported in all modern browsers
- matchMedia API - Supported in all modern browsers
- Tailwind CSS dark mode - Supported in Tailwind v2+

**Minimum Requirements:**
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

## Performance

- **No performance impact**: Theme switching is instantaneous
- **Minimal bundle size**: ThemeContext is lightweight (~1KB)
- **No additional requests**: All theme data is local
- **Smooth transitions**: CSS transitions are hardware-accelerated

## Future Enhancements

Potential improvements:
1. **System theme sync**: Option to follow system theme automatically
2. **Custom themes**: Allow users to create custom color schemes
3. **Theme preview**: Show theme preview before applying
4. **Scheduled themes**: Auto-switch based on time of day
5. **Per-page themes**: Different themes for different sections
6. **High contrast mode**: Additional accessibility option

## Troubleshooting

### Theme not persisting
- Check localStorage is enabled
- Verify `theme` key exists in localStorage
- Clear browser cache and try again

### Charts not visible in dark mode
- Check browser console for errors
- Verify Recharts is properly installed
- Ensure CSS is loaded correctly

### Colors look wrong
- Clear browser cache
- Check for CSS specificity issues
- Verify Tailwind is processing dark mode classes

## Best Practices

### For Developers

1. **Always use theme-aware colors:**
   ```jsx
   // ✅ Good
   <div className="bg-surface-100 text-surface-900">
   
   // ❌ Bad
   <div className="bg-white text-gray-900">
   ```

2. **Test in both themes:**
   - Always check your changes in both light and dark mode
   - Use the theme toggle to verify

3. **Use CSS variables:**
   ```css
   /* ✅ Good */
   color: var(--color-surface-900);
   
   /* ❌ Bad */
   color: #0f172a;
   ```

4. **Avoid hardcoded colors:**
   - Don't use hex codes directly
   - Use Tailwind color classes or CSS variables

5. **Check contrast:**
   - Ensure text is readable in both themes
   - Use contrast checking tools

## Summary

The dark mode implementation provides:
- ✅ Seamless theme switching
- ✅ Persistent theme preference
- ✅ System preference detection
- ✅ Full component compatibility
- ✅ Chart readability in both themes
- ✅ Accessible toggle button
- ✅ Smooth transitions
- ✅ No functionality changes
- ✅ No CSS duplication
- ✅ Modern, professional appearance

The implementation is production-ready and provides an excellent user experience in both light and dark modes.
