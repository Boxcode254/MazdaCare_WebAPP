import * as React from 'react'
import { Switch as SwitchPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-[#D9D2D4] shadow-[inset_0_1px_2px_rgba(21,18,20,0.12)] transition-all duration-200 data-[state=checked]:bg-[#8F1326] data-[state=checked]:shadow-[0_0_0_4px_rgba(143,19,38,0.14),0_10px_24px_rgba(143,19,38,0.24)] data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }