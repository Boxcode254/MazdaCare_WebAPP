import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Calendar,
  Car,
  ChartNoAxesColumn,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Info,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  Shield,
  User,
  X,
  Wrench,
  Droplets,
  CircleDot,
  AlertCircle,
  Menu,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { VehicleListCard } from '@/components/car/VehicleListCard'
import { VehicleDetailView } from '@/components/car/VehicleDetailView'
import MazdaLogo from '@/components/ui/MazdaLogo'
import { CostAnalytics } from '@/components/service/CostAnalytics'
import { LogService } from '@/pages/LogService'
import { Sheet, SheetClose, SheetContent } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useAlerts } from '@/hooks/useAlerts'
import { useServiceLogs } from '@/hooks/useServiceLogs'
import { useVehicles } from '@/hooks/useVehicles'
import { useAuth } from '@/hooks/useAuth'
import { haptics } from '@/lib/haptics'
import { lookupMazdaManuals, type MazdaManualLookupResult } from '@/lib/mazdaManuals'
import { resolveVehicleServiceSnapshot, type VehicleServiceSnapshot } from '@/lib/serviceState'
import { sanitizeMileage, sanitizeText } from '@/lib/sanitize'
import { supabase } from '@/lib/supabase'
import { MAZDA_VEHICLE_CATALOG } from '@/lib/vehicleDisplay'
import { useAppStore } from '@/stores/appStore'
import { decodeVIN, formatVIN, type VINInfo } from '@/lib/vinDecoder'
import { KeyboardShortcutLegend } from '@/components/layout/KeyboardShortcutLegend'
import { ShortcutsHelpDialog } from '@/components/layout/ShortcutsHelpDialog'
import useKeyboardShortcuts, {
  registerKeyboardShortcut,
  unregisterKeyboardShortcut,
} from '@/hooks/useKeyboardShortcuts'
import type { Vehicle, ServiceLog } from '@/types'

// ─── Static vehicle catalogue ──────────────────────────────────────────────

const VEHICLES = MAZDA_VEHICLE_CATALOG

// ─── Types ─────────────────────────────────────────────────────────────────

type TabId = 'vehicles' | 'events' | 'notifications' | 'settings'

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

// ─── MazdaManualSheet sub-component ────────────────────────────────────────

function MazdaManualSheet({
  vehicle,
  lookup,
  isOpen,
  onOpenChange,
}: {
  vehicle: Vehicle
  lookup: MazdaManualLookupResult | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const hasSections = Boolean(lookup?.sections && lookup.sections.length > 0)

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-[28px] px-5 pt-6 pb-10">
        <AnimatePresence>
          {lookup ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-5">
                <h2
                  className="text-[#111010]"
                  style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '22px',
                    fontStyle: 'italic',
                    fontWeight: 300,
                    lineHeight: 1.1,
                  }}
                >
                  Official Mazda manuals
                </h2>
                <p className="mt-1 text-[11px] text-black/40" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {vehicle.registration} · {vehicle.model} {vehicle.year}
                </p>
                <p className="mt-2 text-[12px] text-gray-600" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  PDF manuals sourced from Mazda owner resources.
                </p>
              </div>

              <div className="space-y-4 pt-5">
                {lookup.note ? (
                  <div className="rounded-2xl border border-[#E3CDD1] bg-[#FCF5F6] px-4 py-3 text-[12px] text-[#7F2432]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {lookup.note}
                  </div>
                ) : null}

                {hasSections ? (
                  <div className="space-y-3">
                    {lookup.sections.map((section) => (
                      <div key={`${section.catalogModel}-${section.matchedYearLabel}-${section.sectionLabel}`} className="rounded-[22px] border border-[#EDE2E4] bg-[#FCFAFA] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
                              {section.sectionLabel}
                            </p>
                            <p className="mt-1 text-[16px] font-semibold text-[#111010]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                              {section.matchedYearLabel} manual set
                            </p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${section.exactYear ? 'bg-[#EEF6F1] text-[#2E7D4F]' : 'bg-[#F7E8EA] text-[#9B1B30]'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                            {section.exactYear ? 'Exact year' : 'Closest match'}
                          </span>
                        </div>
                        <div className="mt-4 space-y-2.5">
                          {section.links.map((link) => (
                            <div key={`${section.catalogModel}-${section.matchedYearLabel}-${link.title}`} className="rounded-2xl border border-white bg-white/90 px-3 py-3 shadow-sm">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-[14px] font-semibold text-[#111010]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    {link.title}
                                  </p>
                                  <p className="mt-1 text-[11px] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    Official Mazda documentation
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  {link.pdfUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => { haptics.tap(); window.open(link.pdfUrl!, '_blank', 'noopener,noreferrer') }}
                                      className="inline-flex items-center gap-1 rounded-full bg-[#9B1B30] px-3 py-2 text-[11px] font-semibold text-white"
                                      style={{ fontFamily: 'Outfit, sans-serif' }}
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      PDF
                                    </button>
                                  ) : null}
                                  {link.onlineUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => { haptics.tap(); window.open(link.onlineUrl!, '_blank', 'noopener,noreferrer') }}
                                      className="inline-flex items-center gap-1 rounded-full border border-[#D7C1C5] bg-white px-3 py-2 text-[11px] font-semibold text-[#7F2432]"
                                      style={{ fontFamily: 'Outfit, sans-serif' }}
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                      Online
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[22px] border border-[#EDE2E4] bg-[#FCFAFA] p-4">
                    <p className="text-[14px] font-semibold text-[#111010]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Manual not matched yet
                    </p>
                    <p className="mt-2 text-[12px] text-gray-600" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      We could not find a direct PDF match for this exact vehicle in the bundled official catalog.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <SheetClose asChild>
                    <button
                      type="button"
                      className="flex-1 rounded-xl border border-[#E3CDD1] bg-white px-4 py-3.5 text-[14px] font-semibold text-[#9B1B30]"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      Close
                    </button>
                  </SheetClose>
                  <button
                    type="button"
                    onClick={() => { haptics.tap(); window.open(lookup.generalFallbackUrl, '_blank', 'noopener,noreferrer') }}
                    className="flex-1 rounded-xl bg-[#A31526] px-4 py-3.5 text-[14px] font-semibold text-white"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    Browse Mazda owner site
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  )
}

// ─── NavButton ──────────────────────────────────────────────────────────────

function NavButton({ icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex h-12 w-16 flex-col items-center justify-center rounded-2xl transition-all ${
        isActive ? 'text-[#991728]' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <span
        className={`absolute inset-x-3 top-0 h-[3px] rounded-full transition-all ${
          isActive ? 'bg-[#C2263D] opacity-100' : 'bg-transparent opacity-0'
        }`}
      />
      <div className={`mb-1 transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>{icon}</div>
      <span className={`text-[10px] font-bold tracking-[0.08em] ${isActive ? 'text-[#991728]' : 'text-gray-500'}`}>
        {label}
      </span>
    </button>
  )
}

// ─── Empty state components ─────────────────────────────────────────────────

function EmptyHomeState({ userName, onAdd }: { userName: string; onAdd: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome, {userName}!</h2>
        <p className="mt-2 text-[15px] text-gray-600">Let's get your digital garage set up.</p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex w-full flex-col items-center rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <Car className="h-10 w-10 text-[#A31526]" strokeWidth={1.5} />
        </div>
        <h3 className="mb-2 text-lg font-bold text-gray-900">No Vehicles Yet</h3>
        <p className="mb-6 text-center text-sm text-gray-600">
          Add your Mazda to start tracking service intervals.
        </p>
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

function NewUserOnboardingState({
  email, fullName, phoneNumber, onSaveProfile, saving,
}: {
  email: string
  fullName: string
  phoneNumber: string
  onSaveProfile: (values: { fullName: string; phoneNumber: string }) => Promise<void>
  saving: boolean
}) {
  const [draftName, setDraftName] = useState(fullName)
  const [draftPhone, setDraftPhone] = useState(phoneNumber)
  const isFormValid = draftName.trim().length >= 2 && draftPhone.trim().length >= 8

  useEffect(() => { setDraftName(fullName); setDraftPhone(phoneNumber) }, [fullName, phoneNumber])

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      <div className="pt-4">
        <h2 className="text-2xl font-bold text-gray-900">Let's finish your profile</h2>
        <p className="mt-1 text-[15px] text-gray-600">Add your details once, then we'll set up your first Mazda.</p>
      </div>
      <div className="space-y-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Email</label>
          <p className="mt-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">{email}</p>
        </div>
        <div>
          <label htmlFor="onboarding-full-name" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Full name</label>
          <input id="onboarding-full-name" type="text" value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g. Natasha Wanjiru" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-[#A31526] focus:ring-2 focus:ring-[#A31526]/10" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="onboarding-phone" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Phone number</label>
          <input id="onboarding-phone" type="tel" value={draftPhone} onChange={(e) => setDraftPhone(e.target.value.replace(/[^\d+\s()-]/g, ''))} placeholder="e.g. +254 712 345678" className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-[#A31526] focus:ring-2 focus:ring-[#A31526]/10" autoComplete="tel" />
        </div>
        <button type="button" onClick={() => void onSaveProfile({ fullName: draftName, phoneNumber: draftPhone })} disabled={!isFormValid || saving} className="w-full rounded-xl bg-[#A31526] px-5 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? 'Saving profile…' : 'Continue'}
        </button>
      </div>
      <p className="text-center text-xs text-gray-500">Step 1 of 2: profile details. Step 2: add your Mazda vehicle.</p>
    </div>
  )
}


// ─── AddCarWizard ────────────────────────────────────────────────────────────

function AddCarWizard({ onComplete, saving }: { onComplete: (values: AddCarWizardValues) => Promise<void>; saving: boolean }) {
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const [vinInfo, setVinInfo] = useState<VINInfo | null>(null)
  const [fuelTypeTouched, setFuelTypeTouched] = useState(false)
  const [details, setDetails] = useState({
    year: '',
    registration: '',
    vin: '',
    fuelType: 'petrol' as 'petrol' | 'diesel',
    engineSize: '',
    mileageInterval: 5000 as 5000 | 7000 | 9000 | 10000,
  })

  const handleVinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatVIN(event.target.value)
    const info = formatted.length === 17 ? decodeVIN(formatted) : null
    setVinInfo(info)
    setDetails((prev) => ({
      ...prev,
      vin: formatted,
      year: info?.isValid && prev.year === '' && info.year ? String(info.year) : prev.year,
      fuelType: info?.isValid && !fuelTypeTouched && info.fuelHint ? info.fuelHint : prev.fuelType,
    }))
  }

  const ENGINE_OPTIONS = [
    { value: '1.5L Petrol', label: '1.5L Petrol' },
    { value: '1.5L Diesel', label: '1.5L Diesel' },
    { value: '2.0L Petrol', label: '2.0L Petrol' },
    { value: '2.2L Diesel', label: '2.2L Diesel' },
    { value: '2.5L Petrol', label: '2.5L Petrol' },
  ]

  const MILEAGE_OPTIONS: Array<5000 | 7000 | 9000 | 10000> = [5000, 7000, 9000, 10000]

  const isValid = details.year.length >= 4 && details.registration.trim().length >= 3 && details.engineSize.length > 0 && Boolean(selected)

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
                <button key={vehicle.id} onClick={() => setSelected(vehicle.id)} className={`relative overflow-hidden rounded-2xl border-2 text-left transition-all ${selected === vehicle.id ? 'border-[#A31526] ring-4 ring-red-50' : 'border-gray-100'}`}>
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
              <p className="mt-1 text-sm text-gray-500">Let's verify your vehicle and tailor your service schedule.</p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="ml-1 text-sm font-semibold text-gray-700">Year</label>
                <input type="number" placeholder="e.g. 2021" value={details.year} onChange={(e) => setDetails({ ...details, year: e.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 outline-none focus:border-[#A31526] focus:ring-2 focus:ring-[#A31526]/20" />
              </div>
              <div>
                <label className="ml-1 text-sm font-semibold text-gray-700">Registration</label>
                <input type="text" placeholder="KDA 123A" value={details.registration} onChange={(e) => setDetails({ ...details, registration: e.target.value.toUpperCase() })} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 uppercase outline-none focus:border-[#A31526] focus:ring-2 focus:ring-[#A31526]/20" />
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-1 flex items-center gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">VIN (optional)</label>
                </div>
                <div className="mb-3 flex items-start gap-1.5 text-gray-500">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                  <p className="text-[11px] leading-relaxed">Found on your logbook, windscreen, or driver door jamb.</p>
                </div>
                <input type="text" placeholder="17-CHARACTER VIN" maxLength={17} value={details.vin} onChange={handleVinChange} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 font-mono text-sm uppercase tracking-widest outline-none transition-colors focus:border-[#A31526] focus:ring-2 focus:ring-[#A31526]/20 placeholder:tracking-normal" />
                <div className="mt-1 flex justify-end">
                  <span className="text-[11px] font-medium text-gray-500">{details.vin.length} / 17</span>
                </div>
                {vinInfo && details.vin.length === 17 && (
                  <div className="mt-2 text-[12px] font-medium">
                    {vinInfo.isValid ? (
                      <div className="flex items-center gap-1.5 text-[#2E7D4F]">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Mazda confirmed — {vinInfo.year} · {vinInfo.fuelHint}</span>
                      </div>
                    ) : (
                      <div className="ml-1 text-[#A31526]">Invalid VIN — you can skip this field</div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="ml-1 text-sm font-semibold text-gray-700">Fuel Type</label>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  {(['petrol', 'diesel'] as const).map((fuel) => (
                    <button key={fuel} type="button" onClick={() => { setFuelTypeTouched(true); setDetails({ ...details, fuelType: fuel }) }}
                      className={`rounded-2xl border px-4 py-3.5 text-sm font-semibold capitalize transition ${details.fuelType === fuel ? fuel === 'petrol' ? 'border-[#A31526] bg-red-50 text-[#A31526]' : 'border-[#1A3A6B] bg-blue-50 text-[#1A3A6B]' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                      {fuel}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="ml-1 text-sm font-semibold text-gray-700">Engine Size</label>
                <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {ENGINE_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setDetails({ ...details, engineSize: opt.value })}
                      className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-semibold transition ${details.engineSize === opt.value ? 'border-[#A31526] bg-red-50 text-[#A31526] shadow-sm' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="ml-1 text-sm font-semibold text-gray-700">Service Interval</label>
                <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {MILEAGE_OPTIONS.map((interval) => (
                    <button key={interval} type="button" onClick={() => setDetails({ ...details, mileageInterval: interval })}
                      className={`relative shrink-0 rounded-xl border px-5 py-3 text-sm font-semibold transition ${details.mileageInterval === interval ? 'border-[#A31526] bg-red-50 text-[#A31526] shadow-sm' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'}`}>
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
          <button onClick={() => setStep(2)} disabled={!selected} className={`w-full rounded-xl py-4 text-lg font-bold transition-all ${selected ? 'bg-[#A31526] text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
            Next Step
          </button>
        ) : (
          <button onClick={() => { if (!selected) return; haptics.medium(); void onComplete({ selectedVehicleId: selected, year: Number(details.year), vin: details.vin, registration: details.registration, fuelType: details.fuelType, engineSize: details.engineSize, mileageInterval: details.mileageInterval }) }} disabled={!isValid || saving}
            className={`w-full rounded-xl py-4 text-lg font-bold transition-all ${isValid && !saving ? 'animate-pulse bg-[#A31526] text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
            {saving ? 'Saving Vehicle...' : 'Save Vehicle'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── SettingsView ────────────────────────────────────────────────────────────

function SettingsView({
  user, primaryVehicle, serviceLogs, onLogout, isLoggingOut,
}: {
  user: { fullName: string; email: string; phone: string }
  primaryVehicle: { id: string; model: string; year: number; registration: string } | null
  serviceLogs: ServiceLog[]
  onLogout: () => Promise<void>
  isLoggingOut: boolean
}) {
  const PUSH_NOTIFICATION_STORAGE_KEY = 'mc_push_notifications_enabled'
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [subView, setSubView] = useState<'menu' | 'cost-analytics' | 'personal-details' | 'garage-display'>('menu')
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true)

  const garageVisitStats = useMemo(() => {
    const grouped = new Map<string, { garageName: string; visits: number; latestVisit: number }>()
    for (const log of serviceLogs) {
      const garageName = log.garageName?.trim() || 'Garage not specified'
      const serviceDate = new Date(log.serviceDate).getTime()
      const existing = grouped.get(garageName)
      if (!existing) { grouped.set(garageName, { garageName, visits: 1, latestVisit: serviceDate }); continue }
      existing.visits += 1
      existing.latestVisit = Math.max(existing.latestVisit, serviceDate)
    }
    return Array.from(grouped.values()).sort((a, b) => b.visits !== a.visits ? b.visits - a.visits : b.latestVisit - a.latestVisit)
  }, [serviceLogs])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PUSH_NOTIFICATION_STORAGE_KEY)
      if (stored !== null) {
        setPushNotificationsEnabled(stored === 'true')
        return
      }
    } catch { /* storage unavailable */ }

    setPushNotificationsEnabled(typeof Notification !== 'undefined' && Notification.permission === 'granted')
  }, [])

  const handlePushToggle = async (enabled: boolean) => {
    haptics.tap()

    if (typeof Notification === 'undefined') {
      toast.error('Push notifications are not supported in this browser.')
      return
    }

    if (!enabled) {
      setPushNotificationsEnabled(false)
      try { window.localStorage.setItem(PUSH_NOTIFICATION_STORAGE_KEY, 'false') } catch { /* storage unavailable */ }
      toast.info('Push notifications turned off for MazdaCare on this device.')
      return
    }

    if (Notification.permission === 'granted') {
      setPushNotificationsEnabled(true)
      try { window.localStorage.setItem(PUSH_NOTIFICATION_STORAGE_KEY, 'true') } catch { /* storage unavailable */ }
      toast.success('Notifications enabled!')
      return
    }

    if (Notification.permission === 'denied') {
      setPushNotificationsEnabled(false)
      try { window.localStorage.setItem(PUSH_NOTIFICATION_STORAGE_KEY, 'false') } catch { /* storage unavailable */ }
      toast.error('Notifications are blocked. Enable them in browser site settings first.')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setPushNotificationsEnabled(true)
      try { window.localStorage.setItem(PUSH_NOTIFICATION_STORAGE_KEY, 'true') } catch { /* storage unavailable */ }
      toast.success('Notifications enabled!')
      return
    }

    setPushNotificationsEnabled(false)
    try { window.localStorage.setItem(PUSH_NOTIFICATION_STORAGE_KEY, 'false') } catch { /* storage unavailable */ }
    toast.error('Permission denied. Enable in browser settings.')
  }

  if (subView === 'cost-analytics') {
    return (
      <div className="p-6 pb-32">
        <button type="button" onClick={() => setSubView('menu')} className="mb-4 inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-[12px] font-semibold text-gray-600" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <ChevronLeft className="h-4 w-4" /> Back to Settings
        </button>
        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-[#111010]" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.1 }}>Cost analytics</h2>
          <p className="mt-1 text-[11px] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {primaryVehicle ? `${primaryVehicle.registration} · ${primaryVehicle.model} ${primaryVehicle.year}` : 'Add a vehicle to view analytics'}
          </p>
        </div>
        {primaryVehicle ? (
          <CostAnalytics serviceLogs={serviceLogs} vehicleId={primaryVehicle.id} />
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
            <p className="text-[13px] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>No vehicle found for analytics yet.</p>
          </div>
        )}
      </div>
    )
  }

  if (subView === 'personal-details') {
    return (
      <div className="p-6 pb-32">
        <button type="button" onClick={() => setSubView('menu')} className="mb-4 inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-[12px] font-semibold text-gray-600" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <ChevronLeft className="h-4 w-4" /> Back to Settings
        </button>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Personal Details</h2>
          <p className="mt-1 text-[13px] text-gray-500">Profile details used across MazdaCare.</p>
          <div className="mt-5 space-y-4">
            {[{ label: 'Full name', value: user.fullName }, { label: 'Email', value: user.email }, { label: 'Phone number', value: user.phone || 'Not set yet' }].map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-100 bg-[#FCFAFA] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">{item.label}</p>
                <p className="mt-1 text-sm font-medium text-[#111010]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (subView === 'garage-display') {
    return (
      <div className="p-6 pb-32">
        <button type="button" onClick={() => setSubView('menu')} className="mb-4 inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-[12px] font-semibold text-gray-600" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <ChevronLeft className="h-4 w-4" /> Back to Settings
        </button>
        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Garage Display</h2>
          <p className="mt-1 text-[13px] text-gray-500">Garages visited, sorted by number of visits.</p>
        </div>
        <div className="space-y-3">
          {garageVisitStats.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
              <p className="text-[13px] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>No garages logged yet.</p>
            </div>
          ) : (
            garageVisitStats.map((garage) => (
              <div key={garage.garageName} className="rounded-2xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14px] font-semibold text-[#111010]">{garage.garageName}</p>
                  <span className="rounded-full bg-[#F5E8EA] px-3 py-1 text-[11px] font-semibold text-[#9B1B30]">
                    {garage.visits} visit{garage.visits === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

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
            <p className="text-xs text-gray-400">{user.phone || 'No phone number yet'}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Account</div>
          {[
            { label: 'Personal Details', icon: <User className="h-5 w-5 text-gray-400" />, action: () => { haptics.tap(); setSubView('personal-details') } },
            { label: 'Password & Security', icon: <Shield className="h-5 w-5 text-gray-400" />, action: undefined },
            { label: 'Cost Analytics', icon: <ChartNoAxesColumn className="h-5 w-5 text-gray-400" />, action: () => { haptics.tap(); setSubView('cost-analytics') } },
          ].map((item) => (
            <button key={item.label} type="button" onClick={item.action} className="flex w-full items-center justify-between border-b border-gray-50 bg-white p-4 last:border-b-0 active:bg-gray-50">
              <div className="flex items-center gap-3">{item.icon}<span className="text-[15px] font-medium text-gray-800">{item.label}</span></div>
              <ChevronRight className="h-5 w-5 text-gray-300" />
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Preferences</div>
          <div className={`flex items-center justify-between border-b border-gray-50 p-4 transition-all duration-200 ${pushNotificationsEnabled ? 'bg-[linear-gradient(90deg,rgba(249,234,236,0.9),rgba(255,255,255,1))]' : 'bg-white'}`}>
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${pushNotificationsEnabled ? 'bg-[#F9EAEC] shadow-[0_10px_22px_rgba(143,19,38,0.14)]' : 'bg-gray-100'}`}>
                <Bell className={`h-5 w-5 ${pushNotificationsEnabled ? 'text-[#8F1326]' : 'text-gray-400'}`} />
              </span>
              <div>
                <p className={`text-[15px] font-medium transition-colors duration-200 ${pushNotificationsEnabled ? 'text-[#8F1326]' : 'text-gray-800'}`}>Push Notifications</p>
                <p className="text-[12px] text-gray-500">{pushNotificationsEnabled ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
            <Switch checked={pushNotificationsEnabled} onCheckedChange={(checked) => { void handlePushToggle(checked) }} className="h-6 w-11" />
          </div>
          <button type="button" onClick={() => { haptics.tap(); setSubView('garage-display') }} className="flex w-full items-center justify-between bg-white p-4 active:bg-gray-50">
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 text-gray-400" />
              <div className="text-left">
                <p className="text-[15px] font-medium text-gray-800">Garage Display</p>
                <p className="text-[12px] text-gray-500">{garageVisitStats.length} garage{garageVisitStats.length === 1 ? '' : 's'} visited</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300" />
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Support</div>
          {[
            { label: 'Contact Dealership', icon: <MessageSquare className="h-5 w-5 text-gray-400" /> },
            { label: 'App Feedback', icon: <Info className="h-5 w-5 text-gray-400" /> },
          ].map((item) => (
            <button key={item.label} type="button" className="flex w-full items-center justify-between border-b border-gray-50 bg-white p-4 last:border-b-0 active:bg-gray-50">
              <div className="flex items-center gap-3">{item.icon}<span className="text-[15px] font-medium text-gray-800">{item.label}</span></div>
              <ChevronRight className="h-5 w-5 text-gray-300" />
            </button>
          ))}
        </div>

        <button onClick={() => setShowLogoutModal(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#A31526] py-4 text-lg font-bold text-[#A31526] active:bg-red-50">
          <LogOut className="h-5 w-5" />
          Log Out
        </button>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">MazdaCare App v1.0.0</p>
          <p className="mt-1 text-xs text-gray-400 underline">Privacy Policy &amp; Terms</p>
        </div>
      </div>

      <AnimatePresence>
        {showLogoutModal ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="mb-8 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl sm:mb-0">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <LogOut className="h-6 w-6 text-[#A31526]" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Leaving so soon?</h3>
              <p className="mb-6 text-[15px] leading-relaxed text-gray-500">
                Are you sure you want to log out of MazdaCare? We'll keep your garage safe until you return.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={() => setShowLogoutModal(false)} disabled={isLoggingOut} className="flex-1 rounded-xl bg-gray-100 py-3.5 font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-70">Cancel</button>
                <button onClick={() => void onLogout()} disabled={isLoggingOut} className="flex-1 rounded-xl bg-[#A31526] py-3.5 font-bold text-white shadow-lg shadow-[#A31526]/20 hover:bg-[#8B1220] disabled:opacity-70">
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

// ─── Events tab (Service History) ────────────────────────────────────────────

function EventsTabContent({
  logs,
  activeVehicleId,
}: {
  logs: ServiceLog[]
  activeVehicleId: string | null
}) {

  const vehicleLogs = useMemo(
    () => (activeVehicleId ? logs.filter((l) => l.vehicleId === activeVehicleId) : logs),
    [logs, activeVehicleId],
  )

  const SERVICE_TYPE_STYLES: Record<string, { bg: string; icon: React.ReactNode; badge: string }> = {
    minor: { bg: 'bg-[#F9EAEC]', icon: <Wrench className="h-4 w-4 text-[#A31526]" />, badge: 'bg-[#F9EAEC] text-[#A31526]' },
    major: { bg: 'bg-[#111010]', icon: <Wrench className="h-4 w-4 text-white" />, badge: 'bg-[#111010] text-white' },
    oil_change: { bg: 'bg-[#FFF8EC]', icon: <Droplets className="h-4 w-4 text-[#C49A3C]" />, badge: 'bg-[#FFF8EC] text-[#7A5C14]' },
    tyre_rotation: { bg: 'bg-[#EDF3FF]', icon: <CircleDot className="h-4 w-4 text-[#1A3A9B]" />, badge: 'bg-[#EDF3FF] text-[#1A3A9B]' },
    brake_service: { bg: 'bg-[#EAFAF0]', icon: <CircleDot className="h-4 w-4 text-[#2E7D4F]" />, badge: 'bg-[#EAFAF0] text-[#2E7D4F]' },
    other: { bg: 'bg-[#F5F1F1]', icon: <Wrench className="h-4 w-4 text-[#7A6E70]" />, badge: 'bg-[#F5F1F1] text-[#7A6E70]' },
  }

  if (vehicleLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F1F1]">
          <Calendar className="h-6 w-6 text-[#C9C0C1]" />
        </div>
        <p className="text-[15px] font-semibold text-gray-700">No services logged yet</p>
        <p className="mt-1 text-[13px] text-gray-400">Tap + to add your first service entry</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-4 pb-28">
      {vehicleLogs.map((log) => {
        const style = SERVICE_TYPE_STYLES[log.serviceType] ?? SERVICE_TYPE_STYLES.other
        return (
          <div key={log.id} className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.bg}`}>{style.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-[13px] font-bold text-gray-900">{log.serviceType.replace(/_/g, ' ')}</p>
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${style.badge}`}>
                  {log.serviceType.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-gray-500">{log.garageName || 'Garage not recorded'}</p>
              {log.rating ? (
                <p className="mt-0.5 text-[10px] text-[#C49A3C]">{'★'.repeat(log.rating)}{'☆'.repeat(5 - log.rating)}</p>
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] text-gray-400">{log.serviceDate}</p>
              {log.serviceCost != null ? (
                <p className="mt-0.5 text-[12px] font-bold text-gray-900">KES {log.serviceCost.toLocaleString()}</p>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Notifications tab ────────────────────────────────────────────────────────

function NotificationsTabContent({
  vehicles,
  serviceSnapshots,
}: {
  vehicles: Vehicle[]
  serviceSnapshots: Record<string, VehicleServiceSnapshot>
}) {
  const dueVehicles = vehicles
    .map((vehicle) => ({
      vehicle,
      snapshot: serviceSnapshots[vehicle.id] ?? resolveVehicleServiceSnapshot(vehicle),
    }))
    .filter(({ snapshot }) => snapshot.status === 'overdue' || snapshot.status === 'due-soon')

  return (
    <div className="space-y-3 p-4 pb-28">
      {dueVehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F1F1]">
            <Bell className="h-6 w-6 text-[#C9C0C1]" />
          </div>
          <p className="text-[15px] font-semibold text-gray-700">No alerts right now</p>
          <p className="mt-1 text-[13px] text-gray-400">We'll notify you when a service is due</p>
        </div>
      ) : (
        dueVehicles.map(({ vehicle, snapshot }) => {
          const accent = snapshot.status === 'overdue' ? '#8F1326' : '#B88A37'
          const title = snapshot.status === 'overdue'
            ? 'Service overdue'
            : snapshot.kmRemaining != null
              ? `Service due soon — ${Math.max(snapshot.kmRemaining, 0).toLocaleString()} km`
              : 'Service due soon'
          const detail = snapshot.dueMileage != null
            ? `Next at ${snapshot.dueMileage.toLocaleString()} km`
            : snapshot.dueDate
              ? `Due by ${snapshot.dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
              : 'Reminder active'

          return (
            <div key={vehicle.id} className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm ${snapshot.status === 'overdue' ? 'border-l-4 border-l-[#8F1326] border-gray-100' : 'border-gray-100'}`}>
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${accent}14` }}
              >
                <AlertCircle className="h-5 w-5" style={{ color: accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-gray-900">
                  {title}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-500">{vehicle.make} {vehicle.model} · {vehicle.registration}</p>
                <p className="mt-0.5 text-[10px] text-gray-400">{detail}</p>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── MileageUpdateSheet ───────────────────────────────────────────────────────

function MileageUpdateSheet({
  vehicle,
  serviceSnapshot,
  isOpen,
  onOpenChange,
  onSave,
  saving,
  onOpenLogService,
}: {
  vehicle: Vehicle | null
  serviceSnapshot: VehicleServiceSnapshot | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSave: (value: number) => Promise<void>
  saving: boolean
  onOpenLogService: (mileage: number) => void
}) {
  const [draftMileage, setDraftMileage] = useState('')

  useEffect(() => {
    if (isOpen && vehicle) setDraftMileage(String(vehicle.currentMileage))
  }, [isOpen, vehicle])

  if (!vehicle) return null

  const parsed = parseInt(draftMileage.replace(/,/g, ''), 10)
  const isValid = !isNaN(parsed) && parsed > vehicle.currentMileage && parsed <= vehicle.currentMileage + 200000
  const delta = !isNaN(parsed) ? parsed - vehicle.currentMileage : 0
  const nextService = serviceSnapshot?.dueMileage ?? null
  const comparisonMileage = isValid ? parsed : vehicle.currentMileage
  const intervalStartMileage = serviceSnapshot?.latestLog?.mileageAtService ?? vehicle.currentMileage
  const kmLeft = nextService == null ? null : nextService - comparisonMileage
  const pct = nextService == null
    ? 0
    : Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((comparisonMileage - intervalStartMileage) / Math.max(nextService - intervalStartMileage, 1)) * 100,
          ),
        ),
      )
  const barColor = kmLeft != null && kmLeft <= 0 ? '#8F1326' : pct >= 90 ? '#8F1326' : pct >= 60 ? '#B88A37' : '#2C6A4A'

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-[28px] px-0 pt-0 pb-0">
        <div className="bg-[#0F0A0B] px-5 pb-5 pt-6 rounded-t-[28px]">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">Update mileage</p>
          <h2 className="text-white" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontStyle: 'italic', fontWeight: 300 }}>
            {vehicle.make} {vehicle.model}
          </h2>
          <p className="mt-1 text-[11px] text-white/35">{vehicle.registration} · {vehicle.year}</p>
        </div>
        <div className="space-y-4 bg-[#F5F1F1] p-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500">Last recorded</p>
                <p className="mt-0.5 text-[18px] font-bold text-gray-900">{vehicle.currentMileage.toLocaleString()} km</p>
              </div>
              <span className="rounded-full bg-[#FFF8EC] px-2.5 py-1 text-[10px] font-semibold text-[#7A5C14]">
                {new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500">New mileage (km)</label>
              <input
                type="number"
                value={draftMileage}
                onChange={(e) => setDraftMileage(e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-[20px] font-bold outline-none transition-colors ${isValid ? 'border-[#A31526] bg-white text-gray-900' : 'border-gray-200 bg-gray-50 text-gray-900'} focus:border-[#A31526] focus:ring-2 focus:ring-[#A31526]/10`}
                placeholder={String(vehicle.currentMileage)}
              />
              {draftMileage && !isNaN(parsed) && (
                <p className={`mt-1.5 text-[11px] font-medium ${isValid ? 'text-[#2E7D4F]' : 'text-[#A31526]'}`}>
                  {isValid ? `+${delta.toLocaleString()} km since last update · looks right` : parsed <= vehicle.currentMileage ? `Must be higher than current reading (${vehicle.currentMileage.toLocaleString()} km)` : 'That seems too high — please double-check'}
                </p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            {nextService != null ? (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[12px] text-gray-600">Next service at</p>
                  <p className="text-[14px] font-bold text-[#8F1326]">{nextService.toLocaleString()} km</p>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#F5F1F1]">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
                </div>
                <div className="mt-1.5 flex justify-between">
                  <p className="text-[10px] text-gray-400">{pct}% used</p>
                  <p className="text-[10px] font-semibold" style={{ color: barColor }}>{Math.max(0, kmLeft ?? 0).toLocaleString()} km left</p>
                </div>
              </>
            ) : (
              <div>
                <p className="text-[12px] font-semibold text-[#211A1D]">Exact next-service target unavailable</p>
                <p className="mt-1 text-[11px] text-gray-500">
                  Log a service to track the next due mileage from actual service history instead of a default interval estimate.
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <SheetClose asChild>
              <button type="button" className="flex-1 rounded-xl border border-[#E3CDD1] bg-white px-4 py-3.5 text-[14px] font-semibold text-[#A31526]">Cancel</button>
            </SheetClose>
            <button type="button" disabled={!isValid || saving} onClick={() => void onSave(parsed)}
              className="flex-[2] rounded-xl bg-[#A31526] px-4 py-3.5 text-[14px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? 'Saving...' : 'Save mileage'}
            </button>
          </div>
          <button type="button" onClick={() => { if (isValid) onOpenLogService(parsed) }}
            className="w-full text-center text-[12px] text-gray-500 underline underline-offset-2">
            Or log a full service instead →
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Phase4Shell — main component ────────────────────────────────────────────

function Phase4Shell() {
  const { user, session, signOut } = useAuth()
  const activeVehicleId = useAppStore((state) => state.activeVehicleId)
  const setActiveVehicleId = useAppStore((state) => state.setActiveVehicleId)
  const setAuthState = useAppStore((state) => state.setAuthState)
  const setDisplayName = useAppStore((state) => state.setDisplayName)
  const { alerts, fetchAlerts } = useAlerts()
  const { vehicles, fetchVehicles, addVehicle, updateVehicle, loading } = useVehicles()
  const { logs, fetchLogs, latestLogsByVehicle, fetchLatestLogs } = useServiceLogs()

  const [activeTab, setActiveTab] = useState<TabId>('vehicles')
  const [isAddingCar, setIsAddingCar] = useState(false)
  const [isLoggingService, setIsLoggingService] = useState(false)
  const [showPWAPrompt, setShowPWAPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [pwaDismissed, setPwaDismissed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMileageSheetOpen, setIsMileageSheetOpen] = useState(false)
  const [isManualSheetOpen, setIsManualSheetOpen] = useState(false)
  const [isSavingMileage, setIsSavingMileage] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [vehicleScreenMode, setVehicleScreenMode] = useState<'list' | 'detail'>('list')
  const [prefilledServiceMileage, setPrefilledServiceMileage] = useState<number | undefined>(undefined)
  const [serviceReturnTab, setServiceReturnTab] = useState<TabId>('vehicles')
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false)

  useEffect(() => { void fetchVehicles().catch(() => undefined) }, [fetchVehicles])

  useEffect(() => { void fetchAlerts().catch(() => undefined) }, [fetchAlerts])

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    if (isStandalone) { setShowPWAPrompt(false); return }

    function onBeforeInstallPrompt(event: Event) { event.preventDefault(); setDeferredPrompt(event as BeforeInstallPromptEvent); setShowPWAPrompt(true) }
    function onAppInstalled() { setDeferredPrompt(null); setShowPWAPrompt(false); setPwaDismissed(true) }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt); window.removeEventListener('appinstalled', onAppInstalled) }
  }, [])

  const hasCars = vehicles.length > 0
  const canAddVehicle = vehicles.length < 10
  const profileFullName = user?.user_metadata?.full_name?.trim() ?? ''
  const profilePhone = (user?.user_metadata?.phone_number as string | undefined)?.trim() || user?.phone || ''
  const isProfileComplete = profileFullName.length > 0 && profilePhone.length > 0
  const needsProfileSetup = Boolean(user) && !isProfileComplete
  const primaryVehicle = vehicles.find((v) => v.id === activeVehicleId) ?? vehicles[0] ?? null
  const profileName = useMemo(() => profileFullName || user?.email || 'MazdaCare Driver', [profileFullName, user?.email])
  const profileEmail = user?.email ?? 'No email available'
  const manualLookup = useMemo(() => (primaryVehicle ? lookupMazdaManuals(primaryVehicle.model, primaryVehicle.year) : null), [primaryVehicle])
  const alertByVehicleId = useMemo(
    () => new Map(alerts.map((alert) => [alert.vehicleId, alert])),
    [alerts],
  )
  const vehicleServiceSnapshots = useMemo(() => {
    return vehicles.reduce<Record<string, VehicleServiceSnapshot>>((map, vehicle) => {
      map[vehicle.id] = resolveVehicleServiceSnapshot(
        vehicle,
        latestLogsByVehicle[vehicle.id],
        alertByVehicleId.get(vehicle.id),
      )
      return map
    }, {})
  }, [alertByVehicleId, latestLogsByVehicle, vehicles])
  const primaryVehicleServiceSnapshot = useMemo(() => {
    if (!primaryVehicle) {
      return null
    }

    return vehicleServiceSnapshots[primaryVehicle.id] ?? resolveVehicleServiceSnapshot(
      primaryVehicle,
      logs[0] ?? null,
      alertByVehicleId.get(primaryVehicle.id),
    )
  }, [alertByVehicleId, logs, primaryVehicle, vehicleServiceSnapshots])
  const profileInitials = useMemo(() => {
    const initials = profileName
      .split(' ')
      .map((segment: string) => segment[0] ?? '')
      .join('')
      .slice(0, 2)

    return initials.toUpperCase() || 'MC'
  }, [profileName])

  useKeyboardShortcuts()

  useEffect(() => {
    function onHelpKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key !== '/') return
      const el = e.target as HTMLElement
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return
      e.preventDefault()
      setShortcutsHelpOpen(true)
    }
    window.addEventListener('keydown', onHelpKey)
    return () => window.removeEventListener('keydown', onHelpKey)
  }, [])

  useEffect(() => {
    registerKeyboardShortcut('h', () => setActiveTab('events'))
    registerKeyboardShortcut('v', () => setActiveTab('vehicles'))
    registerKeyboardShortcut('s', () => setActiveTab('settings'))
    return () => { unregisterKeyboardShortcut('h'); unregisterKeyboardShortcut('v'); unregisterKeyboardShortcut('s') }
  }, [])

  useEffect(() => {
    if (!vehicles.length) { if (activeVehicleId !== null) setActiveVehicleId(null); return }
    const activeExists = activeVehicleId ? vehicles.some((v) => v.id === activeVehicleId) : false
    if (!activeExists) setActiveVehicleId(vehicles[0].id)
  }, [activeVehicleId, setActiveVehicleId, vehicles])

  useEffect(() => {
    if (!vehicles.length) {
      setVehicleScreenMode('list')
    }
  }, [vehicles.length])

  useEffect(() => {
    void fetchLatestLogs(vehicles.map((vehicle) => vehicle.id)).catch(() => undefined)
  }, [fetchLatestLogs, vehicles])

  useEffect(() => {
    if (!primaryVehicle?.id) return
    void fetchLogs(primaryVehicle.id).catch(() => undefined)
  }, [fetchLogs, primaryVehicle?.id])

  const getHeaderTitle = () => {
    if (isAddingCar) return 'Add Your Mazda'
    if (isLoggingService) return 'Log Service'
    switch (activeTab) {
      case 'vehicles': return hasCars ? 'My Vehicles' : 'Welcome'
      case 'events': return 'Service History'
      case 'notifications': return 'Notifications'
      case 'settings': return 'Settings'
      default: return 'MazdaCare'
    }
  }

  async function handleInstallApp() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') { setShowPWAPrompt(false); setPwaDismissed(true) }
    setDeferredPrompt(null)
  }

  async function handleVehicleComplete(values: AddCarWizardValues) {
    const selectedVehicle = VEHICLES.find((v) => v.id === values.selectedVehicleId)
    if (!selectedVehicle) { toast.error('Please choose a Mazda model first.'); return }
    try {
      const createdVehicle = await addVehicle({ model: selectedVehicle.model, year: values.year, vin: values.vin, fuelType: values.fuelType, engineSize: values.engineSize, registration: values.registration, currentMileage: 0, mileageInterval: values.mileageInterval, color: selectedVehicle.color })
      setActiveVehicleId(createdVehicle.id)
      setIsAddingCar(false)
      setActiveTab('vehicles')
      haptics.success()
      toast.success('Vehicle added successfully.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save vehicle.')
    }
  }

  async function handleCompleteProfile(values: { fullName: string; phoneNumber: string }) {
    const normalizedName = sanitizeText(values.fullName).trim()
    const normalizedPhone = values.phoneNumber.replace(/[^\d+]/g, '').trim()
    if (!normalizedName || normalizedPhone.length < 8) { haptics.error(); toast.error('Please provide a valid name and phone number.'); return }
    setIsSavingProfile(true)
    haptics.medium()
    try {
      const { data, error } = await supabase.auth.updateUser({ data: { full_name: normalizedName, phone_number: normalizedPhone } })
      if (error) throw error
      if (data.user) setAuthState(data.user, session)
      setDisplayName(normalizedName)
      haptics.success()
      toast.success('Profile saved. You can now add your first Mazda.')
    } catch (error) {
      haptics.error()
      toast.error(error instanceof Error ? error.message : 'Unable to save profile details right now.')
    } finally {
      setIsSavingProfile(false)
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

  async function handleSaveMileage(nextMileageValue: number) {
    if (!primaryVehicle) return
    const sanitizedValue = sanitizeMileage(nextMileageValue)
    setIsSavingMileage(true)
    try {
      await updateVehicle(primaryVehicle.id, { currentMileage: sanitizedValue })
      haptics.success()
      toast.success(`Mileage updated to ${sanitizedValue.toLocaleString()} km`)
      if (primaryVehicleServiceSnapshot?.dueMileage != null && primaryVehicleServiceSnapshot.dueMileage <= sanitizedValue) {
        toast('Service overdue — log your service or adjust your schedule', { style: { background: '#FFF7ED', color: '#B45309', border: '1px solid #FCD34D' } })
      }
      setIsMileageSheetOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update mileage.')
    } finally {
      setIsSavingMileage(false)
    }
  }

  function handleOpenLogService(initialMileage: number) {
    setPrefilledServiceMileage(sanitizeMileage(initialMileage))
    setServiceReturnTab(activeTab)
    setIsMileageSheetOpen(false)
    setIsLoggingService(true)
  }

  function handleOpenVehicleDetail(vehicleId: string, openDetail = true) {
    setActiveVehicleId(vehicleId)
    if (openDetail) {
      setVehicleScreenMode('detail')
    }
    void fetchLogs(vehicleId).catch(() => undefined)
  }

  function renderVehicleListPanel(isDesktop: boolean) {
    if (isDesktop) {
      return (
        <div className="overflow-hidden rounded-[32px] border border-black/5 bg-[#FDFAFA] shadow-[0_24px_48px_rgba(15,10,11,0.05)]">
          <div className="border-b border-black/5 px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A6E70]">Garage</p>
                <h1
                  className="mt-3 text-[34px] leading-none text-[#0F0A0B]"
                  style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontStyle: 'italic',
                    fontWeight: 600,
                  }}
                >
                  My Vehicles
                </h1>
                <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-[#7A6E70]">
                  Select a Mazda to inspect precise next-service status and recent activity.
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8F1326] text-[12px] font-semibold text-white">
                {profileInitials}
              </div>
            </div>
          </div>

          <div className="space-y-3 px-4 py-4">
            {vehicles.map((vehicle) => (
              <VehicleListCard
                key={vehicle.id}
                vehicle={vehicle}
                serviceSnapshot={vehicleServiceSnapshots[vehicle.id]}
                isSelected={primaryVehicle?.id === vehicle.id}
                onOpen={(selectedVehicle) => {
                  handleOpenVehicleDetail(selectedVehicle.id, false)
                }}
              />
            ))}

            {canAddVehicle ? (
              <button
                type="button"
                onClick={() => setIsAddingCar(true)}
                className="flex w-full items-center justify-center gap-2 rounded-[24px] border-[1.5px] border-dashed border-[#CDB7BC] bg-[#FEF7F8] px-4 py-4 text-[13px] font-semibold text-[#8F1326]"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#8F1326] text-white">
                  <Plus className="h-4 w-4" />
                </span>
                Add another Mazda
              </button>
            ) : null}
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-full bg-[#F5F1F1]">
        <div className="sticky top-0 z-10 flex h-14 items-center border-b border-black/5 bg-[#FDFAFA] px-4">
          <div className="flex w-9 items-center justify-start text-[#3D3035]" aria-hidden="true">
            <Menu className="h-5 w-5" />
          </div>
          <div className="flex-1 text-center">
            <h1
              className="text-[22px] text-[#0F0A0B]"
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontStyle: 'italic',
                fontWeight: 600,
              }}
            >
              My Vehicles
            </h1>
          </div>
          <div className="flex w-9 items-center justify-end">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8F1326] text-[12px] font-semibold text-white">
              {profileInitials}
            </div>
          </div>
        </div>

        <div className="space-y-2.5 px-3 py-3 pb-28">
          {vehicles.map((vehicle) => (
            <VehicleListCard
              key={vehicle.id}
              vehicle={vehicle}
              serviceSnapshot={vehicleServiceSnapshots[vehicle.id]}
              onOpen={(selectedVehicle) => {
                handleOpenVehicleDetail(selectedVehicle.id)
              }}
            />
          ))}

          {canAddVehicle ? (
            <button
              type="button"
              onClick={() => setIsAddingCar(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#C9C0C1] bg-[#FEF7F8] px-4 py-4 text-[13px] font-semibold text-[#8F1326]"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#8F1326] text-white">
                <Plus className="h-4 w-4" />
              </span>
              Add another Mazda
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  function renderVehicleDetailPanel(isDesktop: boolean) {
    if (!primaryVehicle) {
      return isDesktop ? (
        <div className="flex min-h-[640px] items-center justify-center rounded-[32px] border border-black/5 bg-[#FDFAFA] p-10 text-center shadow-[0_24px_48px_rgba(15,10,11,0.05)]">
          <div>
            <p className="text-[14px] font-semibold text-[#211A1D]">Select a Mazda</p>
            <p className="mt-2 text-[12px] text-[#7A6E70]">Choose a vehicle from the list to inspect service readiness and recent activity.</p>
          </div>
        </div>
      ) : null
    }

    const detailView = (
      <VehicleDetailView
        vehicle={primaryVehicle}
        logs={logs}
        serviceSnapshot={primaryVehicleServiceSnapshot ?? undefined}
        isDesktopPane={isDesktop}
        onBack={!isDesktop ? () => setVehicleScreenMode('list') : undefined}
        onOpenMileageSheet={() => {
          haptics.tap()
          setIsMileageSheetOpen(true)
        }}
        onLogService={() => {
          haptics.tap()
          setServiceReturnTab(activeTab)
          setIsLoggingService(true)
        }}
        onOpenManual={manualLookup ? () => {
          haptics.tap()
          setIsManualSheetOpen(true)
        } : undefined}
        onSeeAllHistory={() => setActiveTab('events')}
      />
    )

    if (!isDesktop) {
      return detailView
    }

    return (
      <div className="overflow-hidden rounded-[32px] border border-black/5 bg-[#F7F1F2] shadow-[0_24px_48px_rgba(15,10,11,0.05)]">
        {detailView}
      </div>
    )
  }

  return (
    <div className="brand-shell flex min-h-screen w-full justify-center overflow-hidden font-sans">
      <div className="relative flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-[rgba(255,251,250,0.9)] shadow-[0_24px_80px_rgba(163,21,38,0.16)] backdrop-blur-sm lg:max-w-full lg:grid lg:grid-cols-[320px_1fr] lg:gap-0">

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:items-stretch lg:justify-between lg:bg-white/80 lg:border-r lg:border-gray-100 lg:shadow-md">
          <div className="flex flex-col items-center gap-8 pt-10 pb-6">
            <MazdaLogo variant="icon" theme="dark" size="md" />
            <nav className="flex flex-col gap-2 w-full px-4">
              <NavButton icon={<Car className="h-6 w-6" />} label="Vehicles" isActive={activeTab === 'vehicles'} onClick={() => setActiveTab('vehicles')} />
              <NavButton icon={<Calendar className="h-6 w-6" />} label="History" isActive={activeTab === 'events'} onClick={() => setActiveTab('events')} />
              <NavButton icon={<Bell className="h-6 w-6" />} label="Alerts" isActive={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
              <NavButton icon={<Settings className="h-6 w-6" />} label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </nav>
          </div>
          <div className="flex flex-col gap-4 px-4 pb-8">
            {activeTab === 'vehicles' && hasCars ? (
              <div className="rounded-[24px] border border-[#F1E6E6] bg-[#FDFAFA] p-4 shadow-[0_12px_28px_rgba(15,10,11,0.04)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A6E70]">
                  Garage Summary
                </p>
                <p className="mt-2 text-[18px] font-semibold text-[#0F0A0B]">
                  {vehicles.length} Mazda{vehicles.length === 1 ? '' : 's'} tracked
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[#7A6E70]">
                  Browse the list in the main panel to inspect service status and recent activities.
                </p>
              </div>
            ) : null}
            {canAddVehicle ? (
              <button className="w-full rounded-xl border-2 border-dashed border-[#9B1B30] bg-[#F5E8EA] py-3 text-[#9B1B30] font-bold mt-2" onClick={() => setIsAddingCar(true)}>
                <Plus className="inline-block mr-1" /> Add Mazda
              </button>
            ) : null}
          </div>
        </aside>

        {/* PWA install banner */}
        <AnimatePresence>
          {showPWAPrompt && !pwaDismissed && !isAddingCar && activeTab === 'vehicles' ? (
            <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="absolute top-0 z-50 w-full p-4 pt-6">
              <div className="brand-panel-strong flex items-center justify-between rounded-[24px] p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1">
                    <MazdaLogo variant="icon" theme="dark" size="sm" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Install MazdaCare</h3>
                    <p className="text-xs text-gray-400">Add to Home Screen</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowPWAPrompt(false)} className="p-2 text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
                  <button onClick={() => void handleInstallApp()} className="flex items-center gap-1 rounded-xl bg-[#A31526] px-3 py-2 text-xs font-bold text-white transition-transform active:scale-95">
                    <Download className="h-3 w-3" /> Install
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <ShortcutsHelpDialog open={shortcutsHelpOpen} onOpenChange={setShortcutsHelpOpen} />

          {(activeTab !== 'vehicles' || isAddingCar || isLoggingService) ? (
            <div className="app-top-bar sticky top-0 z-30 flex items-center justify-between px-5 pb-4 pt-12">
              <div className="flex items-center gap-3">
                {isAddingCar || isLoggingService ? (
                  <button onClick={() => { if (isAddingCar) { setIsAddingCar(false); return }; setIsLoggingService(false); setPrefilledServiceMileage(undefined); setActiveTab(serviceReturnTab) }} className="-ml-2 rounded-full p-2 text-gray-400 hover:bg-gray-50">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                ) : null}
                <h1 className="text-[24px] font-semibold tracking-tight text-gray-900">{getHeaderTitle()}</h1>
              </div>
            </div>
          ) : null}

          <KeyboardShortcutLegend />

          <div className="relative flex-1 overflow-y-auto bg-transparent pb-24 lg:pb-0">
            <AnimatePresence mode="wait">
              {isAddingCar ? (
                <motion.div key="add-car" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                  <AddCarWizard onComplete={handleVehicleComplete} saving={loading} />
                </motion.div>
              ) : isLoggingService && primaryVehicle ? (
                <motion.div key="log-service" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full px-4 pt-4">
                  <LogService embedded vehicleIdOverride={primaryVehicle.id} initialMileage={prefilledServiceMileage}
                    onSuccess={() => { setIsLoggingService(false); setPrefilledServiceMileage(undefined); void fetchVehicles().catch(() => undefined); void fetchLogs(primaryVehicle.id).catch(() => undefined) }} />
                </motion.div>
              ) : (
                <motion.div key="main-tabs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  {activeTab === 'settings' ? (
                    <SettingsView
                      user={{ fullName: profileName, email: profileEmail, phone: profilePhone }}
                      primaryVehicle={primaryVehicle ? { id: primaryVehicle.id, model: primaryVehicle.model, year: primaryVehicle.year, registration: primaryVehicle.registration } : null}
                      serviceLogs={logs}
                      onLogout={handleLogout}
                      isLoggingOut={isLoggingOut}
                    />
                  ) : null}

                  {activeTab === 'vehicles' ? (
                    !hasCars ? (
                      needsProfileSetup ? (
                        <NewUserOnboardingState email={profileEmail} fullName={profileFullName} phoneNumber={profilePhone} saving={isSavingProfile} onSaveProfile={handleCompleteProfile} />
                      ) : (
                        <EmptyHomeState userName={profileName?.split(' ')[0] || 'Driver'} onAdd={() => setIsAddingCar(true)} />
                      )
                    ) : (
                      <div className="min-h-full bg-[#F5F1F1] lg:bg-transparent">
                        <div className="lg:hidden">
                          {vehicleScreenMode === 'list' ? renderVehicleListPanel(false) : renderVehicleDetailPanel(false)}
                        </div>

                        <div className="hidden lg:grid lg:min-h-full lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-6 lg:px-6 lg:py-6">
                          {renderVehicleListPanel(true)}
                          {renderVehicleDetailPanel(true)}
                        </div>
                      </div>
                    )
                  ) : null}

                  {activeTab === 'events' ? <EventsTabContent logs={logs} activeVehicleId={activeVehicleId} /> : null}
                  {activeTab === 'notifications' ? <NotificationsTabContent vehicles={vehicles} serviceSnapshots={vehicleServiceSnapshots} /> : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile bottom nav */}
          {!isAddingCar ? (
            <div className="absolute bottom-0 z-40 w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] lg:hidden">
              <div className="rounded-[32px] border border-[#A31526]/10 bg-[rgba(255,249,248,0.95)] px-2 py-2 shadow-[0_16px_32px_rgba(163,21,38,0.12)] backdrop-blur-2xl">
                <div className="flex items-center justify-between px-2">
                  <button onClick={() => setActiveTab('vehicles')} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition ${activeTab === 'vehicles' ? 'text-[#A31526]' : 'text-gray-400'}`}>
                    <Car className="h-6 w-6" /><span className="text-[10px] font-medium">Vehicles</span>
                  </button>
                  <button onClick={() => setActiveTab('events')} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition ${activeTab === 'events' ? 'text-[#A31526]' : 'text-gray-400'}`}>
                    <Calendar className="h-6 w-6" /><span className="text-[10px] font-medium">History</span>
                  </button>
                  <button onClick={() => { haptics.medium(); setServiceReturnTab(activeTab); setIsLoggingService(true) }} className="flex flex-col items-center justify-center -mt-6">
                    <div className="w-14 h-14 rounded-full bg-[#A31526] text-white flex items-center justify-center shadow-lg shadow-[#A31526]/30 hover:bg-[#8B1220] transition active:scale-95">
                      <Plus className="w-7 h-7" />
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('notifications')} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition ${activeTab === 'notifications' ? 'text-[#A31526]' : 'text-gray-400'}`}>
                    <Bell className="h-6 w-6" /><span className="text-[10px] font-medium">Alerts</span>
                  </button>
                  <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition ${activeTab === 'settings' ? 'text-[#A31526]' : 'text-gray-400'}`}>
                    <Settings className="h-6 w-6" /><span className="text-[10px] font-medium">Settings</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Sheets */}
      <MileageUpdateSheet
        vehicle={primaryVehicle}
        serviceSnapshot={primaryVehicleServiceSnapshot}
        isOpen={isMileageSheetOpen}
        onOpenChange={setIsMileageSheetOpen}
        onSave={handleSaveMileage}
        saving={isSavingMileage}
        onOpenLogService={handleOpenLogService}
      />

      {primaryVehicle && manualLookup ? (
        <MazdaManualSheet
          vehicle={primaryVehicle}
          lookup={manualLookup}
          isOpen={isManualSheetOpen}
          onOpenChange={setIsManualSheetOpen}
        />
      ) : null}
    </div>
  )
}

export { Phase4Shell }
