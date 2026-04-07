import { AlertCircle, MapPin, Plus } from 'lucide-react'

interface ServiceEntry {
  id: string
  date: string
  title: string
  location: string
  items: string[]
}

const mockServices: ServiceEntry[] = [
  {
    id: 'svc-15000',
    date: 'Apr 02, 2026',
    title: '15,000 Mile Service',
    location: 'Mazda Service Center, Nairobi',
    items: ['Oil & Filter Change', 'Cabin Filter Replacement', 'Multi-point Inspection'],
  },
  {
    id: 'svc-brakes',
    date: 'Jan 18, 2026',
    title: 'Brake Pad Replacement',
    location: 'Autocare Garage, Westlands',
    items: ['Front Brake Pad Replacement', 'Brake Fluid Top-up', 'Brake System Test Drive'],
  },
]

export function ServicesLog() {
  return (
    <section className="bg-gray-50/50 px-4 pb-8 pt-4">
      <div className="mx-auto max-w-md space-y-5">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-bold leading-tight text-gray-900">Service History</h1>
            <p className="mt-1 text-sm text-gray-500">Keep track of your Mazda&apos;s health.</p>
          </div>

          <button
            type="button"
            aria-label="Log new service"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#A31526] text-white shadow-lg shadow-[#A31526]/30"
          >
            <Plus className="h-5 w-5" />
          </button>
        </header>

        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <AlertCircle className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-orange-900">Next Service Due</p>
              <p className="mt-1 text-sm text-orange-800">Oil change recommended in 500 miles or by May 15.</p>
              <button
                type="button"
                className="mt-3 inline-flex items-center rounded-xl bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Past Services</p>

          {mockServices.map((service) => (
            <article key={service.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-500">{service.date}</p>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Done
                </span>
              </div>

              <h2 className="mt-3 text-lg font-semibold text-gray-900">{service.title}</h2>

              <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>{service.location}</span>
              </div>

              <div className="mt-4 space-y-2.5">
                {service.items.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300" aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
