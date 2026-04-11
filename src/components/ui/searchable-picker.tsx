"use client"

import * as React from "react"
import { Search, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface SearchablePickerProps {
  options: string[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  title?: string
  disabled?: boolean
  className?: string
}

export function SearchablePicker({
  options,
  value,
  onValueChange,
  placeholder = "Seçiniz...",
  searchPlaceholder = "Ara...",
  emptyMessage = "Sonuç bulunamadı.",
  title = "Seçim Yapın",
  disabled = false,
  className,
}: SearchablePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredOptions = options.filter((option) =>
    option.toLocaleLowerCase("tr-TR").includes(searchQuery.toLocaleLowerCase("tr-TR"))
  )

  const handleSelect = (option: string) => {
    onValueChange(option)
    setOpen(false)
    setSearchQuery("")
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal bg-white dark:bg-gray-950",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value || placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] sm:h-[600px] sm:max-w-[500px] sm:left-1/2 sm:-translate-x-1/2 sm:bottom-10 sm:rounded-2xl p-0 flex flex-col shadow-2xl border dark:border-gray-800"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="flex-1" type="always">
          <div className="p-2">
            {filteredOptions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            ) : (
              <div className="grid gap-1">
                {filteredOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 text-sm text-left rounded-md transition-colors hover:bg-accent",
                      value === option && "bg-accent font-medium text-accent-foreground"
                    )}
                  >
                    {option}
                    {value === option && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
