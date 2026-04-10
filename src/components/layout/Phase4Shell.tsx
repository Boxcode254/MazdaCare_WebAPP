// Removed duplicate implementation and export of Phase4Shell. The main implementation and export are below.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ChartNoAxesColumn,
  Bell,
  BookOpen,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Gauge,
  Home,
  Info,
  LogOut,
  MessageSquare,
  Pencil,
  Plus,
  Settings,
  Shield,
  User,
  Wrench,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { CarCard } from '@/components/car/CarCard'
import MazdaLogo from '@/components/ui/MazdaLogo'
import { CostAnalytics } from '@/components/service/CostAnalytics'
import { LogService } from '@/pages/LogService'
import { Sheet, SheetClose, SheetContent } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useServiceLogs } from '@/hooks/useServiceLogs'
import { useIdleTimer } from '@/hooks/useIdleTimer'
import { useVehicles } from '@/hooks/useVehicles'
import { haptics } from '@/lib/haptics'
import { lookupMazdaManuals, type MazdaManualLookupResult } from '@/lib/mazdaManuals'
import { sanitizeMileage, sanitizeText } from '@/lib/sanitize'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/stores/appStore'
import { decodeVIN, formatVIN, type VINInfo } from '@/lib/vinDecoder'
import { KeyboardShortcutLegend } from '@/components/layout/KeyboardShortcutLegend'
import { ShortcutsHelpDialog } from '@/components/layout/ShortcutsHelpDialog'
import useKeyboardShortcuts, {
  registerKeyboardShortcut,
  unregisterKeyboardShortcut,
} from '@/hooks/useKeyboardShortcuts'

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

// Helper function to get vehicle image by model
function getVehicleImage(model: string): string {
  const vehicle = VEHICLES.find((v) => v.model === model)
  return vehicle?.image || 'https://images.unsplash.com/photo-1743114713503-b698b8433f03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXpkYSUyMGN4NSUyMGdyZXklMjBzdXZ8ZW58MXx8fHwxNzc1NTQ3MDIzfDA&ixlib=rb-4.1.0&q=80&w=1080'
}

function maskVin(vin: string): string {
  if (vin.length <= 7) {
    return vin
  }

  return `${vin.slice(0, 3)}...${vin.slice(-4)}`
}

type TabId = 'home' | 'vehicles' | 'settings'

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

interface MileageUpdateSheetProps {
  vehicle: {
    id: string
    model: string
    year: number
    registration: string
    currentMileage: number
    nextServiceMileage?: number
    mileageInterval: 5000 | 7000 | 9000 | 10000
  }
  open: boolean
  lastUpdateLabel: string
  saving: boolean
  initialValue?: number
  onOpenChange: (open: boolean) => void
  onSave: (mileage: number) => Promise<void>
  onLogService: (mileage: number) => void
}

interface ManualsSheetProps {
  vehicle: {
    model: string
    year: number
    registration: string
  }
  lookup: MazdaManualLookupResult
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getMileageProgressColor(progress: number) {
  if (progress < 60) return '#2E7D4F'
  if (progress <= 90) return '#C49A3C'
  return '#9B1B30'
}

function formatDisplayDate(dateValue?: string) {
  if (!dateValue) {
    return 'your last reading'
  }

  const parsed = new Date(dateValue)

  if (Number.isNaN(parsed.getTime())) {
    return 'your last reading'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

function MileageUpdateSheet({
  vehicle,
  open,
  lastUpdateLabel,
  saving,
  initialValue,
  onOpenChange,
  onSave,
  onLogService,
}: MileageUpdateSheetProps) {
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    const startValue = initialValue ?? vehicle.currentMileage
    setDisplayValue(startValue.toLocaleString())
  }, [initialValue, open, vehicle.currentMileage])

  const parsedMileage = displayValue ? Number(displayValue.replace(/,/g, '')) : NaN
  const hasInput = displayValue.trim().length > 0
  const isHigherThanCurrent = parsedMileage > vehicle.currentMileage
  const isTooHigh = parsedMileage > vehicle.currentMileage + 200000
  const isValid = hasInput && Number.isFinite(parsedMileage) && isHigherThanCurrent && !isTooHigh
  const delta = isValid ? parsedMileage - vehicle.currentMileage : 0
  const nextServiceMileage = vehicle.nextServiceMileage ?? vehicle.currentMileage + vehicle.mileageInterval
  const remainingKm = Math.max(nextServiceMileage - (Number.isFinite(parsedMileage) ? parsedMileage : vehicle.currentMileage), 0)
  const previewProgress = Math.min((((Number.isFinite(parsedMileage) ? parsedMileage : vehicle.currentMileage)) / nextServiceMileage) * 100, 100)
  const previewColor = getMileageProgressColor(previewProgress)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="rounded-t-[28px] border-0 bg-white p-0">
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="rounded-t-[28px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-5"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200" />

              <div className="border-b border-gray-100 pb-4">
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
                  Update mileage
                </h2>
                <p className="mt-1 text-[11px] text-black/40" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {vehicle.registration} · {vehicle.model} {vehicle.year}
                </p>
              </div>

              <div className="space-y-5 pt-5">
                <div className="rounded-[20px] border border-gray-100 bg-[#FCFAFA] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    New reading (km)
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, '')
                      if (!digits) {
                        setDisplayValue('')
                        return
                      }

                      setDisplayValue(Number(digits).toLocaleString())
                    }}
                    placeholder={(vehicle.currentMileage + 1).toLocaleString()}
                    className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-[20px] font-semibold text-[#111010] outline-none focus:border-[#A31526] focus:ring-2 focus:ring-[#A31526]/15"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  />
                  <div className="mt-3 min-h-[18px] text-[12px]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {hasInput && !isHigherThanCurrent ? (
                      <p className="text-[#C43B3B]">Must be higher than current reading ({vehicle.currentMileage.toLocaleString()} km)</p>
                    ) : null}
                    {isTooHigh ? <p className="text-[#C43B3B]">That seems too high</p> : null}
                    {isValid ? (
                      <p className="text-[#2E7D4F]">+{delta.toLocaleString()} km since {lastUpdateLabel} · looks right</p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[20px] border border-gray-100 bg-[#FCFAFA] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Service proximity
                  </p>
                  <p className="mt-3 text-[14px] text-gray-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    After this update, next service in <span className="font-semibold" style={{ color: previewColor }}>{remainingKm.toLocaleString()} km</span>
                  </p>
                  <div className="mt-3 h-[6px] overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full transition-all" style={{ width: `${previewProgress}%`, backgroundColor: previewColor }} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!Number.isFinite(parsedMileage)) {
                      onLogService(vehicle.currentMileage)
                      return
                    }

                    onLogService(parsedMileage)
                  }}
                  className="w-full text-center text-[13px] font-medium text-[#9B1B30]"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  Need to log a full service instead? →
                </button>
                <div className="flex gap-3">
                  <SheetClose asChild>
                    <button
                      type="button"
                      className="flex-1 rounded-xl border border-[#E3CDD1] bg-white px-4 py-3.5 text-[14px] font-semibold text-[#9B1B30]"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      Cancel
                    </button>
                  </SheetClose>
                  <button
                    type="button"
                    disabled={!isValid || saving}
                    onClick={() => {
                      if (!isValid) {
                        return
                      }

                      haptics.medium()
                      void onSave(parsedMileage)
                    }}
                    className="flex-1 rounded-xl bg-[#A31526] px-4 py-3.5 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {saving ? 'Saving…' : 'Save mileage'}
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

function ManualsSheet({ vehicle, lookup, open, onOpenChange }: ManualsSheetProps) {
  const hasSections = lookup.sections.length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="rounded-t-[28px] border-0 bg-white p-0">
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="rounded-t-[28px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-5"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200" />

              <div className="border-b border-gray-100 pb-4">
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
                                      onClick={() => {
                                        haptics.tap()
                                        window.open(link.pdfUrl!, '_blank', 'noopener,noreferrer')
                                      }}
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
                                      onClick={() => {
                                        haptics.tap()
                                        window.open(link.onlineUrl!, '_blank', 'noopener,noreferrer')
                                      }}
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
                    onClick={() => {
                      haptics.tap()
                      window.open(lookup.generalFallbackUrl, '_blank', 'noopener,noreferrer')
                    }}
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

function NewUserOnboardingState({
  email,
  fullName,
  phoneNumber,
  onSaveProfile,
  saving,
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

  useEffect(() => {
    setDraftName(fullName)
    setDraftPhone(phoneNumber)
  }, [fullName, phoneNumber])

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      <div className="pt-4">
        <h2 className="text-2xl font-bold text-gray-900">Let&apos;s finish your profile</h2>
        <p className="mt-1 text-[15px] text-gray-600">
          Add your details once, then we&apos;ll set up your first Mazda.
        </p>
      </div>

      <div className="space-y-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
            Email
          </label>
          <p className="mt-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
            {email}
          </p>
        </div>

        <div>
          <label htmlFor="onboarding-full-name" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
            Full name
          </label>
          <input
            id="onboarding-full-name"
            type="text"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="e.g. Natasha Wanjiru"
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-[#A31526] focus:ring-2 focus:ring-[#A31526]/10"
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="onboarding-phone" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
            Phone number
          </label>
          <input
            id="onboarding-phone"
            type="tel"
            value={draftPhone}
            onChange={(event) => {
              const cleaned = event.target.value.replace(/[^\d+\s()-]/g, '')
              setDraftPhone(cleaned)
            }}
            placeholder="e.g. +254 712 345678"
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-[#A31526] focus:ring-2 focus:ring-[#A31526]/10"
            autoComplete="tel"
          />
        </div>

        <button
          type="button"
          onClick={() => void onSaveProfile({ fullName: draftName, phoneNumber: draftPhone })}
          disabled={!isFormValid || saving}
          className="w-full rounded-xl bg-[#A31526] px-5 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving profile…' : 'Continue'}
        </button>
      </div>

      <p className="text-center text-xs text-gray-500">
        Step 1 of 2: profile details. Step 2: add your Mazda vehicle.
      </p>
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



function AddCarWizard({
  onComplete,
  saving,
}: {
  onComplete: (values: AddCarWizardValues) => Promise<void>
  saving: boolean
}) {
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
    const raw = event.target.value
    const formatted = formatVIN(raw)
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
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-1">
                  <div className="flex items-center gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">VIN (optional)</label>
                  </div>
                </div>
                <div className="mb-3 flex items-start gap-1.5 text-gray-500">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                  <p className="text-[11px] leading-relaxed">Found on your logbook, windscreen, or driver door jamb.</p>
                </div>

                <input
                  type="text"
                  placeholder="17-CHARACTER VIN"
                  maxLength={17}
                  value={details.vin}
                  onChange={handleVinChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 font-mono text-sm uppercase tracking-widest outline-none transition-colors focus:border-[#A31526] focus:ring-2 focus:ring-[#A31526]/20 placeholder:tracking-normal"
                />
                <div className="mt-1 flex justify-end">
                  <span className="text-[11px] font-medium text-gray-500">
                    {details.vin.length} / 17
                  </span>
                </div>

                {vinInfo && details.vin.length === 17 && (
                  <div className="mt-2 text-[12px] font-medium">
                    {vinInfo.isValid ? (
                      <div className="flex items-center gap-1.5 text-[#2E7D4F]">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Mazda confirmed — {vinInfo.year} · {vinInfo.fuelHint}</span>
                      </div>
                    ) : (
                      <div className="ml-1 text-[#A31526]">
                        Invalid VIN — you can skip this field
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="ml-1 text-sm font-semibold text-gray-700">Fuel Type</label>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  {(['petrol', 'diesel'] as const).map((fuel) => (
                    <button
                      key={fuel}
                      type="button"
                      onClick={() => {
                        setFuelTypeTouched(true)
                        setDetails({ ...details, fuelType: fuel })
                      }}
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
              haptics.medium()
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



function SettingsView({
  user,
  primaryVehicle,
  serviceLogs,
  onLogout,
  isLoggingOut,
}: {
  user: { fullName: string; email: string; phone: string }
  primaryVehicle: {
    id: string
    model: string
    year: number
    registration: string
  } | null
  serviceLogs: import('@/types').ServiceLog[]
  onLogout: () => Promise<void>
  isLoggingOut: boolean
}) {
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [subView, setSubView] = useState<'menu' | 'cost-analytics' | 'personal-details' | 'garage-display'>('menu')
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true)

  const garageVisitStats = useMemo(() => {
    const grouped = new Map<
      string,
      {
        garageName: string
        visits: number
        latestVisit: number
      }
    >()

    for (const log of serviceLogs) {
      const garageName = log.garageName?.trim() || 'Garage not specified'
      const serviceDate = new Date(log.serviceDate).getTime()
      const existing = grouped.get(garageName)

      if (!existing) {
        grouped.set(garageName, {
          garageName,
          visits: 1,
          latestVisit: serviceDate,
        })
        continue
      }

      existing.visits += 1
      existing.latestVisit = Math.max(existing.latestVisit, serviceDate)
    }

    return Array.from(grouped.values()).sort((a, b) => {
      if (b.visits !== a.visits) {
        return b.visits - a.visits
      }

      return b.latestVisit - a.latestVisit
    })
  }, [serviceLogs])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('mc_push_notifications_enabled')
      if (stored === null) {
        return
      }
      setPushNotificationsEnabled(stored === 'true')
    } catch {
      // storage unavailable; keep default
    }
  }, [])

  const handlePushToggle = (enabled: boolean) => {
    setPushNotificationsEnabled(enabled)
    haptics.tap()

    try {
      window.localStorage.setItem('mc_push_notifications_enabled', String(enabled))
    } catch {
      // storage unavailable
    }
  }

  if (subView === 'cost-analytics') {
    return (
      <div className="p-6 pb-32">
        <button
          type="button"
          onClick={() => setSubView('menu')}
          className="mb-4 inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-[12px] font-semibold text-gray-600"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Settings
        </button>

        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2
            className="text-[#111010]"
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '28px',
              fontStyle: 'italic',
              fontWeight: 300,
              lineHeight: 1.1,
            }}
          >
            Cost analytics
          </h2>
          <p className="mt-1 text-[11px] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {primaryVehicle ? `${primaryVehicle.registration} · ${primaryVehicle.model} ${primaryVehicle.year}` : 'Add a vehicle to view analytics'}
          </p>
        </div>

        {primaryVehicle ? (
          <CostAnalytics serviceLogs={serviceLogs} vehicleId={primaryVehicle.id} />
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
            <p className="text-[13px] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
              No vehicle found for analytics yet.
            </p>
          </div>
        )}
      </div>
    )
  }

  if (subView === 'personal-details') {
    return (
      <div className="p-6 pb-32">
        <button
          type="button"
          onClick={() => setSubView('menu')}
          className="mb-4 inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-[12px] font-semibold text-gray-600"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Settings
        </button>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Personal Details</h2>
          <p className="mt-1 text-[13px] text-gray-500">Profile details used across MazdaCare.</p>

          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-gray-100 bg-[#FCFAFA] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Full name</p>
              <p className="mt-1 text-sm font-medium text-[#111010]">{user.fullName}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-[#FCFAFA] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Email</p>
              <p className="mt-1 text-sm font-medium text-[#111010]">{user.email}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-[#FCFAFA] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Phone number</p>
              <p className="mt-1 text-sm font-medium text-[#111010]">{user.phone || 'Not set yet'}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (subView === 'garage-display') {
    return (
      <div className="p-6 pb-32">
        <button
          type="button"
          onClick={() => setSubView('menu')}
          className="mb-4 inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-[12px] font-semibold text-gray-600"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Settings
        </button>

        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Garage Display</h2>
          <p className="mt-1 text-[13px] text-gray-500">
            Garages visited, sorted by number of visits.
          </p>
        </div>

        <div className="space-y-3">
          {garageVisitStats.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
              <p className="text-[13px] text-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
                No garages logged yet.
              </p>
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
          <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            Account
          </div>
          <button
            type="button"
            onClick={() => {
              haptics.tap()
              setSubView('personal-details')
            }}
            className="flex w-full items-center justify-between border-b border-gray-50 bg-white p-4 active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-[15px] font-medium text-gray-800">Personal Details</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300" />
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between border-b border-gray-50 bg-white p-4 active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <span className="text-[15px] font-medium text-gray-800">Password & Security</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300" />
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.tap()
              setSubView('cost-analytics')
            }}
            className="flex w-full items-center justify-between bg-white p-4 active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <ChartNoAxesColumn className="h-5 w-5 text-gray-400" />
              <span className="text-[15px] font-medium text-gray-800">Cost Analytics</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300" />
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            Preferences
          </div>
          <div className="flex items-center justify-between border-b border-gray-50 bg-white p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-[15px] font-medium text-gray-800">Push Notifications</p>
                <p className="text-[12px] text-gray-500">
                  {pushNotificationsEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            <Switch checked={pushNotificationsEnabled} onCheckedChange={handlePushToggle} />
          </div>
          <button
            type="button"
            onClick={() => {
              haptics.tap()
              setSubView('garage-display')
            }}
            className="flex w-full items-center justify-between bg-white p-4 active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 text-gray-400" />
              <div className="text-left">
                <p className="text-[15px] font-medium text-gray-800">Garage Display</p>
                <p className="text-[12px] text-gray-500">
                  {garageVisitStats.length} garage{garageVisitStats.length === 1 ? '' : 's'} visited
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300" />
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            Support
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-between border-b border-gray-50 bg-white p-4 active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-gray-400" />
              <span className="text-[15px] font-medium text-gray-800">Contact Dealership</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300" />
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between bg-white p-4 active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-gray-400" />
              <span className="text-[15px] font-medium text-gray-800">App Feedback</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300" />
          </button>
        </div>

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
  const handleIdleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    useAppStore.getState().clearAll()
  }, [])

  useIdleTimer(handleIdleSignOut)
  const user = useAppStore((state) => state.user)
  const session = useAppStore((state) => state.session)
  const activeVehicleId = useAppStore((state) => state.activeVehicleId)
  const setActiveVehicleId = useAppStore((state) => state.setActiveVehicleId)
  const setDisplayName = useAppStore((state) => state.setDisplayName)
  const setAuthState = useAppStore((state) => state.setAuthState)
  const clearAll = useAppStore((state) => state.clearAll)

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    clearAll()
  }
  const { vehicles, fetchVehicles, addVehicle, updateVehicle, loading } = useVehicles()
  const { logs, fetchLogs } = useServiceLogs()
  const [activeTab, setActiveTab] = useState<TabId>('home')
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
  const [showFullVin, setShowFullVin] = useState(false)
  const [activeRailIndex, setActiveRailIndex] = useState(0)
  const [prefilledServiceMileage, setPrefilledServiceMileage] = useState<number | undefined>(undefined)
  const [serviceReturnTab, setServiceReturnTab] = useState<TabId>('home')
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false)
  const railSlotRefs = useRef<Array<HTMLDivElement | null>>([])
  const activeTabRef = useRef<TabId>(activeTab)
  activeTabRef.current = activeTab

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
  const shouldUseVehicleRail = vehicles.length >= 2
  const canAddVehicle = vehicles.length < 10
  const railSlotCount = vehicles.length + (canAddVehicle ? 1 : 0)
  const profileFullName = user?.user_metadata?.full_name?.trim() ?? ''
  const profilePhone = (user?.user_metadata?.phone_number as string | undefined)?.trim() || user?.phone || ''
  const isProfileComplete = profileFullName.length > 0 && profilePhone.length > 0
  const needsProfileSetup = Boolean(user) && !isProfileComplete
  const primaryVehicle =
    vehicles.find((vehicle) => vehicle.id === activeVehicleId) ??
    vehicles[0] ??
    null
  const latestPrimaryLog = logs[0]
  const profileName = useMemo(() => profileFullName || user?.email || 'MazdaCare Driver', [profileFullName, user?.email])
  const profileEmail = user?.email ?? 'No email available'
  const nextServiceMileage = primaryVehicle?.nextServiceMileage ?? null
  const kmToNextService =
    primaryVehicle && nextServiceMileage
      ? Math.max(nextServiceMileage - primaryVehicle.currentMileage, 0)
      : null
  const manualLookup = useMemo(
    () => (primaryVehicle ? lookupMazdaManuals(primaryVehicle.model, primaryVehicle.year) : null),
    [primaryVehicle],
  )

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
    registerKeyboardShortcut('h', () => setActiveTab('home'))
    registerKeyboardShortcut('v', () => setActiveTab('vehicles'))
    registerKeyboardShortcut('s', () => setActiveTab('settings'))
    return () => {
      unregisterKeyboardShortcut('h')
      unregisterKeyboardShortcut('v')
      unregisterKeyboardShortcut('s')
    }
  }, [activeVehicleId, isAddingCar, isLoggingService, vehicles])

  useEffect(() => {
    if (!vehicles.length) {
      if (activeVehicleId !== null) {
        setActiveVehicleId(null)
      }
      return
    }

    const activeExists = activeVehicleId
      ? vehicles.some((vehicle) => vehicle.id === activeVehicleId)
      : false

    if (!activeExists) {
      setActiveVehicleId(vehicles[0].id)
    }
  }, [activeVehicleId, setActiveVehicleId, vehicles])

  useEffect(() => {
    if (!shouldUseVehicleRail) {
      setActiveRailIndex(0)
      return
    }

    const selectedIndex = vehicles.findIndex((vehicle) => vehicle.id === primaryVehicle?.id)
    setActiveRailIndex(selectedIndex >= 0 ? selectedIndex : 0)
  }, [primaryVehicle?.id, shouldUseVehicleRail, vehicles])

  useEffect(() => {
    if (!shouldUseVehicleRail) {
      return
    }

    const slotNodes = railSlotRefs.current.filter((node): node is HTMLDivElement => Boolean(node))
    if (!slotNodes.length) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) {
            continue
          }

          const slot = entry.target as HTMLDivElement
          const slotIndex = Number(slot.dataset.slotIndex ?? '-1')
          const slotType = slot.dataset.slotType
          const vehicleId = slot.dataset.vehicleId ?? null

          if (slotIndex >= 0) {
            setActiveRailIndex(slotIndex)
          }

          if (slotType === 'vehicle' && vehicleId) {
            useAppStore.getState().setActiveVehicleId(vehicleId)
          }
        }
      },
      {
        threshold: [0.6],
      }
    )

    for (const node of slotNodes) {
      observer.observe(node)
    }

    return () => {
      observer.disconnect()
    }
  }, [railSlotCount, shouldUseVehicleRail, vehicles])

  useEffect(() => {
    setShowFullVin(false)
  }, [primaryVehicle?.id])

  useEffect(() => {
    if (!primaryVehicle?.id) {
      return
    }

    void fetchLogs(primaryVehicle.id).catch(() => undefined)
  }, [fetchLogs, primaryVehicle?.id])

  const getHeaderTitle = () => {
    if (isAddingCar) return 'Add Your Mazda'
    if (isLoggingService) return 'Log Service'
    switch (activeTab) {
      case 'vehicles':
        return hasCars ? 'My Vehicles' : 'Welcome'
      case 'settings':
        return 'Settings'
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
      const createdVehicle = await addVehicle({
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
      setActiveVehicleId(createdVehicle.id)
      setIsAddingCar(false)
      setActiveTab('home')
      haptics.success()
      toast.success('Vehicle added successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save vehicle.'
      toast.error(message)
    }
  }

  async function handleCompleteProfile(values: { fullName: string; phoneNumber: string }) {
    const normalizedName = sanitizeText(values.fullName).trim()
    const normalizedPhone = values.phoneNumber.replace(/[^\d+]/g, '').trim()

    if (!normalizedName || normalizedPhone.length < 8) {
      haptics.error()
      toast.error('Please provide a valid name and phone number.')
      return
    }

    setIsSavingProfile(true)
    haptics.medium()

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: normalizedName,
          phone_number: normalizedPhone,
        },
      })

      if (error) {
        throw error
      }

      if (data.user) {
        setAuthState(data.user, session)
      }

      setDisplayName(normalizedName)
      haptics.success()
      toast.success('Profile saved. You can now add your first Mazda.')
    } catch (error) {
      haptics.error()
      const message = error instanceof Error ? error.message : 'Unable to save profile details right now.'
      toast.error(message)
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
    if (!primaryVehicle) {
      return
    }

    const sanitizedValue = sanitizeMileage(nextMileageValue)
    setIsSavingMileage(true)

    try {
      await updateVehicle(primaryVehicle.id, { currentMileage: sanitizedValue })
      haptics.success()
      toast.success(`Mileage updated to ${sanitizedValue.toLocaleString()} km`)

      if ((primaryVehicle.nextServiceMileage ?? primaryVehicle.currentMileage + primaryVehicle.mileageInterval) <= sanitizedValue) {
        toast('Service overdue — log your service or adjust your schedule', {
          style: {
            background: '#FFF7ED',
            color: '#B45309',
            border: '1px solid #FCD34D',
          },
        })
      }

      setIsMileageSheetOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update mileage.'
      toast.error(message)
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

  return (
    <div className="brand-shell flex min-h-screen w-full justify-center overflow-hidden font-sans">
      {/* Desktop grid: sidebar + main, mobile: single column */}
      <div className="relative flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-[rgba(255,251,250,0.9)] shadow-[0_24px_80px_rgba(90,12,24,0.16)] backdrop-blur-sm lg:max-w-full lg:grid lg:grid-cols-[320px_1fr] lg:gap-0">
        {/* Sidebar for desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:items-stretch lg:justify-between lg:bg-white/80 lg:border-r lg:border-gray-100 lg:shadow-md">
          {/* Mazda Logo and Nav */}
          <div className="flex flex-col items-center gap-8 pt-10 pb-6">
            <MazdaLogo variant="icon" theme="dark" size="md" />
            <nav className="flex flex-col gap-2 w-full px-4">
              <NavButton icon={<Home className="h-6 w-6" />} label="Home" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
              <NavButton icon={<Car className="h-6 w-6" />} label="Vehicles" isActive={activeTab === 'vehicles'} onClick={() => setActiveTab('vehicles')} />
              <NavButton icon={<Settings className="h-6 w-6" />} label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </nav>
          </div>
          {/* Vehicle Rail/Quick Stats (desktop only) */}
          <div className="flex flex-col gap-4 px-4 pb-8">
            {shouldUseVehicleRail && vehicles.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">My Mazdas</h3>
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className={`mb-2 ${activeVehicleId === vehicle.id ? 'ring-2 ring-[#A31526]' : ''} rounded-xl overflow-hidden`}>
                    <CarCard vehicle={vehicle} onEditMileage={() => { setActiveVehicleId(vehicle.id); setIsMileageSheetOpen(true); }} />
                  </div>
                ))}
                {canAddVehicle && (
                  <button className="w-full rounded-xl border-2 border-dashed border-[#9B1B30] bg-[#F5E8EA] py-3 text-[#9B1B30] font-bold mt-2" onClick={() => setIsAddingCar(true)}>
                    <Plus className="inline-block mr-1" /> Add Mazda
                  </button>
                )}
              </div>
            ) : null}
            {/* Quick Stats/Alerts can be added here */}
          </div>
        </aside>
        <AnimatePresence>
          {showPWAPrompt && !pwaDismissed && !isAddingCar && activeTab === 'vehicles' ? (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="absolute top-0 z-50 w-full p-4 pt-6"
            >
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

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
        <ShortcutsHelpDialog open={shortcutsHelpOpen} onOpenChange={setShortcutsHelpOpen} />
        {/* Hide header on home tab — greeting replaces it */}
        {(activeTab !== 'home' || isAddingCar || isLoggingService) ? (
        <div className="app-top-bar sticky top-0 z-30 flex items-center justify-between px-5 pb-4 pt-12">
          <div className="flex items-center gap-3">
            {isAddingCar || isLoggingService ? (
              <button
                onClick={() => {
                  if (isAddingCar) {
                    setIsAddingCar(false)
                    return
                  }

                  setIsLoggingService(false)
                  setPrefilledServiceMileage(undefined)
                  setActiveTab(serviceReturnTab)
                }}
                className="-ml-2 rounded-full p-2 text-gray-400 hover:bg-gray-50"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            ) : null}
            <h1 className="text-[24px] font-semibold tracking-tight text-gray-900">
              {getHeaderTitle()}
            </h1>
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
                <LogService
                  embedded
                  vehicleIdOverride={primaryVehicle.id}
                  initialMileage={prefilledServiceMileage}
                  onSuccess={() => {
                    setIsLoggingService(false)
                    setPrefilledServiceMileage(undefined)
                    void fetchVehicles().catch(() => undefined)
                    void fetchLogs(primaryVehicle.id).catch(() => undefined)
                  }}
                />
              </motion.div>
            ) : (
              <motion.div key="main-tabs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                {activeTab === 'vehicles' && (!hasCars ? <EmptyGarageState onAdd={() => setIsAddingCar(true)} /> : <div className="p-8 text-center text-gray-500">Your vehicles will appear here.</div>)}
                {activeTab === 'settings' ? <SettingsView user={{ fullName: profileName, email: profileEmail, phone: profilePhone }} primaryVehicle={primaryVehicle ? { id: primaryVehicle.id, model: primaryVehicle.model, year: primaryVehicle.year, registration: primaryVehicle.registration } : null} serviceLogs={logs} onLogout={handleLogout} isLoggingOut={isLoggingOut} /> : null}
                {activeTab === 'home' ? (
                  !hasCars ? (
                    needsProfileSetup ? (
                      <NewUserOnboardingState
                        email={profileEmail}
                        fullName={profileFullName}
                        phoneNumber={profilePhone}
                        saving={isSavingProfile}
                        onSaveProfile={handleCompleteProfile}
                      />
                    ) : (
                      <EmptyHomeState userName={profileName?.split(' ')[0] || 'Driver'} onAdd={() => setIsAddingCar(true)} />
                    )
                  ) : (
                    <div className="flex h-full flex-col justify-start space-y-6 p-6 pt-[env(safe-area-inset-top,48px)]">
                      {/* Personalized Greeting */}
                      <div className="pt-2">
                        <div className="flex items-start gap-3">
                          <MazdaLogo variant="icon" theme="dark" size="sm" className="mt-1 shrink-0" />
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                              Good morning, {profileName?.split(' ')[0] || 'Driver'}!
                            </h2>
                            <p className="mt-1 text-[15px] text-gray-600">
                              Here is your daily vehicle overview.
                            </p>
                          </div>
                        </div>
                      </div>

                    {/* Vehicle Card / Rail */}
                    {primaryVehicle ? (
                      shouldUseVehicleRail ? (
                        <div className="-mx-6 space-y-3">
                          <div className="flex snap-x snap-mandatory gap-[10px] overflow-x-auto px-[14px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {vehicles.map((vehicle, index) => (
                              <div
                                key={vehicle.id}
                                ref={(node) => {
                                  railSlotRefs.current[index] = node
                                }}
                                data-slot-index={index}
                                data-slot-type="vehicle"
                                data-vehicle-id={vehicle.id}
                                className="min-w-[calc(100%-28px)] snap-start"
                              >
                                <CarCard
                                  vehicle={vehicle}
                                  onEditMileage={(target) => {
                                    setActiveVehicleId(target.id)
                                    setPrefilledServiceMileage(target.currentMileage)
                                    setIsMileageSheetOpen(true)
                                  }}
                                />
                              </div>
                            ))}

                            {canAddVehicle ? (
                              <div
                                ref={(node) => {
                                  railSlotRefs.current[vehicles.length] = node
                                }}
                                data-slot-index={vehicles.length}
                                data-slot-type="add"
                                className="min-w-[calc(100%-28px)] snap-start"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    haptics.tap()
                                    setIsAddingCar(true)
                                  }}
                                  className="flex min-h-[250px] w-full flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-[#9B1B30] bg-[#F5E8EA] text-[#9B1B30]"
                                >
                                  <Plus className="h-8 w-8" />
                                  <span className="text-sm font-bold">Add Mazda</span>
                                </button>
                              </div>
                            ) : null}
                          </div>

                          {railSlotCount > 0 ? (
                            <div className="flex items-center justify-center gap-1.5 px-[14px]">
                              {Array.from({ length: railSlotCount }).map((_, index) => (
                                <span
                                  key={`vehicle-dot-${index}`}
                                  className={`block transition-all ${
                                    activeRailIndex === index
                                      ? 'h-[5px] w-[16px] rounded-[999px] bg-[#9B1B30]'
                                      : 'h-[5px] w-[5px] rounded-full bg-[#C4BABB]'
                                  }`}
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : (
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
                                {primaryVehicle.currentMileage.toLocaleString()} km
                              </span>
                            </div>
                          </div>

                          {/* Vehicle Details Footer */}
                          <div className="space-y-3 border-t border-gray-100 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                  Current Mileage
                                </span>
                                <p className="mt-1 text-sm font-semibold text-gray-900">
                                  {primaryVehicle.currentMileage.toLocaleString()} km
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsMileageSheetOpen(true)}
                                className="inline-flex items-center gap-1 rounded-[6px] px-[10px] py-[4px] text-[11px] font-semibold text-[#9B1B30]"
                                style={{ background: '#F5E8EA', fontFamily: 'Outfit, sans-serif' }}
                              >
                                <Pencil className="h-3 w-3 text-[#9B1B30]" />
                                Update km
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Registration
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {primaryVehicle.registration}
                              </span>
                            </div>
                            {primaryVehicle.vin ? (
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                  VIN
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowFullVin((current) => !current)}
                                  className="text-sm font-semibold text-gray-900 underline-offset-2 hover:underline"
                                >
                                  {showFullVin ? `VIN: ${primaryVehicle.vin}` : `VIN: ${maskVin(primaryVehicle.vin)}`}
                                </button>
                              </div>
                            ) : null}
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Next Service
                              </span>
                              <span className="text-sm font-semibold text-[#A31526]">
                                {primaryVehicle.nextServiceMileage?.toLocaleString() || 'N/A'} km
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )
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

                    {primaryVehicle ? (
                      <MileageUpdateSheet
                        vehicle={primaryVehicle}
                        open={isMileageSheetOpen}
                        lastUpdateLabel={formatDisplayDate(latestPrimaryLog?.serviceDate)}
                        saving={isSavingMileage}
                        initialValue={prefilledServiceMileage}
                        onOpenChange={(open) => {
                          setIsMileageSheetOpen(open)
                          if (!open) {
                            setPrefilledServiceMileage(undefined)
                          }
                        }}
                        onSave={handleSaveMileage}
                        onLogService={handleOpenLogService}
                      />
                    ) : null}
                    {primaryVehicle && manualLookup ? (
                      <ManualsSheet
                        vehicle={{
                          model: primaryVehicle.model,
                          year: primaryVehicle.year,
                          registration: primaryVehicle.registration,
                        }}
                        lookup={manualLookup}
                        open={isManualSheetOpen}
                        onOpenChange={setIsManualSheetOpen}
                      />
                    ) : null}
                    {primaryVehicle && kmToNextService !== null ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`rounded-2xl border p-4 shadow-sm ${
                          kmToNextService < 1000 ? 'border-orange-100 bg-orange-50' : 'border-gray-100 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                              Next Service
                            </p>
                            <p className="mt-1 text-[24px] font-bold text-[#111010]">
                              {kmToNextService.toLocaleString()} km
                            </p>
                            <p className="mt-1 text-[12px] text-gray-600">
                              Due at {nextServiceMileage?.toLocaleString()} km
                            </p>
                          </div>
                          {kmToNextService < 1000 ? (
                            <div className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-100 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Service soon
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    ) : null}

                    {primaryVehicle ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 }}
                        className="space-y-3"
                      >
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                          Owner Essentials
                        </h3>

                        <div className="space-y-2.5 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                          <button
                            type="button"
                            onClick={() => {
                              haptics.tap()
                              handleOpenLogService(primaryVehicle.currentMileage)
                            }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5E8EA]">
                              <Wrench className="h-5 w-5 text-[#9B1B30]" strokeWidth={2} />
                            </span>
                            <span className="flex-1">
                              <span className="block text-sm font-semibold text-gray-900">Log service</span>
                              <span className="block text-xs text-gray-500">Record your latest maintenance</span>
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-300" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              haptics.tap()
                              setIsManualSheetOpen(true)
                            }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                              <BookOpen className="h-5 w-5 text-gray-700" strokeWidth={2} />
                            </span>
                            <span className="flex-1">
                              <span className="block text-sm font-semibold text-gray-900">Open Mazda manuals</span>
                              <span className="block text-xs text-gray-500">
                                {manualLookup?.sections[0]
                                  ? `${manualLookup.sections[0].matchedYearLabel} official PDFs${manualLookup.note ? ' · closest match' : ''}`
                                  : 'From Mazda official owner resources'}
                              </span>
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-300" />
                          </button>


                        </div>
                      </motion.div>
                    ) : null}
                    </div>
                  )
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile nav bar (hidden on desktop) */}
        {!isAddingCar ? (
          <div className="absolute bottom-0 z-40 w-full max-w-md px-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] lg:hidden">
            <div className="rounded-[32px] border border-[#A31526]/10 bg-[rgba(255,249,248,0.85)] px-2 py-2 shadow-[0_16px_32px_rgba(163,21,38,0.12)] backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <NavButton icon={<Home className="h-6 w-6" />} label="Home" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                <NavButton icon={<Car className="h-6 w-6" />} label="Vehicles" isActive={activeTab === 'vehicles'} onClick={() => setActiveTab('vehicles')} />
                <NavButton icon={<Settings className="h-6 w-6" />} label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
              </div>
            </div>
          </div>
        ) : null}
        </div>
      </div>
    </div>
  )
}
