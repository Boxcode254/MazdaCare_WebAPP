import { SHORTCUT_LEGEND_STRIP } from '@/lib/keyboardShortcuts'

export function KeyboardShortcutLegend() {
  if (typeof window !== 'undefined' && window.innerWidth < 1024) return null
  return (
    <div
      className="hidden lg:flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b border-border/60 bg-[rgba(255,249,248,0.75)] px-4 py-2 text-xs text-muted-foreground backdrop-blur-md dark:bg-[rgba(255,249,248,0.88)] dark:text-[#3D3536]"
      aria-hidden
    >
      <span className="font-semibold text-foreground/80">Shortcuts</span>
      {SHORTCUT_LEGEND_STRIP.map((s) => (
        <span key={s.key} className="flex items-center gap-1">
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-bold text-foreground">
            {s.key}
          </kbd>
          <span>{s.label}</span>
        </span>
      ))}
      <span className="flex items-center gap-1 pl-1 text-[11px]">
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono font-bold text-foreground">⌘/</kbd>
        <span className="text-muted-foreground">or Ctrl+/ help</span>
      </span>
    </div>
  )
}
