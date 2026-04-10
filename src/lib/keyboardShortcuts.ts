/** Desktop shortcuts (Phase4Shell). Keep in sync with useKeyboardShortcuts registrations. */
export const DESKTOP_SHORTCUT_ROWS = [
  { keys: '⌘ / Ctrl+/', label: 'Show shortcut help' },
  { keys: 'H', label: 'Home' },
  { keys: 'V', label: 'Garage (vehicles & service history)' },
  { keys: 'S', label: 'Settings' },
  { keys: 'N', label: 'New service log' },
  { keys: 'Esc', label: 'Close modal or sheet (when focused)' },
] as const

/** Compact strip under the app header (large screens). */
export const SHORTCUT_LEGEND_STRIP = [
  { key: 'H', label: 'Home' },
  { key: 'V', label: 'Garage' },
  { key: 'S', label: 'Settings' },
  { key: 'N', label: 'Log service' },
  { key: 'Esc', label: 'Close' },
] as const
