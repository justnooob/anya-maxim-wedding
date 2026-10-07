type EucalyptusProps = { className?: string };

const leaves = [
  { x: 90, y: 43, angle: -18, size: 13 },
  { x: 111, y: 78, angle: 36, size: 18 },
  { x: 69, y: 100, angle: -42, size: 20 },
  { x: 123, y: 131, angle: 42, size: 23 },
  { x: 58, y: 156, angle: -48, size: 25 },
  { x: 125, y: 192, angle: 49, size: 25 },
  { x: 49, y: 217, angle: -46, size: 26 },
  { x: 119, y: 257, angle: 46, size: 27 },
  { x: 45, y: 282, angle: -48, size: 27 },
  { x: 110, y: 319, angle: 42, size: 26 },
];

export function Eucalyptus({ className = "" }: EucalyptusProps) {
  return (
    <svg className={"eucalyptus " + className} viewBox="0 0 180 420" fill="none" aria-hidden="true" focusable="false">
      <path d="M72 413C76 358 70 309 82 248S102 131 91 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M92 61L109 78M95 90L70 100M97 116L121 132M95 145L59 156M92 177L122 192M88 204L50 217M82 241L117 257M77 267L46 282M76 300L108 319" stroke="currentColor" strokeWidth="1" />
      {leaves.map((leaf, index) => (
        <g key={index} transform={"translate(" + leaf.x + " " + leaf.y + ") rotate(" + leaf.angle + ")"}>
          <path
            d={"M0 " + (-leaf.size) + "C" + leaf.size + " " + (-leaf.size * 1.2) + " " + (leaf.size * 1.3) + " " + (leaf.size * .6) + " 0 " + (leaf.size * 1.15) + "C" + (-leaf.size * 1.15) + " " + (leaf.size * .5) + " " + (-leaf.size * .9) + " " + (-leaf.size) + " 0 " + (-leaf.size) + "Z"}
            fill="currentColor" opacity={index % 2 ? ".58" : ".78"}
          />
          <path d={"M0 " + (-leaf.size * .65) + "Q-2 0 0 " + (leaf.size * .8)} stroke="currentColor" strokeWidth=".65" opacity=".6" />
        </g>
      ))}
      <path d="M92 35C79 24 81 10 91 3C101 15 105 28 92 35Z" fill="currentColor" opacity=".7" />
    </svg>
  );
}
