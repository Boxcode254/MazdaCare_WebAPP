import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { CarFront, Fuel, MapPin, NotebookText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { KENYA_MAZDA_OILS, getRecommendedOils } from '@/lib/oils'
import { useServiceLogs } from '@/hooks/useServiceLogs'
import { useVehicles } from '@/hooks/useVehicles'

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

export function LogService() {
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const navigate = useNavigate()
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

  useEffect(() => {
    void fetchVehicles()
  }, [fetchVehicles])

  useEffect(() => {
    if (!selectedVehicle) {
      return
    }

    setValue('mileageAtService', selectedVehicle.currentMileage)
    setValue('nextServiceMileage', selectedVehicle.currentMileage + selectedVehicle.mileageInterval)
  }, [selectedVehicle, setValue])

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

    const chosenOil = KENYA_MAZDA_OILS.find((oil) => `${oil.brand}|${oil.grade}` === formValues.oilChoice)

    const finalGarageName = formValues.manualLocation?.trim() || formValues.locationSearch?.trim() || formValues.serviceLocationType

    try {
      await addLog({
        vehicleId,
        serviceDate: formValues.serviceDate,
        serviceType: formValues.serviceType,
        mileageAtService: formValues.mileageAtService,
        nextServiceMileage: formValues.nextServiceMileage,
        oilBrand: formValues.oilChoice === 'custom' ? formValues.customOilBrand?.trim() : chosenOil?.brand,
        oilGrade: formValues.oilChoice === 'custom' ? formValues.customOilGrade?.trim() : chosenOil?.grade,
        oilQuantityLitres: showOilSection ? formValues.oilQuantityLitres : undefined,
        garageName: finalGarageName,
        serviceCost: formValues.serviceCost,
        notes: formValues.notes?.trim(),
        rating: formValues.rating,
      })

      toast.success('Service log saved successfully.')
      navigate(`/service/${vehicleId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save service log.'
      toast.error(message)
    }
  }

  if (!vehicleId) {
    return <p className="text-sm text-slate-600">No vehicle selected.</p>
  }

  return (
    <section className="space-y-4 pb-4 animate-enter-up">
      <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Log Service</h1>
            <p className="text-sm text-slate-600">
              {selectedVehicle
                ? `${selectedVehicle.model} ${selectedVehicle.year} - ${selectedVehicle.registration}`
                : 'Loading vehicle details...'}
            </p>
          </div>
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-mazda-red">
            <CarFront className="h-5 w-5" />
          </div>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-white/70 bg-white/92 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NotebookText className="h-4 w-4 text-mazda-red" />
              Section A - Service details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="serviceDate">Service date</Label>
              <Input id="serviceDate" type="date" {...register('serviceDate')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mileageAtService">Mileage at service</Label>
              <Input id="mileageAtService" type="number" min={0} {...register('mileageAtService', { valueAsNumber: true })} />
            </div>

            <div className="space-y-1.5">
              <Label>Service type</Label>
              <Select value={values.serviceType} onValueChange={(value) => setValue('serviceType', value as ServiceFormValues['serviceType'])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor Service</SelectItem>
                  <SelectItem value="major">Major Service</SelectItem>
                  <SelectItem value="oil_change">Oil Change</SelectItem>
                  <SelectItem value="tyre_rotation">Tyre Rotation</SelectItem>
                  <SelectItem value="brake_service">Brake Service</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">{serviceDescriptions[values.serviceType]}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Next service mileage</Label>
                <span className="text-xs text-slate-500">{values.nextServiceMileage.toLocaleString()} km</span>
              </div>
              <Slider
                min={Math.max(values.mileageAtService + 5000, 5000)}
                max={Math.max(values.mileageAtService + 10000, 10000)}
                step={100}
                value={[values.nextServiceMileage]}
                onValueChange={(sliderValues) => setValue('nextServiceMileage', sliderValues[0], { shouldValidate: true })}
              />
            </div>
          </CardContent>
        </Card>

        {showOilSection ? (
          <Card className="border-white/70 bg-white/92 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-mazda-red" />
                Section B - Engine oil
              </CardTitle>
              <CardDescription>Recommended oils filtered by your Mazda model and fuel type.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                {recommendedOils.map((oil) => {
                  const key = `${oil.brand}|${oil.grade}`
                  const selected = values.oilChoice === key

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setValue('oilChoice', key, { shouldValidate: true })}
                      className={`rounded-lg border p-3 text-left transition ${
                        selected ? 'border-mazda-red bg-red-50' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">
                          {oil.brand} {oil.grade}
                        </p>
                        <Badge variant="outline">{oil.type}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">Approx KES {oil.approxPriceKes.toLocaleString()}</p>
                    </button>
                  )
                })}

                <button
                  type="button"
                  onClick={() => setValue('oilChoice', 'custom', { shouldValidate: true })}
                  className={`rounded-lg border p-3 text-left transition ${
                    values.oilChoice === 'custom' ? 'border-mazda-red bg-red-50' : 'border-slate-200'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">Oil not listed</p>
                </button>
              </div>

              {values.oilChoice === 'custom' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="customOilBrand">Custom brand</Label>
                    <Input id="customOilBrand" placeholder="Brand" {...register('customOilBrand')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customOilGrade">Custom grade</Label>
                    <Input id="customOilGrade" placeholder="Grade" {...register('customOilGrade')} />
                  </div>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="oilQuantityLitres">Oil quantity (litres)</Label>
                <Input id="oilQuantityLitres" type="number" step="0.5" min={0} {...register('oilQuantityLitres', { valueAsNumber: true })} />
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-white/70 bg-white/92 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-mazda-red" />
              Section C - Where was it serviced
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Service location type</Label>
              <Select
                value={values.serviceLocationType}
                onValueChange={(value) => setValue('serviceLocationType', value as ServiceFormValues['serviceLocationType'])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose location type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="garage">Garage</SelectItem>
                  <SelectItem value="petrol_station">Petrol Station</SelectItem>
                  <SelectItem value="dealer">Mazda Dealer</SelectItem>
                  <SelectItem value="mobile_mechanic">Mobile Mechanic</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="locationSearch">Search service location (Kenya)</Label>
              <Input
                id="locationSearch"
                ref={(element) => {
                  locationInputRef.current = element
                  locationFieldRef(element)
                }}
                placeholder="Type garage, station, or area name"
                {...locationFieldProps}
              />
              <p className="text-xs text-slate-500">Autocomplete uses Google Places and is restricted to Kenya.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="manualLocation">Or type manually</Label>
              <Input id="manualLocation" placeholder="Garage name or address" {...register('manualLocation')} />
            </div>

            <div className="space-y-1.5">
              <Label>Rating (1-5)</Label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setValue('rating', star, { shouldValidate: true })}
                    className={`rounded-lg border px-2 py-2 text-sm font-semibold ${
                      values.rating >= star ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    {star}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/92 shadow-sm">
          <CardHeader>
            <CardTitle>Section D - Notes and cost</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="serviceCost">Service cost (KES)</Label>
              <Input id="serviceCost" type="number" min={0} {...register('serviceCost', { valueAsNumber: true })} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mazda-red"
                placeholder="Any extra work done, parts changed, or observations"
                {...register('notes')}
              />
            </div>
          </CardContent>
        </Card>

        {(errors.serviceDate || errors.mileageAtService || errors.nextServiceMileage || errors.rating) ? (
          <p className="text-sm text-red-600">Please fix required fields before saving.</p>
        ) : null}

        <Button type="submit" className="h-11 w-full bg-[#C00000] text-white hover:bg-[#a00000]" disabled={loading}>
          {loading ? 'Saving log...' : 'Save service log'}
        </Button>
      </form>
    </section>
  )
}
