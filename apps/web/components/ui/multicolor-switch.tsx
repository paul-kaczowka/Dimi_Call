"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

interface MultiColorSwitchProps extends React.ComponentProps<typeof SwitchPrimitive.Root> {
  label?: string;
}

const MultiColorSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  MultiColorSwitchProps
>(({ className, label, ...props }, ref) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <SwitchPrimitive.Root
        className={cn(
          "peer relative inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500 data-[state=checked]:via-purple-500 data-[state=checked]:to-indigo-500",
          "data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
          className
        )}
        {...props}
        ref={ref}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "pointer-events-none block size-4 rounded-full bg-background transition-transform",
            "data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=checked]:bg-white",
            "data-[state=unchecked]:translate-x-0 dark:data-[state=unchecked]:bg-foreground"
          )}
        />
      </SwitchPrimitive.Root>
      {label && (
        <span className="text-xs">{label}</span>
      )}
    </div>
  )
})
MultiColorSwitch.displayName = "MultiColorSwitch"

export { MultiColorSwitch } 