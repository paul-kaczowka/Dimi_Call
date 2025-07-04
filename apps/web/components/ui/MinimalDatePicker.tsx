"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface MinimalDatePickerProps {
  date?: Date
  onDateChange?: (date?: Date) => void
  className?: string
  disabled?: boolean
  placeholder?: string
  onDateTimeSelected?: (date: Date) => void
  initialDateTime?: Date | null
  buttonLabel?: string
  buttonVariant?: string
  buttonClassName?: string
  children?: React.ReactNode
}

export function MinimalDatePicker({
  date,
  onDateChange,
  className,
  disabled = false,
  placeholder = "Choisir une date",
  onDateTimeSelected,
  initialDateTime,
  children,
  buttonClassName,
}: MinimalDatePickerProps) {
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    initialDateTime ? new Date(initialDateTime) : date
  );

  React.useEffect(() => {
    if (initialDateTime) {
      setInternalDate(new Date(initialDateTime));
    } else if (date) {
      setInternalDate(date);
    }
  }, [date, initialDateTime]);

  const handleDateChange = React.useCallback((newDate?: Date) => {
    setInternalDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
    if (onDateTimeSelected && newDate) {
      onDateTimeSelected(newDate);
    }
  }, [onDateChange, onDateTimeSelected]);

  return (
    <div className="relative">
      <Popover>
        <PopoverTrigger asChild>
          {children ? (
            children
          ) : (
            <button
              className={cn(
                "group flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                "hover:border-primary/80",
                className,
                buttonClassName
              )}
              disabled={disabled}
            >
              <div className="flex w-full items-center gap-2">
                <CalendarIcon 
                  className="h-4 w-4 text-muted-foreground group-hover:text-primary/80" 
                />
                <span className={!internalDate ? "text-muted-foreground" : ""}>
                  {internalDate ? format(internalDate, "d MMMM yyyy", { locale: fr }) : placeholder}
                </span>
              </div>
              
              {internalDate && (
                <div 
                  className="relative ml-1 h-7 w-7 rounded-full bg-muted p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDateChange(undefined)
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </div>
                </div>
              )}
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent className="p-0 border-0" align="start">
          <div className="rounded-md border shadow-md bg-popover overflow-hidden">
            <Calendar
              mode="single"
              selected={internalDate}
              onSelect={handleDateChange}
              locale={fr}
              initialFocus
              classNames={{
                day_today: "bg-muted text-accent-foreground",
                day_selected: "bg-primary !text-primary-foreground hover:bg-primary",
                day: cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground",
                  "data-[today]:bg-accent/50 data-[today]:text-accent-foreground"
                ),
                nav_button: cn(
                  "h-7 w-7 bg-transparent p-0 hover:bg-accent hover:text-accent-foreground"
                ),
                caption: "flex justify-center pt-1 relative items-center mb-2",
                caption_label: "text-sm font-medium",
                months: "flex flex-col space-y-3",
                table: "w-full border-collapse",
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default MinimalDatePicker 