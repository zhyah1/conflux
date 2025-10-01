"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, X, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

const multiSelectVariants = cva(
  "m-1",
  {
    variants: {
      variant: {
        default:
          "border-foreground/10 text-foreground bg-card hover:bg-card/80",
        secondary:
          "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        inverted: "inverted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface MultiSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectVariants> {
  options: {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
  onValueChange?: (value: string[]) => void
  defaultValue?: string[]
  placeholder?: string
  animation?: number
  maxCount?: number
  modalPopover?: boolean
  asChild?: boolean
  className?: string
  selected?: string[]
  onChange?: (value: string[]) => void
}

export const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(
  (
    {
      options,
      placeholder,
      className,
      selected,
      onChange,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)

    const handleUnselect = (item: string) => {
      onChange?.(selected?.filter((i) => i !== item) || [])
    }

    return (
      <Popover open={open} onOpenChange={setOpen} {...props}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            onClick={() => setOpen(!open)}
          >
            <div className="flex flex-wrap gap-1">
              {selected && selected.length > 0 ? (
                selected.map((item) => {
                  const option = options.find((o) => o.value === item)
                  if (!option) return null;
                  return (
                    <Badge
                      key={item}
                      variant="secondary"
                      className="whitespace-nowrap"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleUnselect(item)
                      }}
                    >
                      {option.label}
                      <X className="ml-1 h-4 w-4 cursor-pointer" />
                    </Badge>
                  )
                })
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command className={className}>
            <CommandInput placeholder="Search ..." />
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              <CommandList>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      const newSelected = selected?.includes(option.value)
                        ? selected.filter((item) => item !== option.value)
                        : [...(selected || []), option.value]
                      onChange?.(newSelected)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected?.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandList>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)

MultiSelect.displayName = "MultiSelect"
