"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { type Locale, enUS } from 'date-fns/locale';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import * as React from 'react';
import { useImperativeHandle, useRef } from 'react';

// Importer le Calendar de shadcn/ui
import { Calendar } from "@/components/ui/calendar"; 
// DayPickerProps est toujours utile si Calendar expose une API similaire ou pour des types internes.
// Si Calendar de shadcn/ui n'expose pas directement DayPickerProps pour son API, on ajustera.
// import { type DayPickerProps } from 'react-day-picker'; // Retiré car non utilisé directement

// ---------- utils start ----------
/**
 * regular expression to check for valid hour format (01-23)
 */
function isValidHour(value: string) {
  return /^(0[0-9]|1[0-9]|2[0-3])$/.test(value);
}

/**
 * regular expression to check for valid 12 hour format (01-12)
 */
function isValid12Hour(value: string) {
  return /^(0[1-9]|1[0-2])$/.test(value);
}

/**
 * regular expression to check for valid minute format (00-59)
 */
function isValidMinuteOrSecond(value: string) {
  return /^[0-5][0-9]$/.test(value);
}

type GetValidNumberConfig = { max: number; min?: number; loop?: boolean };

function getValidNumber(value: string, { max, min = 0, loop = false }: GetValidNumberConfig) {
  let numericValue = parseInt(value, 10);

  if (!Number.isNaN(numericValue)) {
    if (!loop) {
      if (numericValue > max) numericValue = max;
      if (numericValue < min) numericValue = min;
    } else {
      if (numericValue > max) numericValue = min;
      if (numericValue < min) numericValue = max;
    }
    return numericValue.toString().padStart(2, '0');
  }

  return '00';
}

function getValidHour(value: string) {
  if (isValidHour(value)) return value;
  return getValidNumber(value, { max: 23 });
}

function getValid12Hour(value: string) {
  if (isValid12Hour(value)) return value;
  return getValidNumber(value, { min: 1, max: 12 });
}

function getValidMinuteOrSecond(value: string) {
  if (isValidMinuteOrSecond(value)) return value;
  return getValidNumber(value, { max: 59 });
}

type GetValidArrowNumberConfig = {
  min: number;
  max: number;
  step: number;
};

function getValidArrowNumber(value: string, { min, max, step }: GetValidArrowNumberConfig) {
  let numericValue = parseInt(value, 10);
  if (!Number.isNaN(numericValue)) {
    numericValue += step;
    return getValidNumber(String(numericValue), { min, max, loop: true });
  }
  return '00';
}

function getValidArrowHour(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 23, step });
}

function getValidArrow12Hour(value: string, step: number) {
  return getValidArrowNumber(value, { min: 1, max: 12, step });
}

function getValidArrowMinuteOrSecond(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 59, step });
}

function setMinutes(date: Date, value: string) {
  const minutes = getValidMinuteOrSecond(value);
  date.setMinutes(parseInt(minutes, 10));
  return date;
}

function setSeconds(date: Date, value: string) {
  const seconds = getValidMinuteOrSecond(value);
  date.setSeconds(parseInt(seconds, 10));
  return date;
}

function setHours(date: Date, value: string) {
  const hours = getValidHour(value);
  date.setHours(parseInt(hours, 10));
  return date;
}

function set12Hours(date: Date, value: string, period: Period) {
  const hours = parseInt(getValid12Hour(value), 10);
  const convertedHours = convert12HourTo24Hour(hours, period);
  date.setHours(convertedHours);
  return date;
}

export type TimePickerType = 'minutes' | 'seconds' | 'hours' | '12hours';
type Period = 'AM' | 'PM';

function setDateByType(date: Date, value: string, type: TimePickerType, period?: Period) {
  switch (type) {
    case 'minutes':
      return setMinutes(date, value);
    case 'seconds':
      return setSeconds(date, value);
    case 'hours':
      return setHours(date, value);
    case '12hours': {
      if (!period) return date;
      return set12Hours(date, value, period);
    }
    default:
      return date;
  }
}

function getDateByType(date: Date | null, type: TimePickerType) {
  if (!date) return '00';
  switch (type) {
    case 'minutes':
      return getValidMinuteOrSecond(String(date.getMinutes()));
    case 'seconds':
      return getValidMinuteOrSecond(String(date.getSeconds()));
    case 'hours':
      return getValidHour(String(date.getHours()));
    case '12hours':
      return getValid12Hour(String(display12HourValue(date.getHours())));
    default:
      return '00';
  }
}

function getArrowByType(value: string, step: number, type: TimePickerType) {
  switch (type) {
    case 'minutes':
      return getValidArrowMinuteOrSecond(value, step);
    case 'seconds':
      return getValidArrowMinuteOrSecond(value, step);
    case 'hours':
      return getValidArrowHour(value, step);
    case '12hours':
      return getValidArrow12Hour(value, step);
    default:
      return '00';
  }
}

function convert12HourTo24Hour(hour: number, period: Period) {
  if (period === 'PM') {
    if (hour <= 11) {
      return hour + 12;
    }
    return hour;
  }

  if (period === 'AM') {
    if (hour === 12) return 0;
    return hour;
  }
  return hour;
}

function display12HourValue(hours: number) {
  if (hours === 0 || hours === 12) return '12';
  // Correction de la logique originale qui était un peu étrange pour certaines heures.
  const h = hours % 12;
  return h.toString().padStart(2, '0'); // Assure deux chiffres type '03' ou '11'
}

// ---------- utils end ----------

interface TimePickerInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  onUpButton?: () => void;
  onDownButton?: () => void;
  picker: TimePickerType;
}

const TimePickerInput = React.forwardRef<HTMLInputElement, TimePickerInputProps>(
  ({ className, type = 'text', value, onChange, onUpButton, onDownButton, picker, ...props }, ref) => {
    const _ref = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => _ref.current as HTMLInputElement, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        onUpButton?.();
        e.preventDefault();
      }
      if (e.key === 'ArrowDown') {
        onDownButton?.();
        e.preventDefault();
      }
    };

    return (
      <Input
        ref={_ref}
        type={type}
        className={cn(
          'w-[48px] text-center font-mono text-base tabular-nums caret-transparent focus:bg-accent focus:text-accent-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          className,
        )}
        value={value}
        onChange={(e) => {
          onChange?.(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        data-testid={`time-input-${picker}`}
        {...props}
      />
    );
  },
);
TimePickerInput.displayName = 'TimePickerInput';

interface TimePickerProps {
  date?: Date;
  onChange?: (date?: Date) => void;
  hourCycle?: 12 | 24;
  granularity?: 'day' | 'hour' | 'minute' | 'second';
}

function TimePicker({ date, onChange, hourCycle = 24, granularity = 'second' }: TimePickerProps) {
  // État pour le cycle de 12 heures AM/PM
  const [period, setPeriod] = React.useState<Period>(
    date && date.getHours() >= 12 ? 'PM' : 'AM'
  );

  // Refs pour les champs d'heures, minutes et secondes
  const hoursRef = useRef<HTMLInputElement | null>(null);
  const minutesRef = useRef<HTMLInputElement | null>(null);
  const secondsRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (date) {
      setPeriod(date.getHours() >= 12 ? 'PM' : 'AM');
    }
  }, [date]);

  const handleDateChange = (newDatePart: Date) => {
    if (onChange) {
      onChange(newDatePart);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 relative">
      {date && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute -right-8 top-0 h-6 w-6 rounded-full p-0 hover:bg-muted"
          onClick={() => onChange?.(undefined)}
          type="button"
        >
          <X className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Effacer l&apos;heure</span>
        </Button>
      )}
      
      <div className="flex h-10 items-center">
        <TimePickerInput
          picker={hourCycle === 24 ? 'hours' : '12hours'}
          value={getDateByType(date ?? null, hourCycle === 24 ? 'hours' : '12hours')}
          ref={hoursRef}
          onChange={(value) => {
            const newDate = date ? new Date(date.getTime()) : new Date(new Date().setHours(0,0,0,0));
            handleDateChange(setDateByType(newDate, value, hourCycle === 24 ? 'hours' : '12hours', period));
          }}
          onUpButton={() => {
            const newDate = date ? new Date(date.getTime()) : new Date(new Date().setHours(0,0,0,0));
            handleDateChange(
              setDateByType(
                newDate,
                getArrowByType(getDateByType(date ?? null, hourCycle === 24 ? 'hours' : '12hours'), 1, hourCycle === 24 ? 'hours' : '12hours'),
                hourCycle === 24 ? 'hours' : '12hours',
                period,
              ),
            );
          }}
          onDownButton={() => {
            const newDate = date ? new Date(date.getTime()) : new Date(new Date().setHours(0,0,0,0));
            handleDateChange(
              setDateByType(
                newDate,
                getArrowByType(getDateByType(date ?? null, hourCycle === 24 ? 'hours' : '12hours'), -1, hourCycle === 24 ? 'hours' : '12hours'),
                hourCycle === 24 ? 'hours' : '12hours',
                period,
              ),
            );
          }}
          onLeftFocus={() => {
            secondsRef.current?.focus();
          }}
          onRightFocus={() => {
            minutesRef.current?.focus();
          }}
        />
      </div>
      {(granularity === 'minute' || granularity === 'second') && (
        <>
          <div className="flex h-10 items-center">
            <span className="text-xl font-bold">:</span>
          </div>
          <div className="flex h-10 items-center">
            <TimePickerInput
              picker="minutes"
              value={getDateByType(date ?? null, 'minutes')}
              ref={minutesRef}
              onChange={(value) => {
                const newDate = date ? new Date(date.getTime()) : new Date(new Date().setHours(0,0,0,0));
                handleDateChange(setMinutes(newDate, value));
              }}
              onUpButton={() => {
                 const newDate = date ? new Date(date.getTime()) : new Date(new Date().setHours(0,0,0,0));
                 handleDateChange(setMinutes(newDate,getArrowByType(getDateByType(date ?? null, 'minutes'), 1, 'minutes')));
              }}
              onDownButton={() => {
                const newDate = date ? new Date(date.getTime()) : new Date(new Date().setHours(0,0,0,0));
                handleDateChange(setMinutes(newDate,getArrowByType(getDateByType(date ?? null, 'minutes'), -1, 'minutes')));
              }}
            />
          </div>
        </>
      )}
      {granularity === 'second' && (
        <>
          <div className="flex h-10 items-center">
            <span className="text-xl font-bold">:</span>
          </div>
          <div className="flex h-10 items-center">
            <TimePickerInput
              picker="seconds"
              value={getDateByType(date ?? null, 'seconds')}
              ref={secondsRef}
              onChange={(value) => {
                const newDate = date ? new Date(date.getTime()) : new Date(new Date().setHours(0,0,0,0));
                handleDateChange(setSeconds(newDate, value));
              }}
              onUpButton={() => {
                 const newDate = date ? new Date(date.getTime()) : new Date(new Date().setHours(0,0,0,0));
                handleDateChange(setSeconds(newDate,getArrowByType(getDateByType(date ?? null, 'seconds'), 1, 'seconds')));
              }}
              onDownButton={() => {
                const newDate = date ? new Date(date.getTime()) : new Date(new Date().setHours(0,0,0,0));
                handleDateChange(setSeconds(newDate,getArrowByType(getDateByType(date ?? null, 'seconds'), -1, 'seconds')));
              }}
            />
          </div>
        </>
      )}
      {hourCycle === 12 && (
        <div className="flex h-10 items-center ml-2">
          <Button
            variant="outline"
            className="h-8 px-2 text-xs"
            onClick={() => {
              const newPeriod = period === 'AM' ? 'PM' : 'AM';
              setPeriod(newPeriod);
              const currentDateVal = date ? new Date(date.getTime()) : new Date(new Date().setHours(0,0,0,0));
              const currentHour = currentDateVal.getHours();
              let newHour = currentHour;

              if (newPeriod === 'PM' && currentHour < 12) {
                newHour = currentHour + 12;
              } else if (newPeriod === 'AM' && currentHour >= 12) {
                newHour = currentHour - 12;
              }
              currentDateVal.setHours(newHour);
              handleDateChange(currentDateVal);
            }}
          >
            {period}
          </Button>
        </div>
      )}
    </div>
  );
}
TimePicker.displayName = 'TimePicker';

// Main DateTimePicker component
export interface DateTimePickerProps {
  value?: Date;
  defaultPopupValue?: Date;
  onChange?: (date?: Date) => void;
  hourCycle?: 12 | 24;
  displayFormat?: {
    hour24?: string;
    hour12?: string;
  };
  granularity?: 'day' | 'hour' | 'minute' | 'second';
  placeholder?: string;
  locale?: Locale;
  disabled?: boolean;
  className?: string; 
}

export interface DateTimePickerRef {
  value?: Date;
}

const DateTimePicker = React.forwardRef<Partial<DateTimePickerRef>, DateTimePickerProps>(
  (
    {
      locale = enUS,
      defaultPopupValue,
      value,
      onChange,
      hourCycle = 24,
      disabled = false,
      displayFormat,
      granularity = 'second',
      placeholder = 'Pick a date',
      className
    },
    ref,
  ) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [displayDate, setDisplayDate] = React.useState<Date | undefined>(value ?? undefined);

    React.useEffect(() => {
      setDisplayDate(value);
    }, [value, defaultPopupValue]);

    const onSelectCalendar = (selectedDate?: Date) => {
      if (!selectedDate) {
        onChange?.(undefined);
        setDisplayDate(undefined);
        return;
      }
      const baseTime = displayDate ?? defaultPopupValue ?? new Date(new Date().setHours(0,0,0,0));
      
      selectedDate.setHours(
        baseTime.getHours(),
        baseTime.getMinutes(),
        baseTime.getSeconds()
      );
      onChange?.(selectedDate);
      setDisplayDate(selectedDate);
    };
    
    const handleClearDate = () => {
      onChange?.(undefined);
      setDisplayDate(undefined);
    };
    
    useImperativeHandle(
      ref,
      () => ({
        ...(buttonRef.current || {}),
        value: displayDate,
      }),
      [displayDate, buttonRef],
    );

    const initHourFormat = {
      hour24:
        displayFormat?.hour24 ??
        (granularity === 'day' ? 'PPP' : `PPP HH:mm${granularity === 'second' ? ':ss' : ''}`),
      hour12:
        displayFormat?.hour12 ??
        (granularity === 'day' ? 'PP p' : `PP hh:mm${granularity === 'second' ? ':ss' : ''} b`),
    };
    
    let loc: Locale = enUS;
    if (locale?.options && locale?.localize && locale?.formatLong) {
      loc = locale;
    }

    return (
      <Popover>
        <div className="relative w-full">
          <PopoverTrigger asChild disabled={disabled}>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !displayDate && 'text-muted-foreground',
                className,
              )}
              ref={buttonRef}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {displayDate ? (
                format(
                  displayDate,
                  hourCycle === 24 ? initHourFormat.hour24 : initHourFormat.hour12,
                  {
                    locale: loc,
                  },
                )
              ) : (
                <span>{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>
          
          {displayDate && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full aspect-square rounded-r-md p-0 hover:bg-muted"
              onClick={handleClearDate}
              type="button"
            >
              <X className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Effacer la date et l&apos;heure</span>
            </Button>
          )}
        </div>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={displayDate}
            onSelect={onSelectCalendar}
            initialFocus
            locale={loc}
            defaultMonth={displayDate ?? defaultPopupValue ?? new Date()}
            numberOfMonths={1}
            className="rounded-md border"
          />
          {granularity !== 'day' && (
            <div className="border-border border-t p-3">
              <TimePicker
                onChange={(newTimeDate) => {
                  if (newTimeDate) {
                     onSelectCalendar(newTimeDate);
                  }
                }}
                date={displayDate ?? defaultPopupValue ?? new Date(new Date().setHours(0,0,0,0))}
                hourCycle={hourCycle}
                granularity={granularity}
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  },
);

DateTimePicker.displayName = 'DateTimePicker';

export { DateTimePicker, TimePickerInput, TimePicker };


