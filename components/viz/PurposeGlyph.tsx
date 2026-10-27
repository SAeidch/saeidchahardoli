/**
 * Small line drawings for the three purpose pillars: streamlines (research),
 * a matrix product with its row, column and result marked (learn), and a
 * stack of slides (talks). Same role colors as the rest of the site.
 */
const ink = (a: number) => `color-mix(in srgb, var(--color-ink) ${a}%, transparent)`;

export default function PurposeGlyph({ id }: { id: string }) {
  if (id === "research")
    return (
      <svg viewBox="0 0 120 64" className="h-16 w-auto" aria-hidden>
        {[10, 20, 32, 44, 54].map((y, k) => (
          <path
            key={y}
            d={`M4 ${y} C34 ${y}, 44 ${y < 32 ? y - 9 + k * 2 : y + 9 - (4 - k) * 2}, 60 ${y < 32 ? y - 9 + k * 2 : y + 9 - (4 - k) * 2} S90 ${y}, 116 ${y}`}
            fill="none"
            stroke="var(--color-accent)"
            strokeOpacity={0.45 + (k === 2 ? 0.4 : 0.1)}
            strokeWidth="1.4"
            className="viz-flow"
          />
        ))}
        <circle cx="60" cy="32" r="9" fill={ink(8)} stroke={ink(45)} />
      </svg>
    );
  if (id === "learn")
    return (
      <svg viewBox="0 0 120 64" className="h-16 w-auto" aria-hidden>
        {[0, 1, 2].map((i) =>
          [0, 1, 2].map((j) => (
            <rect key={`a${i}${j}`} x={4 + j * 12} y={14 + i * 12} width="10" height="10" rx="2" fill={ink(10)} />
          ))
        )}
        <rect x="2.5" y="24.5" width="37" height="13" rx="3" fill="none" stroke="var(--color-op-row)" strokeWidth="1.6" />
        <text x="46" y="35" className="fill-ink/40 text-[10px]">·</text>
        {[0, 1, 2].map((i) =>
          [0, 1, 2].map((j) => (
            <rect key={`b${i}${j}`} x={52 + j * 12} y={14 + i * 12} width="10" height="10" rx="2" fill={ink(10)} />
          ))
        )}
        <rect x="62.5" y="12.5" width="13" height="37" rx="3" fill="none" stroke="var(--color-op-col)" strokeWidth="1.6" />
        <text x="92" y="35" className="fill-ink/40 text-[10px]">=</text>
        <rect x="102" y="26" width="12" height="12" rx="2" fill="color-mix(in srgb, var(--color-pos) 45%, transparent)" stroke="var(--color-op-out)" strokeWidth="1.6" />
      </svg>
    );
  return (
    <svg viewBox="0 0 120 64" className="h-16 w-auto" aria-hidden>
      <rect x="22" y="6" width="70" height="44" rx="4" fill={ink(5)} stroke={ink(25)} />
      <rect x="14" y="12" width="70" height="44" rx="4" fill={ink(7)} stroke={ink(35)} />
      <rect x="6" y="18" width="70" height="44" rx="4" fill="var(--color-paper)" stroke={ink(55)} />
      <rect x="13" y="27" width="34" height="5" rx="2" fill={ink(55)} />
      <rect x="13" y="37" width="24" height="3" rx="1.5" fill={ink(30)} />
      <path d="M50 52 L58 34 L64 44 L68 38 L72 52 Z" fill="color-mix(in srgb, var(--color-accent) 35%, transparent)" />
      <path d="M98 26 L112 34 L98 42 Z" fill="var(--color-accent)" />
    </svg>
  );
}
