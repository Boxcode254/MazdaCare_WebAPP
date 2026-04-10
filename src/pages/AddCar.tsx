import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Car, Loader2 } from 'lucide-react'
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
const kenyaPlatePattern = /^K[A-Z]{2}\s\d{3}[A-Z]$/

const modelCards = [
  {
    label: 'CX-5',
    value: 'CX-5',
    accent: 'Grey',
    imageUrl: 'https://images.unsplash.com/photo-1743114713503-b698b8433f03?w=1080',
  },
  {
    label: 'Demio / 2',
    value: 'Demio',
    accent: 'White',
    imageUrl: 'https://images.unsplash.com/photo-1756664825749-d481c5a94a57?w=1080',
  },
  {
    label: 'Mazda 3',
    value: 'Axela',
    accent: 'Blue',
    imageUrl: 'https://images.unsplash.com/photo-1754908132913-559fbdf12a36?w=1080',
  },
  {
    label: 'MX-5',
    value: 'MX-5',
    accent: 'Red',
    imageUrl: 'https://images.unsplash.com/photo-1633118013371-4aed8e7fbae9?w=1080',
  },
] as const

const addCarSchema = z.object({
  model: z.enum(MAZDA_MODELS),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  fuelType: z.enum(['petrol', 'diesel']),
  engineSize: z.string().min(2, 'Engine size is required'),
  registration: z
    .string()
    .transform((value) => value.toUpperCase().trim())
      .refine((value) => kenyaPlatePattern.test(value), 'Use Kenya format: KXX 123A'),
  currentMileage: z.number().int().min(0),
  mileageInterval: z.union([z.literal(5000), z.literal(7000), z.literal(9000), z.literal(10000)]),
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
  'MX-5': '2016-2024',
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
  const stepMeta = {
    1: {
      eyebrow: 'Step 1 of 2',
      title: 'Choose your Mazda',
      subtitle: 'Pick the model that matches your car to start your garage profile.',
      cta: 'Next: Vehicle details',
      helper: 'Choose the card that looks closest to your Mazda.',
    },
    2: {
      eyebrow: 'Step 2 of 2',
      title: 'A few final details',
      subtitle: 'Add the essentials below, then save your vehicle to MazdaCare.',
      cta: 'Save Vehicle',
      helper: 'These fields are kept simple and touch-friendly.',
    },
  } as const

  const stepLabels = ['Model', 'Details'] as const
  const progressPercent = (step / stepLabels.length) * 100
  const isStepReady =
    step === 1
      ? Boolean(values.model)
      : Boolean(values.year >= 1990 && values.color.trim().length >= 2)

  useEffect(() => {
    setStepVisible(false)
    const id = requestAnimationFrame(() => setStepVisible(true))
    return () => cancelAnimationFrame(id)
  }, [step])

  const stepValidations = useMemo(
    () => ({
      1: ['model'] as const,
      2: ['year', 'color'] as const,
    }),
    []
  )

  const nextStep = async () => {
    if (step < 2) {
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

    haptics.medium()

    try {
      await addVehicle({
        ...formValues,
        registration: sanitizePlate(formValues.registration),
        currentMileage: sanitizeMileage(formValues.currentMileage),
        engineSize: sanitizeText(formValues.engineSize),
        color: sanitizeText(formValues.color),
        mileageInterval: formValues.mileageInterval,
      })
      haptics.success()
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
    <section className="-mx-4 -mt-6 min-h-[100dvh] bg-mz-gray-100 px-4 pb-8 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
      <div className="mx-auto max-w-md overflow-hidden rounded-[28px] bg-mz-black shadow-shell">
        <div className="px-5 pb-7 pt-5">
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

          <p className="mt-2 max-w-[320px] text-[13px] text-white/50" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {stepMeta[step as 1 | 2].eyebrow} · {stepMeta[step as 1 | 2].helper}
          </p>

          <div className="mt-4 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-mz-red transition-[width] duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-white/45" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {stepLabels.map((label, index) => (
              <span key={label} className={step === index + 1 ? 'text-white' : ''}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="-mt-1 min-h-[calc(100dvh-180px)] rounded-t-[28px] bg-white px-5 pb-8 pt-6">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-mz-red" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {stepMeta[step as 1 | 2].eyebrow}
            </p>
            <h2 className="mt-1 text-[26px] font-light italic leading-[1.05] text-mz-black" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {stepMeta[step as 1 | 2].title}
            </h2>
            <p className="mt-2 text-[13px] text-mz-gray-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {stepMeta[step as 1 | 2].subtitle}
            </p>
          </div>

          <div
            key={step}
            className={`transition-all duration-200 ease-out ${stepVisible ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'}`}
          >
            {step === 1 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {modelCards.map((card) => (
                    <button
                      key={card.label}
                      type="button"
                      onClick={() => setValue('model', card.value as AddCarFormValues['model'], { shouldValidate: true })}
                      className={`overflow-hidden rounded-2xl border bg-white text-left transition active:scale-[0.98] ${
                        values.model === card.value ? 'border-[#A31526] shadow-button' : 'border-black/8'
                      }`}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-mz-gray-100">
                        <img src={card.imageUrl} alt={card.label} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                        <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/92 shadow-sm">
                          <Car className="h-4 w-4 text-[#A31526]" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <p className="text-[17px] font-light italic leading-none" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                            {card.label}
                          </p>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-white/75" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            <span>{card.accent}</span>
                            <span>{MODEL_YEAR_RANGES[card.value as AddCarFormValues['model']] ?? '2016-2024'}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {errors.model ? <p className="text-xs text-red-600">{errors.model.message}</p> : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="year" className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-mz-gray-500">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    min={1990}
                    max={new Date().getFullYear() + 1}
                    className="h-auto rounded-xl border border-transparent bg-mz-gray-100 px-4 py-3.5 text-[15px] text-mz-black shadow-none focus-visible:border-mz-red focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[rgba(163,21,38,0.12)]"
                    {...register('year', { valueAsNumber: true })}
                  />
                  {errors.year ? <p className="text-xs text-red-600">{errors.year.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="color" className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-mz-gray-500">Color</Label>
                  <Input
                    id="color"
                    className="h-auto rounded-xl border border-transparent bg-mz-gray-100 px-4 py-3.5 text-[15px] text-mz-black shadow-none focus-visible:border-mz-red focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[rgba(163,21,38,0.12)]"
                    placeholder="e.g. Machine Grey"
                    list="mazda-color-options"
                    {...register('color')}
                  />
                  <datalist id="mazda-color-options">
                    {colorOptions.map((color) => (
                      <option key={color} value={color} />
                    ))}
                  </datalist>
                  {errors.color ? <p className="text-xs text-red-600">{errors.color.message}</p> : null}
                </div>
              </div>
            ) : null}
          </div>

          {step < 2 ? (
            <Button
              type="button"
              className="mt-6 w-full rounded-xl bg-mz-red py-3.5 text-[14px] font-semibold text-white transition-transform duration-100 hover:bg-mz-red-mid active:scale-[0.97]"
              style={{ fontFamily: 'Outfit, sans-serif' }}
              onClick={nextStep}
            >
              {stepMeta[step as 1 | 2].cta}
            </Button>
          ) : (
            <Button
              type="submit"
              className={`mt-6 w-full rounded-xl bg-mz-red py-3.5 text-[14px] font-semibold text-white transition-transform duration-100 hover:bg-mz-red-mid active:scale-[0.97] ${isStepReady && !loading ? 'animate-pulse shadow-button' : ''}`}
              style={{ fontFamily: 'Outfit, sans-serif' }}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? 'Saving...' : stepMeta[step as 1 | 2].cta}
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
      </div>
    </section>
  )
}
