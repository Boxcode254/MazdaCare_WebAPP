import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRateLimit } from '@/hooks/useRateLimit'
import { haptics } from '@/lib/haptics'
import { MAZDA_MODELS } from '@/lib/mazda-models'
import { sanitizeMileage, sanitizePlate, sanitizeText } from '@/lib/sanitize'
import { useVehicles } from '@/hooks/useVehicles'

const colorOptions = ['White', 'Silver', 'Gray', 'Black', 'Blue', 'Red', 'Green', 'Brown']

const addCarSchema = z.object({
  model: z.enum(MAZDA_MODELS),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  fuelType: z.enum(['petrol', 'diesel']),
  engineSize: z.string().min(2, 'Engine size is required'),
  registration: z
    .string()
    .transform((value) => value.toUpperCase().trim())
    .refine((value) => /^K[A-Z]{2}\s\d{3}[A-Z]$/.test(value), 'Use Kenya format: KXX 123A'),
  currentMileage: z.number().int().min(0),
  mileageInterval: z.union([z.literal(5000), z.literal(10000)]),
  color: z.string().min(2),
})

type AddCarFormValues = z.infer<typeof addCarSchema>

const MODEL_YEAR_RANGES: Partial<Record<AddCarFormValues['model'], string>> = {
  Demio: '2008-2021',
  Axela: '2009-2022',
  Atenza: '2008-2022',
  'CX-3': '2015-2023',
  'CX-5': '2012-2024',
  'CX-9': '2016-2023',
  'BT-50': '2011-2024',
}

export function AddCar() {
  const navigate = useNavigate()
  const { addVehicle, loading } = useVehicles()
  const addCarLimit = useRateLimit({ key: 'add_vehicle', maxAttempts: 10, windowMs: 3600000 })
  const [step, setStep] = useState(1)
  const [stepVisible, setStepVisible] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<AddCarFormValues>({
    resolver: zodResolver(addCarSchema),
    defaultValues: {
      model: 'Demio',
      year: new Date().getFullYear(),
      fuelType: 'petrol',
      engineSize: '1.5L',
      registration: 'KAA 000A',
      currentMileage: 0,
      mileageInterval: 5000,
      color: 'Silver',
    },
  })

  const values = watch()

  useEffect(() => {
    setStepVisible(false)
    const id = requestAnimationFrame(() => setStepVisible(true))
    return () => cancelAnimationFrame(id)
  }, [step])

  const stepValidations = useMemo(
    () => ({
      1: ['model', 'year', 'fuelType', 'engineSize'] as const,
      2: ['registration', 'currentMileage', 'mileageInterval', 'color'] as const,
    }),
    []
  )

  const nextStep = async () => {
    if (step < 3) {
      const valid = await trigger(stepValidations[step as 1 | 2])
      if (!valid) {
        haptics.error()
        toast.error('Please fix the highlighted fields before continuing.')
        return
      }

      setStep((current) => current + 1)
    }
  }

  const previousStep = () => setStep((current) => Math.max(1, current - 1))

  const onSubmit = async (formValues: AddCarFormValues) => {
    const { allowed } = addCarLimit.check()

    if (!allowed) {
      toast.error('Vehicle limit reached for this session.')
      return
    }

    try {
      await addVehicle({
        ...formValues,
        registration: sanitizePlate(formValues.registration),
        currentMileage: sanitizeMileage(formValues.currentMileage),
        engineSize: sanitizeText(formValues.engineSize),
        color: sanitizeText(formValues.color),
      })
      toast.success('Vehicle added successfully.')
      navigate('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save vehicle.'
      toast.error(message)
    }
  }

  const onInvalidSubmit = () => {
    haptics.error()
    toast.error('Please fix the highlighted fields before saving.')
  }

  return (
    <section className="-mx-4 -mt-6 min-h-[100dvh] bg-mz-gray-100">
      <div className="bg-mz-black px-4 pb-7 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
        <p
          className="text-[14px] italic text-white/45"
          style={{ fontFamily: 'Cormorant Garamond, serif', letterSpacing: '0.1em' }}
        >
          MazdaCare
        </p>
        <h1
          className="mt-1 text-[28px] font-light italic leading-[1.1] text-white"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          Add your Mazda
        </h1>

        <div className="mt-4 flex items-center justify-center gap-1.5">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={step === n ? 'h-1.5 w-5 rounded-full bg-mz-red' : 'h-1.5 w-1.5 rounded-full bg-white/20'}
            />
          ))}
        </div>
      </div>

      <div className="-mt-4 min-h-[calc(100dvh-140px)] rounded-t-[24px] bg-white px-4 pb-8 pt-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}>
          <div
            key={step}
            className={`transition-all duration-200 ease-out ${stepVisible ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'}`}
          >
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-mz-gray-500">
                    Model
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {MAZDA_MODELS.map((model) => (
                      <button
                        key={model}
                        type="button"
                        onClick={() => setValue('model', model as AddCarFormValues['model'], { shouldValidate: true })}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-[1.5px] p-3 text-center transition ${
                          values.model === model ? 'border-mz-red bg-mz-red-light' : 'border-transparent bg-mz-gray-100'
                        }`}
                      >
                        <span className="text-[13px] font-semibold text-mz-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {model}
                        </span>
                        <span className="text-[10px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {MODEL_YEAR_RANGES[model as AddCarFormValues['model']] ?? '2008-2024'}
                        </span>
                      </button>
                    ))}
                  </div>
                  {errors.model ? <p className="text-xs text-red-600">{errors.model.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="year" className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-mz-gray-500">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    min={1990}
                    max={new Date().getFullYear() + 1}
                    className="h-auto rounded-lg border border-transparent bg-mz-gray-100 px-3 py-[9px] text-[13px] text-mz-black shadow-none focus-visible:border-mz-red focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[rgba(155,27,48,0.1)]"
                    {...register('year', { valueAsNumber: true })}
                  />
                  {errors.year ? <p className="text-xs text-red-600">{errors.year.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-mz-gray-500">Fuel Type</Label>
                  <div className="flex rounded-[10px] bg-mz-gray-100 p-[3px]">
                    {(['petrol', 'diesel'] as const).map((fuel) => (
                      <button
                        key={fuel}
                        type="button"
                        onClick={() => setValue('fuelType', fuel, { shouldValidate: true })}
                        className={`flex-1 rounded-lg px-3 py-[9px] text-center text-[13px] font-semibold transition ${
                          values.fuelType === fuel
                            ? fuel === 'petrol'
                              ? 'bg-mz-red text-white'
                              : 'bg-[#1A3A6B] text-white'
                            : 'bg-transparent text-mz-gray-500'
                        }`}
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {fuel === 'petrol' ? 'Petrol' : 'Diesel'}
                      </button>
                    ))}
                  </div>
                  {errors.fuelType ? <p className="text-xs text-red-600">{errors.fuelType.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="engineSize" className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-mz-gray-500">Engine Size</Label>
                  <Input
                    id="engineSize"
                    className="h-auto rounded-lg border border-transparent bg-mz-gray-100 px-3 py-[9px] text-[13px] text-mz-black shadow-none focus-visible:border-mz-red focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[rgba(155,27,48,0.1)]"
                    placeholder="e.g. 1.5L"
                    {...register('engineSize')}
                  />
                  {errors.engineSize ? <p className="text-xs text-red-600">{errors.engineSize.message}</p> : null}
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="registration" className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-mz-gray-500">Registration Plate</Label>
                  <Input
                    id="registration"
                    className="h-auto rounded-lg border border-transparent bg-mz-gray-100 px-3 py-[9px] text-[13px] text-mz-black shadow-none focus-visible:border-mz-red focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[rgba(155,27,48,0.1)]"
                    placeholder="KXX 123A"
                    {...register('registration')}
                  />
                  {errors.registration ? <p className="text-xs text-red-600">{errors.registration.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="currentMileage" className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-mz-gray-500">Current Mileage (km)</Label>
                  <Input
                    id="currentMileage"
                    className="h-auto rounded-lg border border-transparent bg-mz-gray-100 px-3 py-[9px] text-[13px] text-mz-black shadow-none focus-visible:border-mz-red focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[rgba(155,27,48,0.1)]"
                    type="number"
                    min={0}
                    {...register('currentMileage', { valueAsNumber: true })}
                  />
                  {errors.currentMileage ? <p className="text-xs text-red-600">{errors.currentMileage.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-mz-gray-500">Mileage Interval</Label>
                  <div className="flex rounded-[10px] bg-mz-gray-100 p-[3px]">
                    {[5000, 10000].map((interval) => (
                      <button
                        key={interval}
                        type="button"
                        onClick={() => setValue('mileageInterval', interval as 5000 | 10000, { shouldValidate: true })}
                        className={`flex-1 rounded-lg px-3 py-[9px] text-center text-[13px] font-semibold transition ${
                          values.mileageInterval === interval
                            ? 'bg-mz-red text-white'
                            : 'bg-transparent text-mz-gray-500'
                        }`}
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {interval.toLocaleString()} km
                      </button>
                    ))}
                  </div>
                  {errors.mileageInterval ? <p className="text-xs text-red-600">{errors.mileageInterval.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-mz-gray-500">Car Color</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setValue('color', color, { shouldValidate: true })}
                        className={`min-h-11 rounded-lg border px-2 py-2 text-xs font-medium transition ${
                          values.color === color ? 'border-mz-red bg-mz-red-light text-mz-red' : 'border-transparent bg-mz-gray-100 text-mz-gray-700'
                        }`}
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                  {errors.color ? <p className="text-xs text-red-600">{errors.color.message}</p> : null}
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-[16px] border border-[0.5px] border-black/6 bg-mz-white">
                  <div className="relative min-h-[90px] bg-mz-black px-[14px] pb-[20px] pt-[14px]">
                    <h3
                      className="text-white"
                      style={{
                        fontFamily: 'Cormorant Garamond, serif',
                        fontSize: '24px',
                        fontWeight: 300,
                        fontStyle: 'italic',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Mazda {values.model}
                    </h3>
                    <p className="mt-[2px] text-xs text-white/45" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {values.year} • {values.engineSize}
                    </p>
                    <span
                      className="absolute right-[14px] top-[14px] rounded-[4px] bg-white/10 px-[9px] py-[3px] text-[11px] font-semibold text-white"
                      style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.04em' }}
                    >
                      {values.registration?.toUpperCase()}
                    </span>
                    <span
                      className={`absolute bottom-[14px] right-[14px] rounded-[20px] px-[9px] py-[3px] text-[10px] font-semibold uppercase text-white ${
                        values.fuelType === 'diesel' ? 'bg-[#1A3A6B]' : 'bg-mz-red'
                      }`}
                      style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.04em' }}
                    >
                      {values.fuelType}
                    </span>
                  </div>
                  <div className="bg-mz-white px-[14px] py-[12px]">
                    <p className="text-[18px] font-semibold text-mz-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {Number(values.currentMileage || 0).toLocaleString()} km
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-mz-gray-100 bg-mz-gray-100/40 p-3">
                  <div className="grid grid-cols-2 gap-y-2">
                    {[
                      ['Model', values.model],
                      ['Year', values.year],
                      ['Fuel', values.fuelType],
                      ['Engine', values.engineSize],
                      ['Registration', values.registration?.toUpperCase()],
                      ['Mileage', `${Number(values.currentMileage || 0).toLocaleString()} km`],
                      ['Interval', `${Number(values.mileageInterval || 0).toLocaleString()} km`],
                      ['Color', values.color],
                    ].map(([k, v]) => (
                      <>
                        <p
                          key={`${k}-k`}
                          className="text-[11px] uppercase text-mz-gray-500"
                          style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.06em' }}
                        >
                          {k}
                        </p>
                        <p key={`${k}-v`} className="text-[13px] font-semibold text-mz-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {v}
                        </p>
                      </>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {step < 3 ? (
            <Button
              type="button"
              className="mt-6 w-full rounded-xl bg-mz-red py-3.5 text-[14px] font-semibold text-white transition-transform duration-100 hover:bg-mz-red-mid active:scale-[0.97]"
              style={{ fontFamily: 'Outfit, sans-serif' }}
              onClick={nextStep}
            >
              Continue →
            </Button>
          ) : (
            <Button
              type="submit"
              className="mt-6 w-full rounded-xl bg-mz-red py-3.5 text-[14px] font-semibold text-white transition-transform duration-100 hover:bg-mz-red-mid active:scale-[0.97]"
              style={{ fontFamily: 'Outfit, sans-serif' }}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? 'Saving...' : 'Save vehicle'}
            </Button>
          )}

          <button
            type="button"
            className="mt-2 w-full bg-transparent text-[13px] text-mz-red"
            style={{ fontFamily: 'Outfit, sans-serif' }}
            onClick={previousStep}
            disabled={step === 1 || loading}
          >
            Back
          </button>
        </form>
      </div>
    </section>
  )
}
