"use client";

import { fishFor, type DepthLayer, LAYERS } from "@/lib/notes/fish";
import type { Cat } from "@/lib/notes/types";

type FishProps = {
  cat: Cat;
  id: string;
  scale?: number;
  dim?: boolean;
  layer?: DepthLayer;
};

export function Fish({ cat, id, scale = 1, dim = false, layer }: FishProps) {
  const fish = fishFor(cat, id);
  const depth = layer ?? LAYERS[0]!;
  const width = fish.width * scale;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fish.src}
      alt=""
      width={width}
      height={Math.round(width * 0.6)}
      style={{
        width,
        height: "auto",
        opacity: dim ? 0.1 : depth.o,
        filter: depth.blur ? `blur(${depth.blur}px)` : "none",
        transition: "opacity 400ms ease",
      }}
    />
  );
}
