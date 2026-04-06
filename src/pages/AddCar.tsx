import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MAZDA_MODELS } from '@/lib/mazda-models'
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

export function AddCar() {
  const navigate = useNavigate()
  const { addVehicle, loading } = useVehicles()
  const [step, setStep] = useState(1)

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
        toast.error('Please fix the highlighted fields before continuing.')
        return
      }

      setStep((current) => current + 1)
    }
  }

  const previousStep = () => setStep((current) => Math.max(1, current - 1))

  const onSubmit = async (formValues: AddCarFormValues) => {
    try {
      await addVehicle(formValues)
      toast.success('Vehicle added successfully.')
      navigate('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save vehicle.'
      toast.error(message)
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-mazda-red">Step {step} of 3</p>
        <h1 className="text-2xl font-semibold text-slate-900">Add Your Mazda</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && 'Vehicle details'}
            {step === 2 && 'Usage and registration'}
            {step === 3 && 'Confirm your details'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Start with model, year, fuel type, and engine.'}
            {step === 2 && 'Set registration, mileage interval, and color.'}
            {step === 3 && 'Review all details before saving to your garage.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {step === 1 ? (
              <>
                <div className="space-y-1.5">
                  <Label>Model</Label>
                  <Select value={values.model} onValueChange={(value) => setValue('model', value as AddCarFormValues['model'])}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAZDA_MODELS.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.model ? <p className="text-xs text-red-600">{errors.model.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    min={1990}
                    max={new Date().getFullYear() + 1}
                    {...register('year', { valueAsNumber: true })}
                  />
                  {errors.year ? <p className="text-xs text-red-600">{errors.year.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label>Fuel type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['petrol', 'diesel'] as const).map((fuel) => (
                      <button
                        key={fuel}
                        type="button"
                        onClick={() => setValue('fuelType', fuel, { shouldValidate: true })}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          values.fuelType === fuel ? 'border-mazda-red bg-red-50 text-mazda-red' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {fuel === 'petrol' ? 'Petrol' : 'Diesel'}
                      </button>
                    ))}
                  </div>
                  {errors.fuelType ? <p className="text-xs text-red-600">{errors.fuelType.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="engineSize">Engine size</Label>
                  <Input id="engineSize" placeholder="e.g. 1.5L" {...register('engineSize')} />
                  {errors.engineSize ? <p className="text-xs text-red-600">{errors.engineSize.message}</p> : null}
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="registration">Registration plate</Label>
                  <Input id="registration" placeholder="KXX 123A" {...register('registration')} />
                  {errors.registration ? <p className="text-xs text-red-600">{errors.registration.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="currentMileage">Current mileage (km)</Label>
                  <Input id="currentMileage" type="number" min={0} {...register('currentMileage', { valueAsNumber: true })} />
                  {errors.currentMileage ? <p className="text-xs text-red-600">{errors.currentMileage.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label>Mileage interval</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[5000, 10000].map((interval) => (
                      <button
                        key={interval}
                        type="button"
                        onClick={() => setValue('mileageInterval', interval as 5000 | 10000, { shouldValidate: true })}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          values.mileageInterval === interval
                            ? 'border-mazda-red bg-red-50 text-mazda-red'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {interval.toLocaleString()} km
                      </button>
                    ))}
                  </div>
                  {errors.mileageInterval ? <p className="text-xs text-red-600">{errors.mileageInterval.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label>Car color</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setValue('color', color, { shouldValidate: true })}
                        className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                          values.color === color ? 'border-mazda-red bg-red-50 text-mazda-red' : 'border-slate-200 text-slate-600'
                        }`}
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
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <p>
                  <span className="font-semibold">Model:</span> {values.model}
                </p>
                <p>
                  <span className="font-semibold">Year:</span> {values.year}
                </p>
                <p>
                  <span className="font-semibold">Fuel:</span> {values.fuelType}
                </p>
                <p>
                  <span className="font-semibold">Engine:</span> {values.engineSize}
                </p>
                <p>
                  <span className="font-semibold">Registration:</span> {values.registration?.toUpperCase()}
                </p>
                <p>
                  <span className="font-semibold">Mileage:</span> {Number(values.currentMileage || 0).toLocaleString()} km
                </p>
                <p>
                  <span className="font-semibold">Interval:</span> {Number(values.mileageInterval || 0).toLocaleString()} km
                </p>
                <p>
                  <span className="font-semibold">Color:</span> {values.color}
                </p>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={previousStep} disabled={step === 1 || loading}>
                Back
              </Button>

              {step < 3 ? (
                <Button type="button" onClick={nextStep}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Confirm and Save'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
