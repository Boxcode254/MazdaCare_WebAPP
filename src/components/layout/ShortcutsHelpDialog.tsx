import { DESKTOP_SHORTCUT_ROWS } from '@/lib/keyboardShortcuts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function ShortcutsHelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <ul className="space-y-2.5 text-sm">
          {DESKTOP_SHORTCUT_ROWS.map((row) => (
            <li key={row.keys} className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">{row.label}</span>
              <kbd className="shrink-0 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                {row.keys}
              </kbd>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Shortcuts work on large screens only and are ignored while you type in a field.
        </p>
      </DialogContent>
    </Dialog>
  )
}
