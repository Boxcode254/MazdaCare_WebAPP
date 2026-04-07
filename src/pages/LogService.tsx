import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Building2, CarFront, ChevronDown, Fuel, Home, Loader2, MapPin, Search, Star } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useRateLimit } from '@/hooks/useRateLimit'
import { haptics } from '@/lib/haptics'
import { KENYA_MAZDA_OILS, getRecommendedOils } from '@/lib/oils'
import { sanitizeCost, sanitizeMileage, sanitizeNote, sanitizeText } from '@/lib/sanitize'
import { useServiceLogs } from '@/hooks/useServiceLogs'
import { useVehicles } from '@/hooks/useVehicles'

interface LogServiceProps {
  vehicleIdOverride?: string
  initialMileage?: number
  embedded?: boolean
  onSuccess?: () => void
}

const serviceSchema = z.object({
  serviceDate: z.string().min(1),
  mileageAtService: z.number().int().min(0),
  serviceType: z.enum(['minor', 'major', 'oil_change', 'tyre_rotation', 'brake_service', 'other']),
  nextServiceMileage: z.number().int().min(1),
  oilChoice: z.string().optional(),
  customOilBrand: z.string().optional(),
  customOilGrade: z.string().optional(),
  oilQuantityLitres: z.number().min(0).optional(),
  serviceLocationType: z.enum(['garage', 'petrol_station', 'dealer', 'mobile_mechanic', 'home']),
  locationSearch: z.string().optional(),
  manualLocation: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  serviceCost: z.number().min(0).optional(),
  notes: z.string().optional(),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

const serviceDescriptions: Record<ServiceFormValues['serviceType'], string> = {
  minor: 'Engine oil, filter, and basic fluid checks.',
  major: 'Comprehensive inspection including major wear components.',
  oil_change: 'Engine oil and oil filter replacement.',
  tyre_rotation: 'Tyre position balancing to improve life and grip.',
  brake_service: 'Brake inspection and pad/disc maintenance.',
  other: 'Any other maintenance action.',
}

export function LogService({ vehicleIdOverride, initialMileage, embedded = false, onSuccess }: LogServiceProps = {}) {
  const { vehicleId: routeVehicleId } = useParams<{ vehicleId: string }>()
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicleIdOverride ?? routeVehicleId ?? '')
  const [isVehicleSheetOpen, setIsVehicleSheetOpen] = useState(false)
  const vehicleId = selectedVehicleId || undefined
  const navigate = useNavigate()
  const logLimit = useRateLimit({ key: 'log_service', maxAttempts: 20, windowMs: 3600000 })
  const { vehicles, fetchVehicles } = useVehicles()
  const { addLog, loading } = useServiceLogs()

  const locationInputRef = useRef<HTMLInputElement | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      serviceDate: new Date().toISOString().slice(0, 10),
      mileageAtService: 0,
      serviceType: 'minor',
      nextServiceMileage: 5000,
      oilChoice: '',
      customOilBrand: '',
      customOilGrade: '',
      oilQuantityLitres: 4,
      serviceLocationType: 'garage',
      locationSearch: '',
      manualLocation: '',
      rating: 4,
      serviceCost: undefined,
      notes: '',
    },
  })

  const { ref: locationFieldRef, ...locationFieldProps } = register('locationSearch')

  const values = watch()
  const selectedVehicle = useMemo(() => vehicles.find((vehicle) => vehicle.id === vehicleId), [vehicleId, vehicles])
  const selectedInterval = values.nextServiceMileage - values.mileageAtService >= 10000 ? 10000 : 5000

  const sectionCardClass = 'mx-[14px] mb-[10px] rounded-[16px] border border-[0.5px] border-black/6 bg-white p-[14px]'
  const sectionTitleClass = 'mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-mz-red'
  const fieldLabelClass = 'mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-mz-gray-500'
  const fieldInputClass =
    'h-auto rounded-lg border border-transparent bg-mz-gray-100 px-3 py-[9px] text-[13px] text-mz-black shadow-none placeholder:text-[#9B6163] focus-visible:border-mz-red focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[rgba(155,27,48,0.1)]'

  useEffect(() => {
    const resolvedVehicleId = vehicleIdOverride ?? routeVehicleId ?? ''

    if (resolvedVehicleId) {
      setSelectedVehicleId(resolvedVehicleId)
    }
  }, [routeVehicleId, vehicleIdOverride])

  useEffect(() => {
    void fetchVehicles()
  }, [fetchVehicles])

  useEffect(() => {
    if (!selectedVehicle) {
      return
    }

    const startingMileage = typeof initialMileage === 'number' ? initialMileage : selectedVehicle.currentMileage
    setValue('mileageAtService', startingMileage)
    setValue('nextServiceMileage', startingMileage + selectedVehicle.mileageInterval)
  }, [initialMileage, selectedVehicle, setValue])

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

    if (!apiKey || !locationInputRef.current) {
      return
    }

    let listener: { remove: () => void } | null = null

    setOptions({ key: apiKey })

    void importLibrary('places').then(() => {
      const googleApi = (window as Window & { google?: any }).google

      if (!googleApi?.maps?.places || !locationInputRef.current) {
        return
      }

      const autocomplete = new googleApi.maps.places.Autocomplete(locationInputRef.current, {
        componentRestrictions: { country: 'ke' },
        fields: ['formatted_address', 'name'],
      })

      listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        const label = place?.formatted_address || place?.name || ''
        if (label) {
          setValue('locationSearch', label, { shouldValidate: true })
        }
      })
    })

    return () => {
      listener?.remove()
    }
  }, [setValue])

  const recommendedOils = useMemo(() => {
    if (!selectedVehicle) {
      return []
    }

    return getRecommendedOils(selectedVehicle.model, selectedVehicle.fuelType)
  }, [selectedVehicle])

  const showOilSection = ['minor', 'major', 'oil_change'].includes(values.serviceType)

  const onSubmit = async (formValues: ServiceFormValues) => {
    if (!vehicleId || !selectedVehicle) {
      toast.error('Vehicle not found for this service log.')
      return
    }

    const { allowed } = logLimit.check()

    if (!allowed) {
      toast.error('Too many logs submitted. Please wait.')
      return
    }

    haptics.medium()

    const chosenOil = KENYA_MAZDA_OILS.find((oil) => `${oil.brand}|${oil.grade}` === formValues.oilChoice)

    const finalGarageName =
      sanitizeText(formValues.manualLocation ?? '') ||
      sanitizeText(formValues.locationSearch ?? '') ||
      formValues.serviceLocationType

    try {
      await addLog({
        vehicleId,
        serviceDate: formValues.serviceDate,
        serviceType: formValues.serviceType,
        mileageAtService: sanitizeMileage(formValues.mileageAtService),
        nextServiceMileage: formValues.nextServiceMileage,
        oilBrand: formValues.oilChoice === 'custom' ? sanitizeText(formValues.customOilBrand ?? '') : chosenOil?.brand,
        oilGrade: formValues.oilChoice === 'custom' ? sanitizeText(formValues.customOilGrade ?? '') : chosenOil?.grade,
        oilQuantityLitres: showOilSection ? formValues.oilQuantityLitres : undefined,
        garageName: finalGarageName,
        serviceCost: typeof formValues.serviceCost === 'number' ? sanitizeCost(formValues.serviceCost) : undefined,
        notes: sanitizeNote(formValues.notes ?? ''),
        rating: formValues.rating,
      })

      haptics.success()
      toast.success('Service log saved successfully.')
      if (embedded) {
        onSuccess?.()
      } else {
        navigate(`/service/${vehicleId}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save service log.'
      toast.error(message)
    }
  }

  const onInvalidSubmit = () => {
    haptics.error()
    toast.error('Please fix required fields before saving.')
  }

  if (!vehicleId) {
    return <p className="text-[13px] text-mz-gray-500">No vehicle selected.</p>
  }

  return (
    <section className="space-y-4 bg-mz-gray-100 pb-4 animate-enter-up">
      {!embedded ? (
        <PageHeader
          title="Log Service"
          subtitle={
            selectedVehicle
              ? `${selectedVehicle.model} ${selectedVehicle.year} - ${selectedVehicle.registration}`
              : 'Loading vehicle details...'
          }
          backTo={vehicleId ? `/service/${vehicleId}` : '/'}
          action={<CarFront className="h-5 w-5 text-white/60" />}
        />
      ) : null}

      <form className="space-y-0" onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}>
        <div className={sectionCardClass}>
          <div className="flex items-center justify-between gap-3">
            <Label className={fieldLabelClass}>Vehicle</Label>
            <button
              type="button"
              onClick={() => setIsVehicleSheetOpen(true)}
              disabled={vehicles.length <= 1}
              className="inline-flex max-w-[78%] items-center gap-2 rounded-full bg-mz-gray-100 px-3 py-2 text-left text-[12px] font-semibold text-mz-black disabled:cursor-default"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              <CarFront className="h-4 w-4 shrink-0 text-mz-red" />
              <span className="truncate">
                {selectedVehicle ? `${selectedVehicle.model} · ${selectedVehicle.registration}` : 'Select vehicle'}
              </span>
              {vehicles.length > 1 ? <ChevronDown className="h-4 w-4 shrink-0 text-mz-gray-500" /> : null}
            </button>
          </div>
          {vehicles.length > 1 ? (
            <p className="mt-2 text-[11px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Tap the chip to switch vehicles quickly.
            </p>
          ) : null}
        </div>

        <div className={sectionCardClass}>
          <h3 className={sectionTitleClass} style={{ fontFamily: 'Outfit, sans-serif' }}>
            Service Details
          </h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="serviceDate" className={fieldLabelClass}>Service Date</Label>
              <Input id="serviceDate" type="date" className={fieldInputClass} {...register('serviceDate')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mileageAtService" className={fieldLabelClass}>Mileage At Service</Label>
              <Input
                id="mileageAtService"
                type="number"
                min={0}
                className={fieldInputClass}
                {...register('mileageAtService', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className={fieldLabelClass}>Service Type</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: 'minor', label: 'Minor' },
                  { value: 'major', label: 'Major' },
                  { value: 'oil_change', label: 'Oil Change' },
                  { value: 'tyre_rotation', label: 'Tyre' },
                  { value: 'brake_service', label: 'Brake' },
                  { value: 'other', label: 'Other' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setValue('serviceType', item.value as ServiceFormValues['serviceType'], { shouldValidate: true })}
                    className={`rounded-lg border px-2.5 py-[9px] text-center text-xs font-semibold transition ${
                      values.serviceType === item.value
                        ? 'border-mz-red bg-mz-red text-white'
                        : 'border-transparent bg-mz-gray-100 text-mz-gray-700'
                    }`}
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-mz-gray-500">{serviceDescriptions[values.serviceType]}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className={fieldLabelClass}>Next Service Interval</Label>
                <span className="text-[11px] text-mz-gray-500">{values.nextServiceMileage.toLocaleString()} km</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[5000, 10000].map((interval) => (
                  <button
                    key={interval}
                    type="button"
                    onClick={() => setValue('nextServiceMileage', values.mileageAtService + interval, { shouldValidate: true })}
                    className={`rounded-lg border px-2.5 py-[9px] text-center text-xs font-semibold transition ${
                      selectedInterval === interval
                        ? 'border-mz-red bg-mz-red text-white'
                        : 'border-transparent bg-mz-gray-100 text-mz-gray-700'
                    }`}
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {interval.toLocaleString()} km
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showOilSection ? (
          <div className={sectionCardClass}>
            <h3 className={sectionTitleClass} style={{ fontFamily: 'Outfit, sans-serif' }}>
              Engine Oil
            </h3>
            <div className="space-y-3">
              <p className="text-[11px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Recommended oils filtered by your Mazda model and fuel type.
              </p>
              <div className="grid gap-2">
                {recommendedOils.map((oil) => {
                  const key = `${oil.brand}|${oil.grade}`
                  const selected = values.oilChoice === key
                  const oilTypeClass =
                    oil.type === 'synthetic'
                      ? 'bg-mz-black text-white'
                      : oil.type === 'semi-synthetic'
                        ? 'bg-mz-gray-700 text-white'
                        : 'bg-[#9B6163] text-white'

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setValue('oilChoice', key, { shouldValidate: true })}
                      className={`mb-1 flex items-center gap-2.5 rounded-[10px] border border-[0.5px] px-3 py-2.5 text-left transition ${
                        selected ? 'border-mz-red bg-mz-red-light' : 'border-transparent bg-mz-gray-100'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${selected ? 'bg-mz-red' : 'bg-mz-gray-300'}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-mz-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {oil.brand}
                        </p>
                        <p className="text-[10px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {oil.grade}
                        </p>
                      </div>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${oilTypeClass}`}
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {oil.type}
                      </span>
                    </button>
                  )
                })}

                <button
                  type="button"
                  onClick={() => setValue('oilChoice', 'custom', { shouldValidate: true })}
                  className={`mb-1 flex items-center gap-2.5 rounded-[10px] border border-[0.5px] px-3 py-2.5 text-left transition ${
                    values.oilChoice === 'custom' ? 'border-mz-red bg-mz-red-light' : 'border-transparent bg-mz-gray-100'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${values.oilChoice === 'custom' ? 'bg-mz-red' : 'bg-mz-gray-300'}`}
                    aria-hidden="true"
                  />
                  <p className="text-xs font-semibold text-mz-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Oil not listed
                  </p>
                </button>
              </div>

              {values.oilChoice === 'custom' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="customOilBrand" className={fieldLabelClass}>Custom Brand</Label>
                    <Input id="customOilBrand" className={fieldInputClass} placeholder="Brand" {...register('customOilBrand')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customOilGrade" className={fieldLabelClass}>Custom Grade</Label>
                    <Input id="customOilGrade" className={fieldInputClass} placeholder="Grade" {...register('customOilGrade')} />
                  </div>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="oilQuantityLitres" className={fieldLabelClass}>Oil Quantity (Litres)</Label>
                <Input
                  id="oilQuantityLitres"
                  className={fieldInputClass}
                  type="number"
                  step="0.5"
                  min={0}
                  {...register('oilQuantityLitres', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className={sectionCardClass}>
          <h3 className={sectionTitleClass} style={{ fontFamily: 'Outfit, sans-serif' }}>
            Where Serviced
          </h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className={fieldLabelClass}>Garage Type</Label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'garage', label: 'Nearby', icon: MapPin },
                  { value: 'dealer', label: 'Dealer', icon: Building2 },
                  { value: 'petrol_station', label: 'Petrol Station', icon: Fuel },
                  { value: 'home', label: 'Home', icon: Home },
                ].map((item) => {
                  const active = values.serviceLocationType === item.value
                  const Icon = item.icon

                  return (
                    <button
                      key={item.value}
                      type="button"
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-[7px] text-[11px] font-semibold ${
                        active ? 'bg-mz-red-light text-mz-red' : 'bg-mz-gray-100 text-mz-gray-700'
                      }`}
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                      onClick={() => setValue('serviceLocationType', item.value as ServiceFormValues['serviceLocationType'])}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="locationSearch" className={fieldLabelClass}>Search Service Location</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mz-gray-500" />
                <Input
                  id="locationSearch"
                  ref={(element) => {
                    locationInputRef.current = element
                    locationFieldRef(element)
                  }}
                  className={`${fieldInputClass} pl-9`}
                  placeholder="Search garages in Nairobi..."
                  {...locationFieldProps}
                />
              </div>
              <p className="text-[11px] text-mz-gray-500">Autocomplete uses Google Places and is restricted to Kenya.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="manualLocation" className={fieldLabelClass}>Or Type Manually</Label>
              <Input id="manualLocation" className={fieldInputClass} placeholder="Garage name or address" {...register('manualLocation')} />
            </div>

            <div className="space-y-1.5">
              <Label className={fieldLabelClass}>Garage Rating</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      haptics.tap()
                      setValue('rating', star, { shouldValidate: true })
                    }}
                    className="leading-none"
                    aria-label={`Set rating ${star}`}
                  >
                    <Star
                      className={`h-6 w-6 ${values.rating >= star ? 'fill-current text-mz-gold' : 'text-[#E8E2E3]'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={sectionCardClass}>
          <h3 className={sectionTitleClass} style={{ fontFamily: 'Outfit, sans-serif' }}>
            Notes & Cost
          </h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="serviceCost" className={fieldLabelClass}>Service Cost</Label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-mz-gray-500"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  KES
                </span>
                <Input
                  id="serviceCost"
                  className={`${fieldInputClass} pl-12`}
                  type="number"
                  min={0}
                  {...register('serviceCost', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className={fieldLabelClass}>Notes</Label>
              <textarea
                id="notes"
                className="min-h-24 w-full rounded-lg border border-transparent bg-mz-gray-100 px-3 py-[9px] text-[13px] text-mz-black outline-none focus:border-mz-red focus:bg-white focus:ring-[3px] focus:ring-[rgba(155,27,48,0.1)]"
                placeholder="Any extra work done, parts changed, or observations"
                {...register('notes')}
              />
            </div>
          </div>
        </div>

        {(errors.serviceDate || errors.mileageAtService || errors.nextServiceMileage || errors.rating) ? (
          <p className="mx-[14px] text-sm text-red-600">Please fix required fields before saving.</p>
        ) : null}

        <Button
          type="submit"
          className="mx-[14px] w-[calc(100%-28px)] rounded-xl bg-mz-red py-3.5 text-sm font-semibold tracking-[0.02em] text-white transition active:scale-[0.98] hover:bg-mz-red-mid"
          style={{ fontFamily: 'Outfit, sans-serif' }}
          disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? 'Saving log...' : 'Save service log'}
        </Button>
      </form>

      <Sheet open={isVehicleSheetOpen} onOpenChange={setIsVehicleSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[60vh] rounded-t-[24px] border-0 bg-white px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-4"
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-200" />
          <h3 className="text-[13px] font-bold uppercase tracking-[0.08em] text-mz-red" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Choose Vehicle
          </h3>
          <div className="mt-3 space-y-2 overflow-y-auto">
            {vehicles.map((vehicle) => {
              const isActive = vehicle.id === selectedVehicle?.id
              return (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => {
                    setSelectedVehicleId(vehicle.id)
                    setIsVehicleSheetOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                    isActive ? 'border-mz-red bg-mz-red-light' : 'border-transparent bg-mz-gray-100'
                  }`}
                >
                  <div>
                    <p className="text-[13px] font-semibold text-mz-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {vehicle.model} {vehicle.year}
                    </p>
                    <p className="text-[11px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {vehicle.registration}
                    </p>
                  </div>
                  {isActive ? <span className="h-2 w-2 rounded-full bg-mz-red" /> : null}
                </button>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  )
}
