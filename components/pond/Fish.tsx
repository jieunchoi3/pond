"use client";

import { speciesVars, type DepthLayer, LAYERS } from "@/lib/notes/fish";
import type { Species } from "@/lib/notes/types";

type FishProps = {
  species: Species;
  fill?: string;
  mark?: string;
  scale?: number;
  dim?: boolean;
  layer?: DepthLayer;
};

export function Fish({
  species,
  fill,
  mark,
  scale = 1,
  dim = false,
  layer,
}: FishProps) {
  const swatch = speciesVars(species);
  const fillColor = fill ?? swatch.fill;
  const markColor = mark ?? swatch.mark;
  const depth = layer ?? LAYERS[0];
  const width = 108 * scale * depth.k;
  const svgProps = {
    width,
    height: width * 0.6,
    viewBox: "0 0 180 108",
    style: {
      opacity: dim ? 0.1 : depth.o,
      filter: depth.blur ? `blur(${depth.blur}px)` : "none",
      transition: "opacity 400ms ease",
    },
    "aria-hidden": true as const,
  };

  if (species === "koi") {
    return (
      <svg {...svgProps}>
        <path d="M8 54 C 26 30, 40 30, 52 54 C 40 78, 26 78, 8 54 Z" fill={fillColor} opacity="0.9" />
        <ellipse cx="106" cy="54" rx="60" ry="27" fill={fillColor} />
        <path d="M100 28 C 112 8, 126 10, 122 30 Z" fill={fillColor} opacity="0.85" />
        <path d="M100 80 C 112 100, 126 98, 122 78 Z" fill={fillColor} opacity="0.85" />
        <ellipse cx="120" cy="42" rx="19" ry="12" fill={markColor} />
        <ellipse cx="82" cy="63" rx="12" ry="8" fill={markColor} opacity="0.85" />
        <circle cx="158" cy="50" r="3" className="fill-ink" />
      </svg>
    );
  }

  if (species === "goldfish") {
    return (
      <svg {...svgProps}>
        <path d="M4 54 C 24 18, 44 22, 56 54 C 44 86, 24 90, 4 54 Z" fill={fillColor} opacity="0.55" />
        <path d="M12 54 C 30 34, 46 36, 58 54 C 46 72, 30 74, 12 54 Z" fill={fillColor} opacity="0.8" />
        <ellipse cx="108" cy="54" rx="56" ry="34" fill={fillColor} />
        <path d="M104 22 C 118 4, 132 8, 126 26 Z" fill={markColor} opacity="0.9" />
        <path d="M96 84 C 108 104, 122 100, 116 82 Z" fill={markColor} opacity="0.8" />
        <circle cx="156" cy="47" r="3.5" className="fill-ink" />
      </svg>
    );
  }

  if (species === "tang") {
    return (
      <svg {...svgProps}>
        <path d="M10 54 L 46 30 L 46 78 Z" fill={markColor} />
        <path d="M46 54 C 60 12, 130 8, 158 46 C 164 54, 158 62, 150 70 C 118 100, 62 96, 46 54 Z" fill={fillColor} />
        <path d="M74 26 C 96 14, 124 16, 140 32 L 78 40 Z" fill={markColor} opacity="0.5" />
        <circle cx="146" cy="46" r="3.5" className="fill-ink" />
      </svg>
    );
  }

  return (
    <svg {...svgProps}>
      <path d="M2 54 C 22 6, 44 14, 60 54 C 44 96, 22 102, 2 54 Z" fill={fillColor} opacity="0.5" />
      <path d="M70 46 C 84 4, 128 2, 140 30 L 76 54 Z" fill={fillColor} opacity="0.6" />
      <path d="M70 62 C 84 104, 126 106, 138 80 L 76 56 Z" fill={markColor} opacity="0.45" />
      <ellipse cx="112" cy="54" rx="52" ry="22" fill={fillColor} />
      <circle cx="154" cy="50" r="3" className="fill-ink" />
    </svg>
  );
}
