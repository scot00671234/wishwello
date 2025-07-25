import { useState } from 'react';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  className?: string;
}

export function DateRangeFilter({ value, onChange, className = '' }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});

  const presetRanges = [
    {
      label: 'Last 7 days',
      getValue: () => ({
        from: startOfDay(subDays(new Date(), 6)),
        to: endOfDay(new Date()),
        label: 'Last 7 days'
      })
    },
    {
      label: 'Last 14 days',
      getValue: () => ({
        from: startOfDay(subDays(new Date(), 13)),
        to: endOfDay(new Date()),
        label: 'Last 14 days'
      })
    },
    {
      label: 'Last 30 days',
      getValue: () => ({
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
        label: 'Last 30 days'
      })
    },
    {
      label: 'Last 3 months',
      getValue: () => ({
        from: startOfDay(subMonths(new Date(), 3)),
        to: endOfDay(new Date()),
        label: 'Last 3 months'
      })
    },
    {
      label: 'Last 6 months',
      getValue: () => ({
        from: startOfDay(subMonths(new Date(), 6)),
        to: endOfDay(new Date()),
        label: 'Last 6 months'
      })
    },
    {
      label: 'Last year',
      getValue: () => ({
        from: startOfDay(subMonths(new Date(), 12)),
        to: endOfDay(new Date()),
        label: 'Last year'
      })
    }
  ];

  const handlePresetSelect = (preset: string) => {
    const range = presetRanges.find(p => p.label === preset);
    if (range) {
      onChange(range.getValue());
      setIsOpen(false);
    }
  };

  const handleCustomRange = () => {
    if (customRange.from && customRange.to) {
      onChange({
        from: startOfDay(customRange.from),
        to: endOfDay(customRange.to),
        label: `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d, yyyy')}`
      });
      setIsOpen(false);
    }
  };

  const isCustomSelected = !presetRanges.some(p => p.label === value.label);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`justify-between min-w-[200px] ${className}`}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            <span className="truncate">{value.label}</span>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          {/* Preset Options */}
          <div className="p-3 border-r">
            <div className="text-sm font-medium mb-2">Quick Select</div>
            <div className="space-y-1">
              {presetRanges.map((preset) => (
                <Button
                  key={preset.label}
                  variant={value.label === preset.label ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-sm"
                  onClick={() => handlePresetSelect(preset.label)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Calendar */}
          <div className="p-3">
            <div className="text-sm font-medium mb-2">Custom Range</div>
            <Calendar
              mode="range"
              selected={{ from: customRange.from, to: customRange.to }}
              onSelect={(range) => setCustomRange({ from: range?.from, to: range?.to })}
              numberOfMonths={2}
              className="rounded-md border-0"
            />
            {customRange.from && customRange.to && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">
                    {format(customRange.from, 'MMM d, yyyy')} - {format(customRange.to, 'MMM d, yyyy')}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  onClick={handleCustomRange}
                  className="w-full"
                >
                  Apply Custom Range
                </Button>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}