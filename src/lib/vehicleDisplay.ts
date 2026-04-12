export const MAZDA_VEHICLE_CATALOG = [
  {
    id: 'cx5',
    model: 'CX-5' as const,
    name: 'Mazda CX-5',
    type: 'SUV',
    color: 'Grey',
    image:
      'https://images.unsplash.com/photo-1743114713503-b698b8433f03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXpkYSUyMGN4NSUyMGdyZXklMjBzdXZ8ZW58MXx8fHwxNzc1NTQ3MDIzfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'demio',
    model: 'Demio' as const,
    name: 'Mazda Demio / 2',
    type: 'City Car',
    color: 'White',
    image:
      'https://images.unsplash.com/photo-1756664825749-d481c5a94a57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXpkYSUyMDIlMjBzbWFsbCUyMHdoaXRlJTIwY2FyfGVufDF8fHx8MTc3NTU0NzAyNnww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'mazda3',
    model: 'Axela' as const,
    name: 'Mazda 3',
    type: 'Hatchback',
    color: 'Blue',
    image:
      'https://images.unsplash.com/photo-1754908132913-559fbdf12a36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXpkYSUyMDMlMjBibHVlJTIwaGF0Y2hiYWNrfGVufDF8fHx8MTc3NTU0NzAyM3ww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'mx5',
    model: 'MX-5' as const,
    name: 'Mazda MX-5',
    type: 'Convertible',
    color: 'Red',
    image:
      'https://images.unsplash.com/photo-1633118013371-4aed8e7fbae9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXpkYSUyMG14NSUyMHJlZCUyMGNvbnZlcnRpYmxlfGVufDF8fHx8MTc3NTU0NzAyM3ww&ixlib=rb-4.1.0&q=80&w=1080',
  },
] as const

function normalizeVehicleModel(model: string) {
  const normalized = model.trim().toLowerCase()

  if (normalized === 'mazda 3' || normalized === 'mazda3') {
    return 'axela'
  }

  return normalized
}

export function getVehicleImage(model: string): string {
  const normalizedModel = normalizeVehicleModel(model)
  const matched = MAZDA_VEHICLE_CATALOG.find(
    (vehicle) => normalizeVehicleModel(vehicle.model) === normalizedModel,
  )

  return (
    matched?.image ||
    'https://images.unsplash.com/photo-1743114713503-b698b8433f03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  )
}