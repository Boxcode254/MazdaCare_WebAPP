export interface VINInfo {
  isValid: boolean
  make?: string
  year?: number
  plant?: string
  fuelHint?: 'petrol' | 'diesel'
  error?: string
}

export function decodeVIN(vin: string): VINInfo {
  const cleaned = vin.trim().toUpperCase().replace(/[IOQ]/g, '') // I, O, Q not used in VINs
  if (cleaned.length !== 17) return { isValid: false, error: 'VIN must be 17 characters' }

  // Position 1-3: World Manufacturer Identifier
  const wmi = cleaned.slice(0, 3)
  const isMazda = ['JMZ', 'JM1', 'MM8', 'JM3'].includes(wmi) // Mazda WMI codes
  if (!isMazda) return { isValid: false, error: 'Does not appear to be a Mazda VIN' }

  // Position 10: Model year
  const yearChars: Record<string, number> = {
    A: 2010,
    B: 2011,
    C: 2012,
    D: 2013,
    E: 2014,
    F: 2015,
    G: 2016,
    H: 2017,
    J: 2018,
    K: 2019,
    L: 2020,
    M: 2021,
    N: 2022,
    P: 2023,
    R: 2024,
    S: 2025,
    T: 2026,
    V: 2027,
    W: 2028,
    X: 2029,
    Y: 2030,
  }
  const yearChar = cleaned[9]
  const year = yearChars[yearChar]

  // Position 7: Engine/fuel hint (simplified)
  const engineCode = cleaned[6]
  const dieselEngines = ['2', '3'] // Mazda diesel engine position codes
  const fuelHint = dieselEngines.includes(engineCode) ? 'diesel' : 'petrol'

  return { isValid: true, make: 'Mazda', year, fuelHint }
}

export function formatVIN(raw: string): string {
  // Uppercase, remove invalid chars, limit 17
  return raw.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17)
}
