const SHORTCUTS = [
  { key: "N", label: "Add New Service Log" },
  { key: "V", label: "Switch to Vehicles" },
  { key: "S", label: "Open Settings" },
  { key: "ESC", label: "Close Modal/Sheet" },
]

export function KeyboardShortcutLegend() {
  // Only show on desktop
  if (typeof window !== "undefined" && window.innerWidth < 1024) return null
  return (
    <div className="hidden lg:flex items-center justify-center gap-4 py-2 text-xs text-gray-500 select-none">
      <span className="font-semibold">Keyboard Shortcuts</span>
      {SHORTCUTS.map((s) => (
        <span key={s.key} className="flex items-center gap-1">
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-bold text-gray-700 border border-gray-300">{s.key}</kbd>
          <span>{s.label}</span>
        </span>
      ))}
      <span className="ml-4">(Press <kbd className='rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-bold text-gray-700 border border-gray-300'>⌘</kbd> + <kbd className='rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-bold text-gray-700 border border-gray-300'>/</kbd> for help)</span>
    </div>
  )
}
