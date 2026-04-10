# Design system — MazdaCare

Single reference for **typography**, **colour**, the **light-top rule**, and how they map to code.

## Typography

| Role | Font | Tailwind | Usage |
|------|------|----------|--------|
| UI body | **Outfit** | `font-sans`, `font-body` | Buttons, forms, lists, tab labels, dense data (tables). |
| Display / headings | **Cormorant Garamond** | `font-display` | Page titles, marketing-style headings, hero stats in settings. |

**CSS variables** (see `src/index.css`): `--font-body`, `--font-display` — keep aligned with `tailwind.config.js` `theme.extend.fontFamily`.

**Inline hacks:** Some components still set `style={{ fontFamily: 'Outfit, sans-serif' }}` or `Cormorant Garamond`. Prefer `className="font-sans"` / `font-display` for new code.

## Colour — Soul Red + gold

**Canonical Tailwind tokens** use the `mz-*` prefix only (e.g. `text-mz-red`, `bg-mz-gold-light`). Do **not** add a parallel `mazda-*` scale.

| Token | Hex (light) | Role |
|-------|-------------|------|
| `mz-red` | `#A31526` | Primary actions, brand emphasis, links on light surfaces. |
| `mz-red-mid` | `#BC2133` | Hover on primary red. |
| `mz-red-dark` | `#7F0F1D` | Pressed / darker emphasis. |
| `mz-red-light` | `#F8E7EA` | Soft fills, chips. |
| `mz-red-pale` | `#FDF4F5` | Subtle panels. |
| `mz-gold` | `#C49A3C` | Accents, secondary highlights (not errors). |
| `mz-gold-light` | `#F5EDD6` | Gold-tinted surfaces. |

**shadcn semantic tokens** (`primary`, `destructive`, `muted-foreground`, etc.) in `src/index.css` are mapped from this palette in light mode; `.dark` overrides adjust **contrast** (especially `muted-foreground` and `primary`) for dark backgrounds.

**Errors vs brand red:** Use `destructive` / `text-destructive` for dangerous actions and form errors; keep `mz-red` for brand and navigation emphasis where appropriate.

## Light-top rule

The **sticky header** under the main shell (`Phase4Shell`) must stay a **light, cream-tinted** strip in **both** light and dark app themes. Users should not see a full-width **black or near-black bar** at the top of the main content column.

- **Implementation:** `class="app-top-bar"` on that header (`src/index.css`).
- **Allowed dark chrome elsewhere:** Bottom nav, side rail, modals, toasts, auth full-screen (separate route).
- **Violations to avoid:** `dark:bg-mz-black`, `bg-mz-black`, or heavy gradients on the **first** sticky header row of the shell.

## Keyboard shortcuts (desktop)

Defined in `src/lib/keyboardShortcuts.ts` and wired in `Phase4Shell`. The strip under the header and **⌘/** (Ctrl+/) open the help dialog — keep lists in sync when changing behaviour.

## Related

- [Routing & shell](./routing-and-shell.md) — URLs vs tabs vs legacy page modules.
