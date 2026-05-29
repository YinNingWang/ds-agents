# Acme · Design Tokens · Theme × Palette Blueprint
> Source of truth for `globals.css`. Replace `<TODO>` placeholders with real values.
## Architecture
```
:root[data-theme="light|dark"]   ← surface / text / border / shadow
:root[data-palette="<name>"]      ← brand-tinted vars (pub / priv / lens / halo)
```
Two attributes orthogonal: theme doesn't affect palette, palette doesn't affect theme.
## Theme tokens
### Light
```css
:root[data-theme="light"] {
  --background: 0 0% 100%;        /* #FFFFFF */
  --foreground: 0 0% 7%;          /* #111111 */
  --card: 0 0% 95%;               /* #F2F2F2 */
  --popover: 0 0% 100%;
  --muted: 0 0% 95%;
  --muted-foreground: 0 0% 36%;
  --surface: 0 0% 95%;
  --surface-2: 0 0% 91%;
  --bg-elev: 0 0% 100%;
  --text-primary: 0 0% 7%;
  --text-secondary: 0 0% 36%;
  --text-tertiary: 0 0% 60%;
  --on-accent: 0 0% 100%;
  --destructive: 0 84% 60%;       /* #EF4444 */
  --warning: 37 36% 56%;
  --shadow-card: 0 18px 50px rgba(0, 0, 0, 0.08);
}
```
### Dark
```css
:root[data-theme="dark"] {
  /* <TODO> dark mode mirror */
}
```
## Palette tokens
```css
:root[data-palette="default"] {
  --pub: <TODO>;
  --priv: <TODO>;
  --pub-soft: <TODO>;
  --priv-soft: <TODO>;
  --pub-halo: <TODO>;
  --priv-halo: <TODO>;
  --lens: <TODO>;
}
/* Add more palettes as needed */
```
## Tailwind extend
```ts
// tailwind.config.ts
extend: {
  colors: {
    background: 'hsl(var(--background) / <alpha-value>)',
    foreground: 'hsl(var(--foreground) / <alpha-value>)',
    card: { DEFAULT: 'hsl(var(--card) / <alpha-value>)' },
    surface: 'hsl(var(--surface) / <alpha-value>)',
    'surface-2': 'hsl(var(--surface-2) / <alpha-value>)',
    'bg-elev': 'hsl(var(--bg-elev) / <alpha-value>)',
    'text-primary': 'hsl(var(--text-primary) / <alpha-value>)',
    'text-secondary': 'hsl(var(--text-secondary) / <alpha-value>)',
    'text-tertiary': 'hsl(var(--text-tertiary) / <alpha-value>)',
    'on-accent': 'hsl(var(--on-accent) / <alpha-value>)',
    pub: 'hsl(var(--pub) / <alpha-value>)',
    priv: 'hsl(var(--priv) / <alpha-value>)',
    destructive: 'hsl(var(--destructive) / <alpha-value>)',
    warning: 'hsl(var(--warning) / <alpha-value>)',
  },
  boxShadow: {
    card: 'var(--shadow-card)',
  },
}
```
⚠ **Tailwind pitfall**: token MUST be written as `hsl(var(--X) / <alpha-value>)` not `hsl(var(--X))`. Missing the alpha placeholder silently disables opacity modifiers like `bg-pub/15`. See pattern `claude-design-handoff-flow.md` §Pattern 4 / Pattern 12.
## Usage conventions
| Use case | Class |
|---|---|
| Page background | `bg-background text-text-primary` |
| Card | `bg-card rounded-lg p-4` |
| Overlay | `bg-popover shadow-card rounded-2xl` |
| Primary CTA (pub mode) | `bg-pub text-on-accent` |
| Secondary text | `text-text-secondary` |
| Halo backdrop | `bg-pub-halo` (radial gradient) |
| Soft chip | `bg-pub/15 text-pub` |
| List items (no dividers) | `<ul className="space-y-2">` — NOT `divide-y` |
## Forbidden
- `border-b` on list items (no dividers rule)
- `divide-y` utility
- Hardcoded hex (`bg-[#XXXXXX]`)
- `dark:` Tailwind variants (use `data-theme` attribute instead)
