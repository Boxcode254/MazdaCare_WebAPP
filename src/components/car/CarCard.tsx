import { CarFront, Fuel, Gauge, Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Vehicle } from '@/types'

interface CarCardProps {
  vehicle: Vehicle
  onEditMileage?: (vehicle: Vehicle) => void
}

export function CarCard({ vehicle, onEditMileage }: CarCardProps) {
  const navigate = useNavigate()
  const nextServiceMileage = vehicle.nextServiceMileage ?? vehicle.currentMileage + vehicle.mileageInterval
  const progress = Math.min((vehicle.currentMileage / nextServiceMileage) * 100, 100)

  return (
    <Card className="cursor-pointer border-white/70 bg-white/95 shadow-sm" onClick={() => navigate(`/service/${vehicle.id}`)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="inline-flex items-center gap-2">
            <CarFront className="h-4 w-4 text-mazda-red" />
            {vehicle.model} {vehicle.year}
          </span>
          <Badge className={vehicle.fuelType === 'petrol' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}>
            <Fuel className="mr-1 h-3 w-3" />
            {vehicle.fuelType}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <p className="text-sm text-slate-600">{vehicle.registration}</p>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="inline-flex items-center gap-1 text-sm font-medium text-slate-800">
            <Gauge className="h-4 w-4" />
            {vehicle.currentMileage.toLocaleString()} km
          </p>
          <p className="mt-1 text-xs text-slate-500">Next service target: {nextServiceMileage.toLocaleString()} km</p>
          <Progress value={progress} className="mt-2 h-2" />
        </div>
      </CardContent>

      <CardFooter className="justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-10"
          onClick={(event) => {
            event.stopPropagation()
            onEditMileage?.(vehicle)
          }}
        >
          <Pencil className="h-4 w-4" />
          Update mileage
        </Button>
      </CardFooter>
    </Card>
  )
}
