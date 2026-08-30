"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Fish } from "@/components/pond/Fish";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePondCategories } from "@/lib/notes/categories";

type CategoryPickerProps = {
  value: string;
  noteId: string;
  onChange: (cat: string) => void;
};

export function CategoryPicker({ value, noteId, onChange }: CategoryPickerProps) {
  const categories = usePondCategories();
  const [open, setOpen] = useState(false);
  const current =
    categories.find((item) => item.id === value) ??
    (value ? { id: value, name: value, fishKey: "" } : categories[0]);

  const options =
    current && !categories.some((item) => item.id === current.id)
      ? [current, ...categories]
      : categories;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Category: ${current?.name ?? "none"}`}
          className="type-label flex items-center gap-2 rounded-pill bg-water-1 py-1 pr-3 pl-1.5 text-ink outline-none transition-colors hover:bg-water-2 focus-visible:ring-2 focus-visible:ring-accent/35 data-[state=open]:bg-water-2"
        >
          {current ? <Fish cat={current.id} id={noteId} scale={0.4} /> : null}
          <span className="min-w-0 max-w-[12rem] truncate">{current?.name ?? "category"}</span>
          <Icon
            icon="bi:chevron-down"
            width={12}
            height={12}
            className={`shrink-0 text-ink-soft transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="z-[80] w-auto min-w-[240px] rounded-card border-0 bg-surface p-1.5 shadow-pond-lg ring-1 ring-[var(--line)]"
        onCloseAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.stopPropagation()}
      >
        <DropdownMenuRadioGroup
          value={current?.id ?? value}
          onValueChange={(next) => {
            onChange(next);
            setOpen(false);
          }}
        >
          {options.map((item) => {
            const selected = item.id === (current?.id ?? value);
            return (
              <DropdownMenuRadioItem
                key={item.id}
                value={item.id}
                className={`type-label gap-3 rounded-input py-2 pr-8 pl-2 focus:bg-water-1 focus:text-ink focus:**:text-ink [&_svg]:text-accent ${
                  selected ? "bg-water-1 text-ink" : "text-ink-soft"
                }`}
              >
                <Fish cat={item.id} id={`${noteId}-${item.id}`} scale={0.26} />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
