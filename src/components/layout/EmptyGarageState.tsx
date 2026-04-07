import { Car, Plus } from 'lucide-react'

interface EmptyGarageStateProps {
  onClick: () => void
}

export function EmptyGarageState({ onClick }: EmptyGarageStateProps) {
  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center px-6 py-10 text-center">
      <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-gray-50 bg-white">
        <div className="absolute h-28 w-28 rounded-full bg-red-50 opacity-50 animate-pulse" aria-hidden="true" />
        <Car className="relative h-16 w-16 text-[#A31526]" strokeWidth={2.2} aria-hidden="true" />
      </div>

      <h2 className="mt-8 text-2xl font-bold text-gray-900">
        Your garage is looking a little empty!
      </h2>

      <p className="mt-3 max-w-[320px] text-[15px] leading-relaxed text-gray-500">
        Ready to get started? Tap the button below to add your first Mazda and begin tracking your services, warranties, and more.
      </p>

      <button
        type="button"
        onClick={onClick}
        className="mt-8 inline-flex w-full max-w-[280px] items-center justify-center gap-2 rounded-2xl bg-[#A31526] py-4 text-white shadow-lg shadow-[#A31526]/30"
      >
        <Plus className="h-5 w-5" />
        <span className="text-[15px] font-semibold">Add My First Mazda</span>
      </button>
    </div>
  )
}
