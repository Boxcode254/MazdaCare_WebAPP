import manualCatalog from '@/data/mazdaManualCatalog.json'

export interface MazdaManualLink {
  title: string
  pdfUrl: string | null
  onlineUrl: string | null
}

export interface MazdaManualSection {
  catalogModel: string
  sectionLabel: string
  matchedYearLabel: string
  exactYear: boolean
  links: MazdaManualLink[]
}

export interface MazdaManualLookupResult {
  sections: MazdaManualSection[]
  generalFallbackUrl: string
  note?: string
}

interface CatalogModelEntry {
  label: string
  csvFile: string
  years: Record<string, MazdaManualLink[]>
}

type CatalogModelName = keyof typeof manualCatalog.models

type VehicleModelName =
  | 'Demio'
  | 'Axela'
  | 'MX-5'
  | 'CX-3'
  | 'CX-5'
  | 'CX-7'
  | 'CX-9'
  | 'Atenza'
  | 'BT-50'
  | 'Premacy'
  | 'MPV'
  | 'Tribute'

const GENERAL_MANUALS_URL = 'https://www.mazda.ca/en/mazda-owners/Overview/owner-manuals/'
const AUSTRALIA_OWNERS_URL = 'https://www.mazda.com.au/owners/'

const MODEL_LOOKUP: Record<VehicleModelName, Array<{ catalogModel: CatalogModelName; sectionLabel: string }>> = {
  Demio: [{ catalogModel: 'Mazda2', sectionLabel: 'Mazda2' }],
  Axela: [
    { catalogModel: 'Mazda3 Sport', sectionLabel: 'Axela hatchback' },
    { catalogModel: 'Mazda3', sectionLabel: 'Axela sedan' },
  ],
  'MX-5': [{ catalogModel: 'MX-5', sectionLabel: 'MX-5' }],
  'CX-3': [{ catalogModel: 'CX-3', sectionLabel: 'CX-3' }],
  'CX-5': [{ catalogModel: 'CX-5', sectionLabel: 'CX-5' }],
  'CX-7': [{ catalogModel: 'CX-7', sectionLabel: 'CX-7' }],
  'CX-9': [{ catalogModel: 'CX-9', sectionLabel: 'CX-9' }],
  Atenza: [{ catalogModel: 'Mazda6', sectionLabel: 'Mazda6 / Atenza' }],
  'BT-50': [],
  Premacy: [{ catalogModel: 'Mazda5', sectionLabel: 'Mazda5 / Premacy' }],
  MPV: [{ catalogModel: 'MPV', sectionLabel: 'MPV' }],
  Tribute: [{ catalogModel: 'Tribute', sectionLabel: 'Tribute' }],
}

function toYearNumber(label: string): number {
  return Number.parseFloat(label)
}

function pickBestYearLabels(year: number, availableLabels: string[]): { labels: string[]; exactYear: boolean } {
  const sameYearLabels = availableLabels.filter((label) => Math.floor(toYearNumber(label)) === year)
  if (sameYearLabels.length > 0) {
    return {
      labels: sameYearLabels.sort((a, b) => toYearNumber(b) - toYearNumber(a)),
      exactYear: true,
    }
  }

  const closestLabel = [...availableLabels].sort((a, b) => {
    const distanceA = Math.abs(toYearNumber(a) - year)
    const distanceB = Math.abs(toYearNumber(b) - year)
    if (distanceA !== distanceB) return distanceA - distanceB
    return toYearNumber(b) - toYearNumber(a)
  })[0]

  return {
    labels: closestLabel ? [closestLabel] : [],
    exactYear: false,
  }
}

function dedupeLinks(links: MazdaManualLink[]): MazdaManualLink[] {
  const seen = new Set<string>()
  return links.filter((link) => {
    const key = `${link.title}|${link.pdfUrl ?? ''}|${link.onlineUrl ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function lookupMazdaManuals(model: string, year: number): MazdaManualLookupResult {
  const mapping = MODEL_LOOKUP[model as VehicleModelName]

  if (!mapping || mapping.length === 0) {
    return {
      sections: [],
      generalFallbackUrl: model === 'BT-50' ? AUSTRALIA_OWNERS_URL : GENERAL_MANUALS_URL,
      note:
        model === 'BT-50'
          ? 'BT-50 manuals vary by market, so we fall back to Mazda Australia owner resources.'
          : 'We could not match this Mazda model to our official manual catalog yet.',
    }
  }

  const sections = mapping.flatMap(({ catalogModel, sectionLabel }) => {
    const modelEntry = manualCatalog.models[catalogModel] as CatalogModelEntry
    const availableLabels = Object.keys(modelEntry?.years ?? {})
    if (availableLabels.length === 0) {
      return []
    }

    const { labels, exactYear } = pickBestYearLabels(year, availableLabels)

    return labels.flatMap((matchedYearLabel) => {
      const links = dedupeLinks(modelEntry.years[matchedYearLabel] ?? [])
      if (links.length === 0) {
        return []
      }

      return {
        catalogModel,
        sectionLabel,
        matchedYearLabel,
        exactYear,
        links,
      }
    })
  })

  const note = sections.some((section) => !section.exactYear)
    ? 'We matched the closest official Mazda manual year available for this vehicle.'
    : undefined

  return {
    sections,
    generalFallbackUrl: GENERAL_MANUALS_URL,
    note,
  }
}
