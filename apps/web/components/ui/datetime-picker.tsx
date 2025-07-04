import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { type Locale, fr } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Clock } from 'lucide-react';
import * as React from 'react';
import { useImperativeHandle, useRef } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';

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

type TimePickerType = 'minutes' | 'seconds' | 'hours' | '12hours';
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

/**
 * handles value change of 12-hour input
 * 12:00 PM is 12:00
 * 12:00 AM is 00:00
 */
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

/**
 * time is stored in the 24-hour form,
 * but needs to be displayed to the user
 * in its 12-hour representation
 */
function display12HourValue(hours: number) {
  if (hours === 0 || hours === 12) return '12';
  if (hours >= 22) return `${hours - 12}`; // Correction: hours % 12 can be 10 or 11
  if (hours % 12 > 9) return `${hours % 12}`; // Correction: hours % 12
  return `0${hours % 12}`; // Correction: hours % 12
}

// ---------- utils end ----------

interface PeriodSelectorProps {
  period: Period;
  setPeriod?: (m: Period) => void;
  date?: Date | null;
  onDateChange?: (date: Date | undefined) => void;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
}

const TimePeriodSelect = React.forwardRef<HTMLButtonElement, PeriodSelectorProps>(
  ({ period, setPeriod, date, onDateChange, onLeftFocus, onRightFocus }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'ArrowRight') onRightFocus?.();
      if (e.key === 'ArrowLeft') onLeftFocus?.();
    };

    const handleValueChange = (value: Period) => {
      setPeriod?.(value);

      /**
       * trigger an update whenever the user switches between AM and PM;
       * otherwise user must manually change the hour each time
       */
      if (date) {
        const tempDate = new Date(date);
        const hours = display12HourValue(date.getHours()); // Pas besoin de .toString() ici
        onDateChange?.(
          setDateByType(tempDate, hours, '12hours', period === 'AM' ? 'PM' : 'AM'), // period est inversé pour la nouvelle valeur
        );
      }
    };

    return (
      <div className="flex h-10 items-center">
        <Select defaultValue={period} onValueChange={(value: Period) => handleValueChange(value)}>
          <SelectTrigger
            ref={ref}
            className="focus:bg-accent focus:text-accent-foreground w-[65px]"
            onKeyDown={handleKeyDown}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  },
);

TimePeriodSelect.displayName = 'TimePeriodSelect';

interface TimePickerInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  picker: TimePickerType;
  date?: Date | null;
  onDateChange?: (date: Date | undefined) => void;
  period?: Period;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
}

const TimePickerInput = React.forwardRef<HTMLInputElement, TimePickerInputProps>(
  (
    {
      className,
      type = 'tel',
      value,
      id,
      name,
      date = new Date(new Date().setHours(0, 0, 0, 0)), // default date
      onDateChange,
      onChange,
      onKeyDown,
      picker,
      period,
      onLeftFocus,
      onRightFocus,
      ...props
    },
    ref,
  ) => {
    const [flag, setFlag] = React.useState<boolean>(false);
    const [prevIntKey, setPrevIntKey] = React.useState<string>('0');


    React.useEffect(() => {
      if (flag) {
        const timer = setTimeout(() => {
          setFlag(false);
        }, 2000);

        return () => clearTimeout(timer);
      }
    }, [flag]);

    const calculatedValue = React.useMemo(() => {
      return getDateByType(date, picker);
    }, [date, picker]);
    
    const calculateNewValue = (key: string) => {
      if (picker === '12hours') {
        if (flag && calculatedValue.slice(1, 2) === '1' && prevIntKey === '0') return `0${key}`
      }
      return !flag ? `0${key}` : calculatedValue.slice(1, 2) + key;
    };


    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Tab') return;
      e.preventDefault();
      if (e.key === 'ArrowRight') onRightFocus?.();
      if (e.key === 'ArrowLeft') onLeftFocus?.();
      if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
        const step = e.key === 'ArrowUp' ? 1 : -1;
        const newValue = getArrowByType(calculatedValue, step, picker);
        if (flag) setFlag(false);
        const tempDate = date ? new Date(date) : new Date();
        onDateChange?.(setDateByType(tempDate, newValue, picker, period));
      }
      if (e.key >= '0' && e.key <= '9') {
        if (picker === '12hours') setPrevIntKey(e.key);

        const newValue = calculateNewValue(e.key);
        if (flag) onRightFocus?.();
        setFlag((prev) => !prev);
        const tempDate = date ? new Date(date) : new Date(); // Crée une nouvelle instance
        onDateChange?.(setDateByType(tempDate, newValue, picker, period));
      }
    };

    return (
      <Input
        ref={ref}
        id={id || picker}
        name={name || picker}
        className={cn(
          'focus:bg-accent focus:text-accent-foreground w-[48px] text-center font-mono text-base tabular-nums caret-transparent [&::-webkit-inner-spin-button]:appearance-none',
          className,
        )}
        value={value || calculatedValue}
        onChange={(e) => {
          e.preventDefault();
          onChange?.(e);
        }}
        type={type}
        inputMode="decimal" // Changed from "numeric" to "decimal" which is more appropriate for tel
        onKeyDown={(e) => {
          onKeyDown?.(e);
          handleKeyDown(e);
        }}
        {...props}
      />
    );
  },
);

TimePickerInput.displayName = 'TimePickerInput';

interface TimePickerProps {
  date?: Date | null;
  onChange?: (date: Date | undefined) => void;
  hourCycle?: 12 | 24;
  granularity?: Granularity;
}

interface TimePickerRef {
  minuteRef: HTMLInputElement | null;
  hourRef: HTMLInputElement | null;
  secondRef: HTMLInputElement | null;
  periodRef: HTMLButtonElement | null; // Ajout de periodRef
}

export const TimePicker = React.forwardRef<TimePickerRef, TimePickerProps>(
  ({ date, onChange, hourCycle = 24, granularity = 'second' }, ref) => {
    const minuteRef = React.useRef<HTMLInputElement>(null);
    const hourRef = React.useRef<HTMLInputElement>(null);
    const secondRef = React.useRef<HTMLInputElement>(null);
    const periodRef = React.useRef<HTMLButtonElement>(null);
    const [period, setPeriod] = React.useState<Period>(date && date.getHours() >= 12 ? 'PM' : 'AM');

    useImperativeHandle(
      ref,
      () => ({
        minuteRef: minuteRef.current,
        hourRef: hourRef.current,
        secondRef: secondRef.current,
        periodRef: periodRef.current, 
      }),
      [minuteRef, hourRef, secondRef, periodRef], // periodRef ajouté
    );
    
    const handleDateChange = (newDate: Date | undefined) => {
        if (newDate && hourCycle === 12) {
            const currentHours = newDate.getHours();
            if (currentHours >= 12 && period === 'AM') {
                setPeriod('PM');
            } else if (currentHours < 12 && period === 'PM') {
                setPeriod('AM');
            }
        }
        onChange?.(newDate);
    };
    
    return (
      <div className="flex items-center justify-center gap-2">
        <label htmlFor="datetime-picker-hour-input" className="cursor-pointer">
          <Clock className="mr-2 h-4 w-4" />
        </label>
        <TimePickerInput
          picker={hourCycle === 24 ? 'hours' : '12hours'}
          date={date}
          id="datetime-picker-hour-input"
          onDateChange={handleDateChange}
          ref={hourRef}
          period={period}
          onRightFocus={() => granularity === 'minute' || granularity === 'second' ? minuteRef?.current?.focus() : (hourCycle === 12 ? periodRef?.current?.focus() : undefined)}
        />
        {(granularity === 'minute' || granularity === 'second') && (
          <>
            :
            <TimePickerInput
              picker="minutes"
              date={date}
              onDateChange={handleDateChange}
              ref={minuteRef}
              onLeftFocus={() => hourRef?.current?.focus()}
              onRightFocus={() => granularity === 'second' ? secondRef?.current?.focus() : (hourCycle === 12 ? periodRef?.current?.focus() : undefined)}
            />
          </>
        )}
        {granularity === 'second' && (
          <>
            :
            <TimePickerInput
              picker="seconds"
              date={date}
              onDateChange={handleDateChange}
              ref={secondRef}
              onLeftFocus={() => minuteRef?.current?.focus()}
              onRightFocus={() => hourCycle === 12 ? periodRef?.current?.focus() : undefined}
            />
          </>
        )}
        {hourCycle === 12 && (
          <div className="grid gap-1 text-center">
            <TimePeriodSelect
              period={period}
              setPeriod={setPeriod}
              date={date}
              onDateChange={(newDate) => {
                // onChange?.(newDate); // Déjà géré par handleDateChange dans TimePickerInput
                handleDateChange(newDate); // Utiliser handleDateChange pour la synchro de period
              }}
              ref={periodRef}
              onLeftFocus={() => granularity === 'second' ? secondRef?.current?.focus() : (granularity === 'minute' ? minuteRef?.current?.focus() : hourRef?.current?.focus())}
            />
          </div>
        )}
      </div>
    );
  },
);
TimePicker.displayName = 'TimePicker';

type Granularity = 'day' | 'hour' | 'minute' | 'second';

export type DateTimePickerProps = {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  hourCycle?: 12 | 24;
  placeholder?: string;
  displayFormat?: { hour24?: string; hour12?: string };
  granularity?: Granularity;
  className?: string;
  defaultPopupValue?: Date;
  locale?: Locale;
};

type DateTimePickerRef = {
  value?: Date;
} & Omit<HTMLButtonElement, 'value'>;

export const DateTimePicker = React.forwardRef<Partial<DateTimePickerRef>, DateTimePickerProps>(
  (
    {
      locale: propsDateTimePickerLocale,
      defaultPopupValue,
      value,
      onChange,
      hourCycle = 24,
      disabled = false,
      displayFormat,
      granularity = 'second',
      placeholder = 'Choisir une date',
      className,
    },
    ref,
  ) => {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);
    const [timePickerDate, setTimePickerDate] = React.useState<Date | undefined>(value);

    React.useEffect(() => {
      setSelectedDate(value);
      setTimePickerDate(value);
    }, [value]);

    const buttonRef = useRef<HTMLButtonElement>(null);
    
    const handleDateSelect = (date?: Date) => {
      let newFullDate = date;
      if (date && timePickerDate) { 
        newFullDate = new Date(date);
        newFullDate.setHours(
          timePickerDate.getHours(),
          timePickerDate.getMinutes(),
          timePickerDate.getSeconds()
        );
      } else if (date && !timePickerDate && value) { 
        newFullDate = new Date(date);
        newFullDate.setHours(value.getHours(), value.getMinutes(), value.getSeconds());
      } else if (date) { 
        newFullDate = new Date(date);
        newFullDate.setHours(0,0,0,0);
      }
      
      setSelectedDate(newFullDate);
      setTimePickerDate(newFullDate); 
      onChange?.(newFullDate);
    };

    const handleTimeChange = (newTime?: Date) => {
      let newFullDate = newTime;
      if (newTime && selectedDate) { 
        newFullDate = new Date(selectedDate);
        newFullDate.setHours(
          newTime.getHours(),
          newTime.getMinutes(),
          newTime.getSeconds()
        );
      } else if (newTime) { 
        newFullDate = new Date(newTime); 
      }
      
      setSelectedDate(newFullDate); 
      setTimePickerDate(newFullDate); 
      onChange?.(newFullDate);
    };

    useImperativeHandle(
      ref,
      () => ({
        ...buttonRef.current,
        value: selectedDate,
      }),
      [selectedDate, buttonRef],
    );

    const currentLocale = propsDateTimePickerLocale || fr;

    const initHourFormat = {
      hour24:
        displayFormat?.hour24 ??
        (granularity === 'day' ? 'PPP' : (granularity === 'hour' ? 'Pp HH' : (granularity === 'minute' ? 'Pp HH:mm' : 'Pp HH:mm:ss'))),
      hour12:
        displayFormat?.hour12 ??
        (granularity === 'day' ? 'PPP' : (granularity === 'hour' ? 'Pp hh ' : (granularity === 'minute' ? 'Pp hh:mm ' : 'Pp hh:mm:ss ' ))) + 'b',
    };
    
    let locToUse: Locale = currentLocale;
    if (currentLocale && typeof currentLocale.localize !== 'function') {
        locToUse = fr;
    }

    return (
      <Popover>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedDate && 'text-muted-foreground',
              className,
            )}
            ref={buttonRef}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(
                selectedDate,
                hourCycle === 24 ? initHourFormat.hour24 : initHourFormat.hour12,
                {
                  locale: locToUse,
                },
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            locale={locToUse}
            defaultMonth={selectedDate || defaultPopupValue}
            className="rounded-md border"
          />
          {granularity !== 'day' && (
            <div className="border-border border-t p-3">
              <TimePicker
                onChange={handleTimeChange}
                date={timePickerDate}
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

export type { TimePickerType, Period, Granularity, TimePickerRef }; 