import { useNavigate } from 'react-router-dom'

// ─── Garage + car illustration ──────────────────────────────────────────────
function GarageIllustration() {
  return (
    <svg
      width="148"
      height="116"
      viewBox="0 0 148 116"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Roof */}
      <path
        d="M8 58 L74 12 L140 58"
        stroke="#D4C4C0"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Walls */}
      <rect x="16" y="58" width="116" height="54" rx="2" stroke="#D4C4C0" strokeWidth="2.5" />
      {/* Garage door frame */}
      <rect x="28" y="68" width="92" height="44" rx="2" stroke="#D4C4C0" strokeWidth="2" />
      {/* Door horizontal panel lines */}
      <line x1="28" y1="82" x2="120" y2="82" stroke="#D4C4C0" strokeWidth="1.5" />
      <line x1="28" y1="96" x2="120" y2="96" stroke="#D4C4C0" strokeWidth="1.5" />
      {/* Door center handle */}
      <circle cx="74" cy="85" r="3.5" stroke="#D4C4C0" strokeWidth="1.5" />
      {/* Car silhouette parked at door */}
      <path
        d="M33 68C35 61 41 57 52 55L60 52C63 45 71 42 79 42C87 42 95 45 98 52L106 55C111 57 113 60 114 63L116 68"
        stroke="#A31526"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.38"
      />
      <circle cx="49" cy="67" r="5.5" stroke="#A31526" strokeWidth="2.2" opacity="0.38" />
      <circle cx="107" cy="67" r="5.5" stroke="#A31526" strokeWidth="2.2" opacity="0.38" />
    </svg>
  )
}

// ─── GarageEmptyState — used when vehicles.length === 0 ─────────────────────
interface GarageEmptyStateProps {
  onAddVehicle: () => void
}

export function GarageEmptyState({ onAddVehicle }: GarageEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <GarageIllustration />
      <h2
        className="mt-6 text-[26px] font-light italic leading-tight text-mz-black"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}
      >
        Your garage is looking a little empty!
      </h2>
      <p
        className="mt-3 max-w-[272px] text-[13px] leading-relaxed text-mz-gray-500"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        Tap the button below to add your first vehicle and start tracking your services.
      </p>
      <button
        type="button"
        className="mt-8 animate-bounce rounded-2xl bg-mz-red px-7 py-[14px] text-[14px] font-semibold text-white shadow-button"
        style={{ fontFamily: 'Outfit, sans-serif' }}
        onClick={onAddVehicle}
      >
        Add Vehicle
      </button>
    </div>
  )
}

// ─── ServiceEmptyState — used when logs.length === 0 ────────────────────────
interface ServiceEmptyStateProps {
  vehicleId: string
}

export function ServiceEmptyState({ vehicleId }: ServiceEmptyStateProps) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <GarageIllustration />
      <h2
        className="mt-6 text-[26px] font-light italic leading-tight text-mz-black"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}
      >
        No services recorded yet
      </h2>
      <p
        className="mt-3 max-w-[272px] text-[13px] leading-relaxed text-mz-gray-500"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        Tap the button below to log your first service and start tracking your car's health.
      </p>
      <button
        type="button"
        className="mt-8 animate-bounce rounded-2xl bg-mz-red px-7 py-[14px] text-[14px] font-semibold text-white shadow-button"
        style={{ fontFamily: 'Outfit, sans-serif' }}
        onClick={() => navigate(`/log-service/${vehicleId}`)}
      >
        Log First Service
      </button>
    </div>
  )
}
