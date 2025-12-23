"use client";

import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { formatYMD, isValidYMD, parseYMD } from "@/domain/date";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

const toDate = (value?: string) => {
  if (!value || !isValidYMD(value)) {
    return undefined;
  }
  const { y, m, d } = parseYMD(value);
  return new Date(Date.UTC(y, m - 1, d, 12));
};

const toYMD = (date: Date) =>
  formatYMD(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());

export function DatePicker({
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
  disabled,
}: DatePickerProps) {
  const selectedDate = toDate(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
          disabled={disabled}
          type="button"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
          ) : (
            <span>{placeholder || "Selecione uma data"}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onChange(toYMD(date));
            }
          }}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          initialFocus
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}
