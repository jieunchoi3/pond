"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FISH_SPECIES, speciesOf } from "@/lib/notes/fish";

function inventoryLabel(species: string, key: string) {
  if (key === "tang-blue") return "tang";
  const first = species.split(" ")[0];
  return (first ?? species).toLowerCase();
}

export function FishThumb({ fishKey, size = 36 }: { fishKey: string; size?: number }) {
  const fish = speciesOf(fishKey);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fish.left}
      alt=""
      width={size}
      height={Math.round(size * 0.62)}
      draggable={false}
      className="pointer-events-none"
      style={{ width: size, height: "auto" }}
    />
  );
}

type FishInventoryProps = {
  current: string;
  label: string;
  onPick: (key: string) => void;
};

export function FishInventory({ current, label, onPick }: FishInventoryProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-haspopup="dialog"
          className="grid size-10 shrink-0 place-items-center rounded-card outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent/35"
        >
          <FishThumb fishKey={current} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="right"
        sideOffset={10}
        collisionPadding={12}
        className="z-[80] w-[252px] rounded-card border-0 bg-surface p-3 shadow-pond-lg ring-1 ring-[var(--line)]"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <p className="type-label mb-3 text-ink-soft">Fish</p>
        <div className="grid grid-cols-3 gap-2">
          {FISH_SPECIES.map((fish) => {
            const selected = fish.key === current;
            return (
              <button
                key={fish.key}
                type="button"
                aria-label={fish.species}
                aria-pressed={selected}
                onClick={() => {
                  onPick(fish.key);
                  setOpen(false);
                }}
                className={`flex flex-col items-center gap-1 rounded-card px-1 py-2 ${
                  selected ? "bg-accent-soft" : "bg-surface-2 hover:bg-water-1"
                }`}
              >
                <FishThumb fishKey={fish.key} size={40} />
                <span className="type-label w-full text-center leading-tight text-ink-soft [overflow-wrap:anywhere]">
                  {inventoryLabel(fish.species, fish.key)}
                </span>
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
