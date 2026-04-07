function vibrate(pattern: number | number[]) {
  if (typeof navigator === 'undefined') {
    return
  }

  navigator.vibrate?.(pattern)
}

export const haptics = {
  light: () => vibrate(10),
  medium: () => vibrate(25),
  success: () => vibrate([10, 60, 15]),
  error: () => vibrate([20, 50, 20, 50, 30]),
  tap: () => vibrate(8),
}
