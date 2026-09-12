// Hand-drawn sketch icons used as sparse floating decoration in empty
// layout corners. Kept as single-stroke line art (no fills, aside from a
// few pupil/nose dots) so they read as pencil doodles rather than polished
// illustrations.

export type DoodleType = "kid" | "toy" | "bag" | "ball" | "kite" | "teddy" | "book";

const PATHS: Record<DoodleType, React.ReactNode> = {
  // A kid mid-run, waving one arm.
  kid: (
    <>
      <circle cx="32" cy="13" r="7" />
      <path d="M27 9q2-3 5-3t5 3" />
      <circle cx="29.5" cy="13" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="34.5" cy="13" r="0.8" fill="currentColor" stroke="none" />
      <path d="M29 16.5q3 2 6 0" />
      <path d="M32 20v12" />
      <path d="M32 22c-6 0-9 4-8 10" />
      <path d="M32 24c6-1 9 3 11-3" />
      <path d="M25 32h14l-2 6h-10z" />
      <path d="M27 38c-2 6-5 9-9 12" />
      <path d="M37 38c3 5 7 7 10 11" />
      <path d="M16 51l2 3 4-2" />
      <path d="M47 50l3 2 3-3" />
    </>
  ),
  // A little toy car.
  toy: (
    <>
      <path d="M8 40q0-4 4-4h4l4-8h16l6 8h6q4 0 4 4" />
      <path d="M8 40h36" />
      <path d="M20 28h16" />
      <path d="M25 28v8" />
      <path d="M31 28v8" />
      <circle cx="18" cy="42" r="4" />
      <circle cx="42" cy="42" r="4" />
      <circle cx="18" cy="42" r="1" fill="currentColor" stroke="none" />
      <circle cx="42" cy="42" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  // A backpack with a top flap, front pocket and hanging straps.
  bag: (
    <>
      <path d="M23 20v-4q0-7 9-7t9 7v4" />
      <rect x="13" y="20" width="38" height="36" rx="9" />
      <path d="M13 30q6-3 12 0" />
      <rect x="23" y="34" width="18" height="14" rx="3" />
      <path d="M32 34v14" />
      <path d="M17 44v8M47 44v8" />
      <circle cx="32" cy="24" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  // A striped bouncy ball.
  ball: (
    <>
      <circle cx="32" cy="32" r="20" />
      <path d="M14 24q18 10 36 0" />
      <path d="M14 40q18-10 36 0" />
      <path d="M32 12v40" />
    </>
  ),
  // A diamond kite with a bowed tail.
  kite: (
    <>
      <path d="M32 4l14 20-14 26-14-26z" />
      <path d="M32 4v46M18 24h28" />
      <path d="M32 50q6 4 0 8t0 8" />
      <path d="M27 58l3 2 3-2M27 66l3 2 3-2" />
    </>
  ),
  // A sitting teddy bear.
  teddy: (
    <>
      <circle cx="22" cy="14" r="6" />
      <circle cx="42" cy="14" r="6" />
      <circle cx="32" cy="24" r="14" />
      <circle cx="27" cy="23" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="37" cy="23" r="1.2" fill="currentColor" stroke="none" />
      <path d="M28 30q4 3 8 0" />
      <ellipse cx="32" cy="27" rx="3" ry="2" />
      <circle cx="32" cy="26" r="1" fill="currentColor" stroke="none" />
      <ellipse cx="32" cy="46" rx="16" ry="14" />
      <circle cx="16" cy="40" r="6" />
      <circle cx="48" cy="40" r="6" />
      <circle cx="22" cy="56" r="6" />
      <circle cx="42" cy="56" r="6" />
      <path d="M26 44q6 4 12 0" />
    </>
  ),
  // An open storybook.
  book: (
    <>
      <path d="M8 16c8-4 16-4 24 2v34c-8-5-16-5-24-2z" />
      <path d="M56 16c-8-4-16-4-24 2v34c8-5 16-5 24-2z" />
      <path d="M32 18v34" />
      <path d="M14 24h14M14 30h14M14 36h10" />
      <path d="M36 24h14M36 30h14M40 36h10" />
    </>
  ),
};

export function Doodle({
  type,
  className,
  style,
}: {
  type: DoodleType;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {PATHS[type]}
    </svg>
  );
}
