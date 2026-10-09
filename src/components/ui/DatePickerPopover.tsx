"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, isAfter, startOfDay, subDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerPopoverProps {
  value: string;           // "yyyy-MM-dd" or ""
  onChange: (val: string) => void;
  placeholder?: string;
  maxDate?: Date;
  minDate?: Date;
  popoverClassName?: string; // e.g. "z-[60]" when inside a modal
}

export function DatePickerPopover({
  value,
  onChange,
  placeholder = "Pick a date",
  maxDate = new Date(),
  minDate,
  popoverClassName,
}: DatePickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? new Date(value + "T00:00:00") : undefined;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (day: Date | undefined) => {
    if (!day) return;
    if (isAfter(startOfDay(day), startOfDay(maxDate))) return;
    if (minDate && !isAfter(startOfDay(day), startOfDay(minDate)) && startOfDay(day).getTime() !== startOfDay(minDate).getTime()) return;
    onChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 bg-background border-2 rounded-xl text-sm transition-all duration-200",
          open
            ? "border-primary ring-2 ring-primary/20"
            : "border-border hover:border-primary/50",
          !selected && "text-muted-foreground"
        )}
      >
        <CalendarIcon className={cn("w-4 h-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
        <span className={cn("flex-1 text-left font-medium", selected ? "text-foreground" : "text-muted-foreground")}>
          {selected ? format(selected, "dd MMMM yyyy") : placeholder}
        </span>
        {selected && (
          <span className="text-xs text-muted-foreground">
            {format(selected, "EEEE")}
          </span>
        )}
      </button>

      {/* Calendar popover */}
      {open && (
        <div className={cn("absolute z-50 mt-2 left-0 bg-card border border-border rounded-2xl shadow-2xl p-3 animate-scale-in", popoverClassName)}>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={{ after: maxDate }}
            defaultMonth={selected ?? new Date()}
            showOutsideDays
            classNames={{
              root: "w-full",
              months: "flex flex-col",
              month: "space-y-3",
              month_caption: "flex items-center justify-between px-1 mb-2",
              caption_label: "text-sm font-semibold text-foreground",
              nav: "flex items-center gap-1",
              button_previous: cn(
                "p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
              ),
              button_next: cn(
                "p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
              ),
              weeks: "space-y-1",
              weekdays: "grid grid-cols-7 mb-1",
              weekday: "text-center text-xs font-medium text-muted-foreground py-1 w-9",
              week: "grid grid-cols-7",
              day: "w-9 h-9 flex items-center justify-center",
              day_button: cn(
                "w-9 h-9 rounded-xl text-sm font-medium transition-all duration-150",
                "hover:bg-primary/10 hover:text-primary",
                "focus:outline-none focus:ring-2 focus:ring-primary/40"
              ),
              selected: "!bg-primary !text-white !rounded-xl font-bold shadow-md shadow-primary/30",
              today: "text-primary font-bold",
              outside: "text-muted-foreground/40",
              disabled: "text-muted-foreground/30 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground/30",
            }}
          />

          {/* Quick shortcuts */}
          <div className="border-t border-border pt-3 mt-1 flex gap-2">
            {[
              { label: "Today", date: new Date() },
              {
                label: "Yesterday",
                date: subDays(new Date(), 1),
              },
            ].map(({ label, date }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleSelect(date)}
                className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
