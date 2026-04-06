export interface EngineOil {
  brand: string
  grade: string
  type: 'synthetic' | 'semi-synthetic' | 'mineral'
  suitableFor: string[]
  fuelType: ('petrol' | 'diesel')[]
  availableIn: string[]
  approxPriceKes: number
}

export const KENYA_MAZDA_OILS: EngineOil[] = [
  {
    brand: 'Mazda Genuine Oil',
    grade: '0W-20',
    type: 'synthetic',
    suitableFor: ['CX-5', 'CX-3', 'Axela', 'Atenza'],
    fuelType: ['petrol'],
    availableIn: ['Mazda Kenya Dealer', 'DT Dobie'],
    approxPriceKes: 4500,
  },
  {
    brand: 'Mazda Genuine Oil',
    grade: '5W-30',
    type: 'synthetic',
    suitableFor: ['Demio', 'Axela', 'CX-5', 'BT-50'],
    fuelType: ['petrol', 'diesel'],
    availableIn: ['Mazda Kenya Dealer', 'DT Dobie'],
    approxPriceKes: 4200,
  },
  {
    brand: 'Castrol EDGE',
    grade: '5W-30',
    type: 'synthetic',
    suitableFor: ['CX-5', 'CX-3', 'Axela', 'Atenza', 'Demio'],
    fuelType: ['petrol', 'diesel'],
    availableIn: ['Total Energies Kenya', 'Autozone', 'Nakumatt'],
    approxPriceKes: 3800,
  },
  {
    brand: 'Castrol GTX',
    grade: '10W-40',
    type: 'semi-synthetic',
    suitableFor: ['Demio', 'Axela'],
    fuelType: ['petrol'],
    availableIn: ['Total Energies Kenya', 'Carrefour', 'Nakumatt'],
    approxPriceKes: 2400,
  },
  {
    brand: 'Mobil 1',
    grade: '0W-20',
    type: 'synthetic',
    suitableFor: ['CX-5', 'CX-9', 'Atenza'],
    fuelType: ['petrol'],
    availableIn: ['ExxonMobil Kenya dealers', 'Autozone'],
    approxPriceKes: 4800,
  },
  {
    brand: 'Mobil Super 3000',
    grade: '5W-40',
    type: 'synthetic',
    suitableFor: ['BT-50', 'CX-5 diesel'],
    fuelType: ['diesel'],
    availableIn: ['ExxonMobil Kenya dealers'],
    approxPriceKes: 3600,
  },
  {
    brand: 'Total Quartz 9000',
    grade: '5W-30',
    type: 'synthetic',
    suitableFor: ['Demio', 'Axela', 'CX-3', 'CX-5'],
    fuelType: ['petrol'],
    availableIn: ['Total Energies Kenya stations'],
    approxPriceKes: 3500,
  },
  {
    brand: 'Total Rubia TIR 8600',
    grade: '10W-40',
    type: 'mineral',
    suitableFor: ['BT-50'],
    fuelType: ['diesel'],
    availableIn: ['Total Energies Kenya stations'],
    approxPriceKes: 2800,
  },
  {
    brand: 'Shell Helix Ultra',
    grade: '5W-30',
    type: 'synthetic',
    suitableFor: ['CX-5', 'CX-3', 'Axela', 'Atenza', 'Demio'],
    fuelType: ['petrol', 'diesel'],
    availableIn: ['Shell Kenya stations', 'Autozone'],
    approxPriceKes: 3900,
  },
]

export function getRecommendedOils(model: string, fuelType: 'petrol' | 'diesel') {
  const normalizedModel = model.toLowerCase()

  return KENYA_MAZDA_OILS.filter(
    (oil) =>
      oil.fuelType.includes(fuelType) && oil.suitableFor.some((candidate) => candidate.toLowerCase().includes(normalizedModel))
  )
}
