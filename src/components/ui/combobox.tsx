import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  options: { label: string; value: string; extra?: string }[]
  value?: string
  onSelect: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  buttonClassName?: string
  popoverClassName?: string
  disabled?: boolean
  displayValue?: (value: string) => string
  displayExtra?: boolean
}

export function Combobox({
  options,
  value,
  onSelect,
  placeholder = "Select an option",
  emptyMessage = "No results found",
  className,
  buttonClassName,
  popoverClassName,
  disabled = false,
  displayValue,
  displayExtra = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  
  const selected = React.useMemo(() => {
    return options.find((option) => option.value === value)
  }, [options, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            buttonClassName
          )}
          disabled={disabled}
        >
          {value && displayValue
            ? displayValue(value)
            : selected?.label || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0", popoverClassName)}>
        <Command className={className}>
          <CommandInput placeholder={placeholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => {
                  onSelect(option.value)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {displayExtra && option.extra && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">{option.extra}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
