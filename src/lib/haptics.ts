function vibrate(pattern: number | number[]) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return
  }

  navigator.vibrate(pattern)
}

export const haptics = {
  light: () => vibrate(10),
  medium: () => vibrate(20),
  success: () => vibrate([10, 50, 10]),
  error: () => vibrate([20, 50, 20, 50, 20]),
}