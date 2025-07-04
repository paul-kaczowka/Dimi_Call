"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface SimpleDatePickerProps {
  date?: Date
  onDateChange?: (date?: Date) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function SimpleDatePicker({
  date,
  onDateChange,
  disabled = false,
  placeholder = "Sélectionner une date",
  className,
}: SimpleDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full flex items-center justify-start text-left font-normal transition-all duration-200 ease-in-out",
            "border border-input hover:border-primary",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            isOpen && "border-primary ring-2 ring-ring ring-offset-2",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          onClick={() => setIsOpen(true)}
        >
          <div className={cn(
            "flex items-center gap-2 w-full",
            isOpen && "text-primary"
          )}>
            <CalendarIcon className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200", 
              isOpen && "text-primary rotate-180"
            )} />
            
            <span className="truncate">
              {date ? (
                format(date, "d MMMM yyyy", { locale: fr })
              ) : (
                placeholder
              )}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start"
        sideOffset={5}
      >
        <div className="p-1 bg-background rounded-md shadow-md overflow-hidden">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              onDateChange?.(selectedDate)
              setIsOpen(false)
            }}
            initialFocus
            locale={fr}
            className="rounded-md border"
            classNames={{
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground transition-colors duration-200",
              day_today: "bg-accent text-accent-foreground transition-colors duration-200",
              day: "transition-colors duration-150 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default SimpleDatePicker 