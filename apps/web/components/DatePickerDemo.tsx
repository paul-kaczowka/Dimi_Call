"use client"

import React, { useState } from "react"
import ModernDatePicker from "@/components/ui/ModernDatePicker"
import SimpleDatePicker from "@/components/ui/SimpleDatePicker"
import MinimalDatePicker from "@/components/ui/MinimalDatePicker"

export function DatePickerDemo() {
  const [date1, setDate1] = useState<Date>()
  const [date2, setDate2] = useState<Date>()
  const [date3, setDate3] = useState<Date>()

  return (
    <div className="flex flex-col space-y-10 p-6 max-w-md mx-auto">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Date Picker Moderne</h3>
        <ModernDatePicker 
          date={date1} 
          onDateChange={setDate1} 
          placeholder="Sélectionner une date" 
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Date Picker Simple</h3>
        <SimpleDatePicker 
          date={date2} 
          onDateChange={setDate2} 
          placeholder="Choisir une date" 
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Date Picker Minimaliste</h3>
        <MinimalDatePicker 
          date={date3} 
          onDateChange={setDate3}
          placeholder="Date"
        />
      </div>
    </div>
  )
}

export default DatePickerDemo 