import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Bell,
  BookOpen,
  Calendar,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Gauge,
  HeartHandshake,
  Home,
  Info,
  LogOut,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Plus,
  Search,
  Settings,
  Shield,
  User,
  Wrench,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { useIdleTimer } from '@/hooks/useIdleTimer'
import { useVehicles } from '@/hooks/useVehicles'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/stores/appStore'

const VEHICLES = [
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
]

const MOCK_SERVICES = [
  {
    id: 1,
    title: '15,000 Mile Service',
    date: 'Mar 12, 2024',
    location: 'Mazda Downtown Dealership',
    details: ['Oil & Filter Change', 'Tire Rotation', 'Multi-Point Inspection'],
  },
  {
    id: 2,
    title: 'Brake Pad Replacement',
    date: 'Nov 05, 2023',
    location: 'Mazda Downtown Dealership',
    details: ['Front Brake Pads', 'Rotor Resurfacing'],
  },
]

const DEALERSHIPS = [
  {
    id: 1,
    name: 'Mazda Downtown Service Center',
    distance: '2.4 miles away',
    rating: 4.9,
  },
]

// Helper function to get vehicle image by model
function getVehicleImage(model: string): string {
  const vehicle = VEHICLES.find((v) => v.model === model)
  return vehicle?.image || 'https://images.unsplash.com/photo-1743114713503-b698b8433f03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXpkYSUyMGN4NSUyMGdyZXklMjBzdXZ8ZW58MXx8fHwxNzc1NTQ3MDIzfDA&ixlib=rb-4.1.0&q=80&w=1080'
}

type TabId = 'home' | 'garage' | 'map' | 'profile'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface NavButtonProps {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}

interface AddCarWizardValues {
  selectedVehicleId: string
  year: number
  vin: string
  registration: string
  fuelType: 'petrol' | 'diesel'
  engineSize: string
  mileageInterval: 5000 | 7000 | 9000 | 10000
}

function NavButton({ icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex h-12 w-16 flex-col items-center justify-center transition-colors ${
        isActive ? 'text-[#A31526]' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <div className={`mb-1 transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>{icon}</div>
      <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-[#A31526]' : 'text-gray-500'}`}>
        {label}
      </span>
    </button>
  )
}

function EmptyHomeState({ userName, onAdd }: { userName: string; onAdd: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-6 p-6">
      {/* Greeting */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome, {userName}! 👋
        </h2>
        <p className="mt-2 text-[15px] text-gray-600">
          Let's get your digital garage set up.
        </p>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex w-full flex-col items-center rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        {/* Large Car Icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <Car className="h-10 w-10 text-[#A31526]" strokeWidth={1.5} />
        </div>

        {/* Text Content */}
        <h3 className="mb-2 text-lg font-bold text-gray-900">No Vehicles Yet</h3>
        <p className="mb-6 text-center text-sm text-gray-600">
          Add your Mazda to start tracking service intervals.
        </p>

        {/* Add Vehicle Button */}
        <button
          onClick={onAdd}
          className="w-full rounded-xl bg-[#A31526] px-6 py-3.5 text-center font-bold text-white hover:bg-[#8B1220] active:scale-95"
        >
          Add My First Mazda
        </button>
      </motion.div>
    </div>
  )
}

function EmptyGarageState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mt-8 flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-8 flex h-40 w-40 items-center justify-center rounded-full border-8 border-gray-50 bg-white shadow-sm">
        <div className="absolute inset-0 rounded-full bg-red-50 opacity-50 animate-pulse" />
        <Car className="relative z-10 h-16 w-16 text-[#A31526]" strokeWidth={1.5} />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-gray-900">Your garage is empty!</h2>
      <p className="mb-10 px-4 text-[15px] leading-relaxed text-gray-500">
        Ready to get started? Tap the button below to add your first Mazda and track your services.
      </p>
      <button
        onClick={onAdd}
        className="group flex w-full max-w-[280px] items-center justify-center gap-2 rounded-2xl bg-[#A31526] px-6 py-4 text-lg font-bold text-white shadow-lg shadow-[#A31526]/30 hover:bg-[#8B1220] active:scale-95"
      >
        <Plus className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" />
        Add My First Mazda
      </button>
    </div>
  )
}

function ServicesLog({
  onAdd,
  primaryVehicle,
}: {
  onAdd: () => void
  primaryVehicle: {
    model: string
    year: number
    registration: string
  } | null
}) {
  const title = primaryVehicle ? `${primaryVehicle.year} Mazda ${primaryVehicle.model}` : 'Your Primary Vehicle'
  const subtitle = primaryVehicle ? `Plate: ${primaryVehicle.registration}` : 'Your garage is ready'

  return (
    <div className="space-y-6 p-6">
      <div className="relative flex items-center justify-between overflow-hidden rounded-3xl bg-[#A31526] p-5 text-white shadow-lg">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10">
          <p className="mb-1 text-sm font-semibold text-red-100">Your Primary Vehicle</p>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-red-100">{subtitle}</p>
        </div>
        <button
          onClick={onAdd}
          className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-start gap-4 rounded-2xl border border-orange-100 bg-orange-50 p-4 shadow-sm">
        <div className="shrink-0 rounded-full bg-orange-100 p-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-orange-900">Next Service Due</h3>
          <p className="mb-3 mt-0.5 text-sm text-orange-700">Oil change recommended in 500 miles.</p>
          <button className="w-full rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700 shadow-sm active:scale-95">
            Book Appointment
          </button>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="ml-1 text-sm font-bold uppercase tracking-wider text-gray-400">Past Services</h3>
        {MOCK_SERVICES.map((service) => (
          <div key={service.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Calendar className="h-4 w-4" />
                {service.date}
              </div>
              <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Done
              </div>
            </div>
            <h4 className="mb-1 text-lg font-bold text-gray-900">{service.title}</h4>
            <div className="mb-4 flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              {service.location}
            </div>
            <div className="space-y-1.5 rounded-xl bg-gray-50 p-3">
              {service.details.map((detail) => (
                <div key={detail} className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                  {detail}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AddCarWizard({
  onComplete,
  saving,
}: {
  onComplete: (values: AddCarWizardValues) => Promise<void>
  saving: boolean
}) {
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const [details, setDetails] = useState({
    year: '',
    registration: '',
    vin: '',
    fuelType: 'petrol' as 'petrol' | 'diesel',
    engineSize: '',
    mileageInterval: 5000 as 5000 | 7000 | 9000 | 10000,
  })

  const ENGINE_OPTIONS = [
    { value: '1.5L Petrol', label: '1.5L Petrol' },
    { value: '1.5L Diesel', label: '1.5L Diesel' },
    { value: '2.0L Petrol', label: '2.0L Petrol' },
    { value: '2.2L Diesel', label: '2.2L Diesel' },
    { value: '2.5L Petrol', label: '2.5L Petrol' },
  ]

  const MILEAGE_OPTIONS: Array<5000 | 7000 | 9000 | 10000> = [5000, 7000, 9000, 10000]

  const isValid =
    details.year.length >= 4 &&
    details.registration.trim().length >= 3 &&
    details.engineSize.length > 0 &&
    Boolean(selected)

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex gap-2 px-6 py-4">
        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-[#A31526]' : 'bg-gray-200'}`} />
        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-[#A31526]' : 'bg-gray-200'}`} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {step === 1 ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Which Mazda?</h2>
              <p className="mt-1 text-sm text-gray-500">Select your model to begin.</p>
            </div>
            <div className="grid gap-4">
              {VEHICLES.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => setSelected(vehicle.id)}
                  className={`relative overflow-hidden rounded-2xl border-2 text-left transition-all ${
                    selected === vehicle.id ? 'border-[#A31526] ring-4 ring-red-50' : 'border-gray-100'
                  }`}
                >
                  <div className="relative h-32 w-full">
                    <img src={vehicle.image} alt={vehicle.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    {selected === vehicle.id ? (
                      <div className="absolute right-3 top-3 rounded-full bg-[#A31526] p-1 text-white">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    ) : null}
                    <div className="absolute bottom-3 left-4 text-white">
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{vehicle.type}</p>
                      <p className="text-lg font-bold leading-tight">{vehicle.name}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Car Details</h2>
              <p className="mt-1 text-sm text-gray-500">Let&apos;s verify your vehicle and tailor your service schedule.</p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="ml-1 text-sm font-semibold text-gray-700">Year</label>
                <input
                  type="number"
                  placeholder="e.g. 2021"
                  value={details.year}
                  onChange={(event) => setDetails({ ...details, year: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 outline-none focus:border-[#A31526] focus:ring-2 focus:ring-[#A31526]/20"
                />
              </div>
              <div>
                <label className="ml-1 text-sm font-semibold text-gray-700">Registration</label>
                <input
                  type="text"
                  placeholder="KDA 123A"
                  value={details.registration}
                  onChange={(event) => setDetails({ ...details, registration: event.target.value.toUpperCase() })}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 uppercase outline-none focus:border-[#A31526] focus:ring-2 focus:ring-[#A31526]/20"
                />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <label className="ml-1 text-sm font-semibold text-gray-700">VIN</label>
                  <span className="text-[11px] font-medium text-gray-400">Optional</span>
                </div>
                <input
                  type="text"
                  placeholder="JM3KF..."
                  maxLength={17}
                  value={details.vin}
                  onChange={(event) => setDetails({ ...details, vin: event.target.value.toUpperCase() })}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 uppercase outline-none focus:border-[#A31526] focus:ring-2 focus:ring-[#A31526]/20"
                />
                <div className="mt-2 flex gap-2 px-1 text-gray-500">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <p className="text-xs leading-relaxed">Find your VIN on the driver&apos;s side dashboard or registration card.</p>
                </div>
              </div>
              <div>
                <label className="ml-1 text-sm font-semibold text-gray-700">Fuel Type</label>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  {(['petrol', 'diesel'] as const).map((fuel) => (
                    <button
                      key={fuel}
                      type="button"
                      onClick={() => setDetails({ ...details, fuelType: fuel })}
                      className={`rounded-2xl border px-4 py-3.5 text-sm font-semibold capitalize transition ${
                        details.fuelType === fuel
                          ? fuel === 'petrol'
                            ? 'border-[#A31526] bg-red-50 text-[#A31526]'
                            : 'border-[#1A3A6B] bg-blue-50 text-[#1A3A6B]'
                          : 'border-gray-200 bg-gray-50 text-gray-500'
                      }`}
                    >
                      {fuel}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="ml-1 text-sm font-semibold text-gray-700">Engine Size</label>
                <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {ENGINE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDetails({ ...details, engineSize: opt.value })}
                      className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        details.engineSize === opt.value
                          ? 'border-[#A31526] bg-red-50 text-[#A31526] shadow-sm'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="ml-1 text-sm font-semibold text-gray-700">Service Interval</label>
                <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {MILEAGE_OPTIONS.map((interval) => (
                    <button
                      key={interval}
                      type="button"
                      onClick={() => setDetails({ ...details, mileageInterval: interval })}
                      className={`relative shrink-0 rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                        details.mileageInterval === interval
                          ? 'border-[#A31526] bg-red-50 text-[#A31526] shadow-sm'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-base font-bold">{(interval / 1000).toFixed(0)}</span>
                      <span className="ml-0.5 text-xs">k km</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 px-1 text-xs text-gray-400">Recommended: 5,000 km for city driving, 10,000 km for highway.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-white p-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
        {step === 1 ? (
          <button
            onClick={() => setStep(2)}
            disabled={!selected}
            className={`w-full rounded-xl py-4 text-lg font-bold transition-all ${
              selected ? 'bg-[#A31526] text-white shadow-lg' : 'bg-gray-100 text-gray-400'
            }`}
          >
            Next Step
          </button>
        ) : (
          <button
            onClick={() => {
              if (!selected) return
              void onComplete({
                selectedVehicleId: selected,
                year: Number(details.year),
                vin: details.vin,
                registration: details.registration,
                fuelType: details.fuelType,
                engineSize: details.engineSize,
                mileageInterval: details.mileageInterval,
              })
            }}
            disabled={!isValid || saving}
            className={`w-full rounded-xl py-4 text-lg font-bold transition-all ${
              isValid && !saving ? 'animate-pulse bg-[#A31526] text-white shadow-lg' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {saving ? 'Saving Vehicle...' : 'Save Vehicle'}
          </button>
        )}
      </div>
    </div>
  )
}

function MapFinder() {
  return (
    <div className="relative flex h-full flex-col">
      <div className="absolute inset-0 z-0 bg-gray-200">
        <img
          src="https://images.unsplash.com/photo-1543365095-3892d8135a3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb29nbGUlMjBtYXBzJTIwc3RyZWV0JTIwdmlldyUyMG1hcCUyMGludGVyZmFjZXxlbnwxfHx8fDE3NzU1NDg3MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Map"
          className="h-full w-full object-cover opacity-60 mix-blend-multiply"
        />
        <div className="absolute left-1/2 top-[40%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center animate-bounce">
          <div className="rounded-full border-2 border-white bg-[#A31526] p-2.5 text-white shadow-lg">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="mt-1 h-2 w-2 rounded-full bg-black/30 blur-[2px]" />
        </div>
      </div>

      <div className="relative z-10 p-4">
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-lg">
          <Search className="ml-1 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search service centers..."
            className="flex-1 bg-transparent text-[15px] outline-none"
            readOnly
          />
          <div className="h-6 w-px bg-gray-200" />
          <MapPin className="mr-1 h-5 w-5 text-[#A31526]" />
        </div>
      </div>

      <div className="absolute bottom-4 z-20 w-full px-4">
        {DEALERSHIPS.map((dealership) => (
          <div key={dealership.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-2xl">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold leading-tight text-gray-900">{dealership.name}</h2>
                <p className="mt-1 text-sm font-semibold text-[#A31526]">{dealership.distance}</p>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-xs font-bold text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {dealership.rating}
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button className="flex flex-1 justify-center gap-2 rounded-xl bg-[#A31526] py-3.5 text-[15px] font-bold text-white shadow-lg hover:bg-[#8B1220]">
                <Navigation className="h-4 w-4" />
                Directions
              </button>
              <button className="flex w-14 items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200">
                <Phone className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SettingsView({
  user,
  onLogout,
  isLoggingOut,
}: {
  user: { fullName: string; email: string }
  onLogout: () => Promise<void>
  isLoggingOut: boolean
}) {
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  return (
    <div className="p-6 pb-32">
      <div className="space-y-6">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <User className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user.fullName}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {[
          {
            title: 'Account',
            items: [
              { icon: User, title: 'Personal Details' },
              { icon: Shield, title: 'Password & Security' },
            ],
          },
          {
            title: 'Preferences',
            items: [
              { icon: Bell, title: 'Push Notifications' },
              { icon: Car, title: 'Garage Display' },
            ],
          },
          {
            title: 'Support',
            items: [
              { icon: MessageSquare, title: 'Contact Dealership' },
              { icon: Info, title: 'App Feedback' },
            ],
          },
        ].map((group) => (
          <div key={group.title} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
              {group.title}
            </div>
            {group.items.map((item, index) => (
              <div
                key={item.title}
                className={`flex items-center justify-between bg-white p-4 active:bg-gray-50 ${
                  index !== group.items.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-gray-400" />
                  <span className="text-[15px] font-medium text-gray-800">{item.title}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </div>
            ))}
          </div>
        ))}

        <button
          onClick={() => setShowLogoutModal(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#A31526] py-4 text-lg font-bold text-[#A31526] active:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </button>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">MazdaCare App v1.0.0 (Phase 4)</p>
          <p className="mt-1 text-xs text-gray-400 underline">Privacy Policy & Terms</p>
        </div>
      </div>

      <AnimatePresence>
        {showLogoutModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="mb-8 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl sm:mb-0"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <LogOut className="h-6 w-6 text-[#A31526]" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Leaving so soon?</h3>
              <p className="mb-6 text-[15px] leading-relaxed text-gray-500">
                Are you sure you want to log out of MazdaCare? We&apos;ll keep your garage safe until you return.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                  className="flex-1 rounded-xl bg-gray-100 py-3.5 font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-70"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void onLogout()}
                  disabled={isLoggingOut}
                  className="flex-1 rounded-xl bg-[#A31526] py-3.5 font-bold text-white shadow-lg shadow-[#A31526]/20 hover:bg-[#8B1220] disabled:opacity-70"
                >
                  {isLoggingOut ? 'Logging out...' : 'Yes, Log Out'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function Phase4Shell() {
  useIdleTimer()
  const user = useAppStore((state) => state.user)
  const clearAll = useAppStore((state) => state.clearAll)

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    clearAll()
  }
  const { vehicles, fetchVehicles, addVehicle, loading } = useVehicles()
  const [activeTab, setActiveTab] = useState<TabId>('garage')
  const [isAddingCar, setIsAddingCar] = useState(false)
  const [showPWAPrompt, setShowPWAPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [pwaDismissed, setPwaDismissed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    void fetchVehicles().catch(() => undefined)
  }, [fetchVehicles])

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    if (isStandalone) {
      setShowPWAPrompt(false)
      return
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setShowPWAPrompt(true)
    }

    function onAppInstalled() {
      setDeferredPrompt(null)
      setShowPWAPrompt(false)
      setPwaDismissed(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const hasCars = vehicles.length > 0
  const primaryVehicle = vehicles[0] ?? null
  const profileName = useMemo(() => user?.user_metadata?.full_name ?? user?.email ?? 'MazdaCare Driver', [user])
  const profileEmail = user?.email ?? 'No email available'

  const getHeaderTitle = () => {
    if (isAddingCar) return 'Add Your Mazda'
    switch (activeTab) {
      case 'garage':
        return hasCars ? 'My Garage' : 'Welcome'
      case 'map':
        return 'Find Service'
      case 'profile':
        return 'Settings & Profile'
      case 'home':
      default:
        return 'MazdaCare'
    }
  }

  async function handleInstallApp() {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPWAPrompt(false)
      setPwaDismissed(true)
    }

    setDeferredPrompt(null)
  }

  async function handleVehicleComplete(values: AddCarWizardValues) {
    const selectedVehicle = VEHICLES.find((vehicle) => vehicle.id === values.selectedVehicleId)

    if (!selectedVehicle) {
      toast.error('Please choose a Mazda model first.')
      return
    }

    try {
      await addVehicle({
        model: selectedVehicle.model,
        year: values.year,
        vin: values.vin,
        fuelType: values.fuelType,
        engineSize: values.engineSize,
        registration: values.registration,
        currentMileage: 0,
        mileageInterval: values.mileageInterval,
        color: selectedVehicle.color,
      })
      setIsAddingCar(false)
      setActiveTab('garage')
      toast.success('Vehicle added successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save vehicle.'
      toast.error(message)
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await signOut()
    } catch {
      toast.error("We couldn't log you out right now. Please check your connection.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full justify-center overflow-hidden bg-neutral-100 font-sans">
      <div className="relative flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl">
        <AnimatePresence>
          {showPWAPrompt && !pwaDismissed && !isAddingCar && activeTab === 'garage' ? (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="absolute top-0 z-50 w-full p-4 pt-6"
            >
              <div className="flex items-center justify-between rounded-2xl bg-gray-900 p-4 text-white shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1">
                    <span className="text-lg font-black tracking-tighter text-[#A31526]">
                      M<span className="text-gray-900">C</span>
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Install MazdaCare</h3>
                    <p className="text-xs text-gray-400">Add to Home Screen</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowPWAPrompt(false)} className="p-2 text-gray-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => void handleInstallApp()}
                    className="flex items-center gap-1 rounded-xl bg-[#A31526] px-3 py-2 text-xs font-bold text-white transition-transform active:scale-95"
                  >
                    <Download className="h-3 w-3" />
                    Install
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white px-5 pb-4 pt-12">
          <div className="flex items-center gap-3">
            {isAddingCar ? (
              <button onClick={() => setIsAddingCar(false)} className="-ml-2 rounded-full p-2 text-gray-400 hover:bg-gray-50">
                <ChevronLeft className="h-6 w-6" />
              </button>
            ) : null}
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              {!isAddingCar && activeTab === 'garage' && !hasCars ? (
                <>
                  Mazda<span className="text-[#A31526]">Care</span>
                </>
              ) : (
                getHeaderTitle()
              )}
            </h1>
          </div>
        </div>

        <div className="relative flex-1 overflow-y-auto bg-gray-50/50 pb-24">
          <AnimatePresence mode="wait">
            {isAddingCar ? (
              <motion.div key="add-car" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                <AddCarWizard onComplete={handleVehicleComplete} saving={loading} />
              </motion.div>
            ) : (
              <motion.div key="main-tabs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                {activeTab === 'garage' && (!hasCars ? <EmptyGarageState onAdd={() => setIsAddingCar(true)} /> : <ServicesLog onAdd={() => setIsAddingCar(true)} primaryVehicle={primaryVehicle ? { model: primaryVehicle.model, year: primaryVehicle.year, registration: primaryVehicle.registration } : null} />)}
                {activeTab === 'map' ? <MapFinder /> : null}
                {activeTab === 'profile' ? <SettingsView user={{ fullName: profileName, email: profileEmail }} onLogout={handleLogout} isLoggingOut={isLoggingOut} /> : null}
                {activeTab === 'home' ? (
                  !hasCars ? (
                    <EmptyHomeState userName={profileName?.split(' ')[0] || 'Driver'} onAdd={() => setIsAddingCar(true)} />
                  ) : (
                    <div className="flex h-full flex-col justify-start space-y-6 p-6">
                      {/* Personalized Greeting */}
                      <div className="pt-4">
                        <h2 className="text-2xl font-bold text-gray-900">
                          Good morning, {profileName?.split(' ')[0] || 'Driver'}!
                      </h2>
                      <p className="mt-1 text-[15px] text-gray-600">
                        Here is your daily vehicle overview.
                      </p>
                    </div>

                    {/* Hero Vehicle Card */}
                    {primaryVehicle ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md"
                      >
                        {/* Car Image Container */}
                        <div className="relative h-48 w-full overflow-hidden bg-gray-200">
                          <img
                            src={getVehicleImage(primaryVehicle.model)}
                            alt={`${primaryVehicle.year} Mazda ${primaryVehicle.model}`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {/* Black-to-Transparent Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

                          {/* Status Badge - Top Right */}
                          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-md">
                            <CheckCircle2 className="h-4 w-4 text-green-400" strokeWidth={2.5} />
                            <span className="text-xs font-semibold text-white">All Good</span>
                          </div>

                          {/* Year & Model - Bottom Left */}
                          <div className="absolute bottom-4 left-4 space-y-0.5">
                            <p className="text-sm font-semibold text-white">
                              {primaryVehicle.year} Mazda
                            </p>
                            <p className="text-lg font-bold text-white">{primaryVehicle.model}</p>
                          </div>

                          {/* Mileage - Bottom Right */}
                          <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-md">
                            <Gauge className="h-4 w-4 text-white" strokeWidth={2.5} />
                            <span className="text-sm font-semibold text-white">
                              {primaryVehicle.currentMileage.toLocaleString()} mi
                            </span>
                          </div>
                        </div>

                        {/* Vehicle Details Footer */}
                        <div className="space-y-3 border-t border-gray-100 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Registration
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {primaryVehicle.registration}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Next Service
                            </span>
                            <span className="text-sm font-semibold text-[#A31526]">
                              {primaryVehicle.nextServiceMileage?.toLocaleString() || 'N/A'} mi
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="flex h-64 items-center justify-center rounded-3xl border border-gray-100 bg-white">
                        <div className="text-center">
                          <Car className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                          <p className="text-sm font-medium text-gray-600">
                            Add your first vehicle to see it here
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Service Due Alert Banner */}
                    {primaryVehicle && primaryVehicle.nextServiceMileage && primaryVehicle.nextServiceMileage - primaryVehicle.currentMileage < 1000 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex gap-4 rounded-2xl border border-orange-100 bg-orange-50 p-4"
                      >
                        <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-600" strokeWidth={2} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-900">
                            Oil change recommended soon.
                          </p>
                          <p className="mt-1 text-xs text-orange-700">
                            {primaryVehicle.nextServiceMileage - primaryVehicle.currentMileage} miles remaining
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Quick Actions Header */}
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                        Quick Actions
                      </h3>
                    </div>

                    {/* Quick Actions Grid */}
                    {primaryVehicle && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 }}
                        className="grid grid-cols-2 gap-3"
                      >
                        {/* Find Service Button */}
                        <button
                          onClick={() => setActiveTab('map')}
                          className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm hover:border-gray-200 active:bg-gray-50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                            <MapPin className="h-5 w-5 text-[#A31526]" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Find Service
                            </p>
                            <p className="text-xs text-gray-600">Nearby garages</p>
                          </div>
                        </button>

                        {/* Book Appointment Button */}
                        <button
                          onClick={() => setActiveTab('garage')}
                          className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm hover:border-gray-200 active:bg-gray-50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                            <Calendar className="h-5 w-5 text-blue-600" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Book Appt
                            </p>
                            <p className="text-xs text-gray-600">Schedule now</p>
                          </div>
                        </button>

                        {/* Roadside Assistance Button */}
                        <button
                          className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm hover:border-gray-200 active:bg-gray-50"
                          disabled
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
                            <HeartHandshake className="h-5 w-5 text-yellow-600" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Roadside
                            </p>
                            <p className="text-xs text-gray-600">Emergency help</p>
                          </div>
                        </button>

                        {/* Manuals Button */}
                        <button
                          className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm hover:border-gray-200 active:bg-gray-50"
                          disabled
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                            <BookOpen className="h-5 w-5 text-gray-600" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Manuals
                            </p>
                            <p className="text-xs text-gray-600">User guides</p>
                          </div>
                        </button>
                      </motion.div>
                    )}

                    {/* Quick Stats */}
                    {primaryVehicle && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Fuel Type
                          </p>
                          <p className="mt-2 text-lg font-bold text-gray-900 capitalize">
                            {primaryVehicle.fuelType}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Engine Size
                          </p>
                          <p className="mt-2 text-lg font-bold text-gray-900">
                            {primaryVehicle.engineSize}
                          </p>
                        </div>
                      </motion.div>
                    )}
                    </div>
                  )
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isAddingCar ? (
          <div className="absolute bottom-0 z-40 w-full max-w-md border-t border-gray-200 bg-white pb-[calc(env(safe-area-inset-bottom,0px)+8px)] shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-around px-2 py-2.5">
              <NavButton icon={<Home className="h-6 w-6" />} label="Home" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
              <NavButton icon={<Car className="h-6 w-6" />} label="Garage" isActive={activeTab === 'garage'} onClick={() => setActiveTab('garage')} />
              <NavButton icon={<MapPin className="h-6 w-6" />} label="Map" isActive={activeTab === 'map'} onClick={() => setActiveTab('map')} />
              <NavButton icon={<Settings className="h-6 w-6" />} label="Settings" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
