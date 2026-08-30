const PADS = [
  { x: 6, y: 18, r: 58, o: 0.3 },
  { x: 24, y: 9, r: 38, o: 0.22 },
  { x: 80, y: 24, r: 50, o: 0.26 },
  { x: 93, y: 66, r: 44, o: 0.18 },
  { x: 10, y: 78, r: 48, o: 0.2 },
  { x: 60, y: 92, r: 36, o: 0.16 },
];

export function LilyPads() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      {PADS.map((pad, index) => (
        <g key={index} opacity={pad.o} transform={`translate(${pad.x}% ${pad.y}%)`}>
          <circle r={pad.r} fill={index % 2 ? "var(--lily-a)" : "var(--lily-b)"} />
          <path
            d={`M0 0 L ${pad.r * 0.95} ${-pad.r * 0.34} A ${pad.r} ${pad.r} 0 0 0 ${pad.r * 0.95} ${pad.r * 0.34} Z`}
            fill="var(--water-2)"
            opacity="0.8"
          />
        </g>
      ))}
    </svg>
  );
}
