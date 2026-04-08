import { useEffect } from "react"

// Map of key to action
const KEY_ACTIONS: Record<string, () => void> = {}

export function registerKeyboardShortcut(key: string, action: () => void) {
  KEY_ACTIONS[key] = action
}

export function unregisterKeyboardShortcut(key: string) {
  delete KEY_ACTIONS[key]
}

export default function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only trigger on desktop (ignore if touch or mobile)
      if (window.innerWidth < 1024) return
      // Ignore if input, textarea, or contenteditable is focused
      const tag = (e.target as HTMLElement)?.tagName
      const editable = (e.target as HTMLElement)?.isContentEditable
      if (tag === "INPUT" || tag === "TEXTAREA" || editable) return
      const key = e.key.toLowerCase()
      if (KEY_ACTIONS[key]) {
        e.preventDefault()
        KEY_ACTIONS[key]()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])
}
