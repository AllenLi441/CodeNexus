export const appleEase = [0.22, 1, 0.36, 1] as const

export const appleSpring = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 36,
  mass: 0.86,
}

export const softSpring = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 30,
  mass: 0.9,
}

export const quickFade = {
  duration: 0.22,
  ease: appleEase,
}
