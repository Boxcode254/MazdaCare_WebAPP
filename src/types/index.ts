export interface Vehicle {
  id: string
  userId: string
  make: string
  model: string
  year: number
  vin?: string
  fuelType: 'petrol' | 'diesel'
  engineSize: string
  registration: string
  currentMileage: number
  mileageInterval: 5000 | 7000 | 9000 | 10000
  color?: string
  nextServiceMileage?: number
  imageUrl?: string
}

export interface ServiceLog {
  id: string
  vehicleId: string
  serviceDate: string
  serviceType: 'minor' | 'major' | 'oil_change' | 'tyre_rotation' | 'brake_service' | 'other'
  mileageAtService: number
  nextServiceMileage: number
  oilBrand?: string
  oilGrade?: string
  oilQuantityLitres?: number
  garageId?: string
  garageName?: string
  serviceCost?: number
  notes?: string
  rating?: number
}

export interface Garage {
  id: string
  googlePlaceId?: string
  name: string
  type: 'garage' | 'petrol_station' | 'dealer' | 'mobile_mechanic'
  address: string
  lat: number
  lng: number
  phone?: string
  avgRating?: number
}

export interface ServiceAlert {
  id: string
  vehicleId: string
  alertType: 'mileage' | 'date' | 'both'
  dueMileage?: number
  dueDate?: string
  serviceType: string
  isDismissed: boolean
}
