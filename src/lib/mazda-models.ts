export const MAZDA_MODELS = [
  'Demio',
  'Axela',
  'CX-3',
  'CX-5',
  'CX-7',
  'CX-9',
  'Atenza',
  'BT-50',
  'Premacy',
  'MPV',
  'Tribute',
] as const

export type MazdaModel = (typeof MAZDA_MODELS)[number]
