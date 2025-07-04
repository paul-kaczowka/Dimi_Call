"use client";

import React from "react";
import { MinimalDatePicker } from "./ui/MinimalDatePicker";

interface SimpleDateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

const SimpleDateTimePicker: React.FC<SimpleDateTimePickerProps> = ({ date, setDate }) => {
  return (
    <MinimalDatePicker
      date={date}
      onDateChange={setDate}
      placeholder="Sélectionner une date"
    />
  );
};

export default SimpleDateTimePicker; 