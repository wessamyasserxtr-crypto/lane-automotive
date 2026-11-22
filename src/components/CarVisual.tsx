import { useId, useState } from 'react';
import type { CarModel } from '../data/cars';
import { shadeHexColor } from '../utils/laneLogic';

interface CarVisualProps {
  car: CarModel;
  src: string;
  alt: string;
  compact?: boolean;
  forceStudio?: boolean;
  isInteriorStudio?: boolean;
  paintColorHex?: string;
  paintColorName?: string;
  studioSide?: 'left' | 'right';
  headlightsOn?: boolean;
  className?: string;
  imgClassName?: string;
}

export function CarCabinStudio({
  car,
  paintColorHex,
  compact = false,
  className = '',
}: {
  car: CarModel;
  paintColorHex?: string;
  compact?: boolean;
  className?: string;
}) {
  const accent = paintColorHex || car.accentHex || '#ed1c24';
  const stitch = shadeHexColor(accent, 0.25);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_30%,#27282c_0%,#121316_62%,#090a0c_100%)] ${className}`}
    >
      <svg
        viewBox="0 0 800 320"
        role="img"
        aria-label={`${car.name} Interior Cockpit`}
        className="w-[88%] max-w-[560px]"
      >
        {/* Windshield view */}
        <path
          d="M110 155 Q190 48 400 42 Q610 48 690 155 Z"
          fill="#182028"
          stroke="#3b424c"
          strokeWidth="2"
        />
        {/* Dashboard sculpted brow */}
        <path
          d="M48 190 Q175 135 400 132 Q625 135 752 190 L752 292 L48 292 Z"
          fill="#151619"
          stroke="#2f3238"
          strokeWidth="2.5"
        />
        {/* Ambient LED interior strip reacting softly to exterior trim accent */}
        <path
          d="M84 196 Q240 162 400 160 Q560 162 716 196"
          fill="none"
          stroke="#ed1c24"
          strokeOpacity="0.75"
          strokeWidth="3"
        />
        {/* Digital instrument cluster */}
        <rect
          x="155"
          y="156"
          width="150"
          height="56"
          rx="8"
          fill="#090d14"
          stroke="#39414f"
          strokeWidth="2"
        />
        <circle cx="195" cy="184" r="16" fill="none" stroke="#ed1c24" strokeWidth="2.5" />
        <circle cx="265" cy="184" r="16" fill="none" stroke="#4da3ff" strokeWidth="2.5" />
        <rect x="219" y="176" width="22" height="14" rx="2" fill="#232b36" />

        {/* Center panoramic infotainment screen */}
        <rect
          x="338"
          y="148"
          width="165"
          height="74"
          rx="8"
          fill="#0a0e16"
          stroke="#464d59"
          strokeWidth="2.5"
        />
        <rect x="352" y="162" width="64" height="44" rx="4" fill="#17202c" />
        <rect x="424" y="162" width="65" height="20" rx="3" fill="#1c2530" />
        <rect x="424" y="188" width="65" height="18" rx="3" fill="#ed1c24" fillOpacity="0.75" />

        {/* Steering wheel */}
        <circle cx="230" cy="222" r="56" fill="none" stroke="#2d3036" strokeWidth="13" />
        <circle cx="230" cy="222" r="56" fill="none" stroke={stitch} strokeOpacity="0.45" strokeWidth="1.5" />
        <circle cx="230" cy="222" r="18" fill="#1b1d22" stroke="#474b54" strokeWidth="2" />
        <path d="M180 218 L212 222 M248 222 L280 218 M230 240 L230 274" stroke="#2f3239" strokeWidth="9" strokeLinecap="round" />

        {/* Center console */}
        <path
          d="M340 245 L465 245 L495 305 L315 305 Z"
          fill="#1b1c20"
          stroke="#32353d"
          strokeWidth="2"
        />
        <rect x="384" y="258" width="38" height="22" rx="4" fill="#2a2d34" stroke="#ed1c24" strokeOpacity="0.5" />
      </svg>

      {!compact && (
        <>
          <span
            dir="ltr"
            className="font-latin absolute top-4 end-4 border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-white/75"
          >
            LANE COCKPIT PREVIEW
          </span>
          <span
            dir="ltr"
            className="font-latin absolute bottom-3 end-4 text-[10px] font-semibold tracking-[0.14em] text-[#d5d1cc]"
          >
            {car.name} · Interior Trim
          </span>
        </>
      )}
    </div>
  );
}

export function CarStudioSilhouette({
  car,
  paintColorHex,
  paintColorName,
  studioSide = 'left',
  headlightsOn = true,
  compact = false,
  className = '',
}: {
  car: CarModel;
  paintColorHex?: string;
  paintColorName?: string;
  studioSide?: 'left' | 'right';
  headlightsOn?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const baseColor = paintColorHex || car.accentHex || '#f1f3f5';
  const topHighlight = shadeHexColor(baseColor, 0.38);
  const midColor = baseColor;
  const deepShadow = shadeHexColor(baseColor, -0.42);
  const darkCrease = shadeHexColor(baseColor, -0.62);
  const ambientGlow = shadeHexColor(baseColor, 0.15);

  const isSuv = car.type === 'suv';
  const isFlipped = studioSide === 'right';

  // Crisp, detailed SVG paths facing Left (headlight at x~78..120, taillight at x~680..725)
  const bodyPath = isSuv
    ? 'M78 214 L88 164 Q100 140 148 130 L246 96 Q298 76 368 74 L556 74 Q606 76 646 112 L688 152 L714 166 Q728 176 726 210 L692 222 L652 222 A48 48 0 0 0 556 222 L270 222 A48 48 0 0 0 174 222 L92 222 Z'
    : 'M74 214 L92 172 Q108 150 156 138 L266 106 Q320 68 386 64 L492 62 Q552 62 608 98 L664 138 L712 154 Q730 164 726 206 L690 222 L648 222 A46 46 0 0 0 556 222 L268 222 A46 46 0 0 0 176 222 L88 222 Z';

  const glassPath = isSuv
    ? 'M244 128 L302 88 Q326 82 374 82 L542 82 Q582 82 612 110 L634 132 Z'
    : 'M256 124 L328 76 Q356 70 398 70 L488 70 Q536 72 574 102 L606 126 Z';

  const beltLinePath = isSuv
    ? 'M144 156 Q370 142 668 156'
    : 'M140 162 Q380 144 676 156';

  const skirtPath = isSuv
    ? 'M268 214 L558 214 L550 224 L276 224 Z'
    : 'M266 215 L558 215 L552 223 L272 223 Z';

  const cxFront = 222;
  const cxRear = 604;
  const cyWheel = 222;

  return (
    <div
      data-testid={`studio-car-${car.id}`}
      data-paint-hex={baseColor}
      className={`relative flex items-center justify-center overflow-hidden bg-[#0e0f12] ${className}`}
    >
      {/* Dynamic Studio Backdrop Halo tinted cleanly with active paint */}
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-500"
        style={{
          background: `radial-gradient(ellipse at 52% 45%, ${ambientGlow}33 0%, #1a1b20 44%, #0b0c0e 86%)`,
        }}
      />

      <svg
        viewBox="0 0 800 300"
        role="img"
        aria-label={`${car.name} Studio Preview`}
        className="relative z-10 w-[88%] max-w-[540px] drop-shadow-[0_24px_30px_rgba(0,0,0,0.85)]"
        style={{
          transform: isFlipped ? 'scaleX(-1)' : 'scaleX(1)',
          transition: 'transform 350ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <defs>
          <linearGradient id={`paint-${uid}`} x1="0" y1="0" x2="0.15" y2="1">
            <stop offset="0%" stopColor={topHighlight} />
            <stop offset="35%" stopColor={midColor} />
            <stop offset="78%" stopColor={deepShadow} />
            <stop offset="100%" stopColor={darkCrease} />
          </linearGradient>

          <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
          </linearGradient>

          <linearGradient id={`glass-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8ba0b0" />
            <stop offset="45%" stopColor="#2c3742" />
            <stop offset="100%" stopColor="#12161b" />
          </linearGradient>

          <linearGradient id={`beam-${uid}`} x1="1" y1="0.5" x2="0" y2="0.5">
            <stop offset="0%" stopColor="#fff8dc" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fff8dc" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ground Contact Shadow */}
        <ellipse cx="410" cy="264" rx="315" ry="20" fill="#000000" opacity="0.72" />
        <ellipse
          cx="410"
          cy="260"
          rx="260"
          ry="10"
          fill={ambientGlow}
          opacity="0.14"
        />

        {/* Headlight Light Cone */}
        {headlightsOn && !compact && (
          <polygon
            points="92,184 0,145 0,248 92,202"
            fill={`url(#beam-${uid})`}
          />
        )}

        {/* Roof rails for SUV */}
        {isSuv && (
          <path
            d="M298 75 Q420 68 558 75"
            fill="none"
            stroke="#c5c9ce"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}

        {/* Main Painted Car Body */}
        <path
          d={bodyPath}
          fill={`url(#paint-${uid})`}
          stroke={topHighlight}
          strokeOpacity="0.55"
          strokeWidth="2"
        />

        {/* Clearcoat Hood & Shoulder Highlight */}
        <path
          d={beltLinePath}
          fill="none"
          stroke={`url(#sheen-${uid})`}
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Lower Skirt Accent */}
        <path d={skirtPath} fill="#16181c" stroke="#363940" strokeWidth="1" />

        {/* Greenhouse Windows */}
        <path
          d={glassPath}
          fill={`url(#glass-${uid})`}
          stroke="#d7dee5"
          strokeOpacity="0.45"
          strokeWidth="1.8"
        />
        {/* B & C Pillars */}
        <line x1="406" y1="81" x2="402" y2="128" stroke="#181a1e" strokeWidth="8" />
        <line x1="538" y1="82" x2="554" y2="128" stroke="#181a1e" strokeWidth="6" />

        {/* Side Mirror in body color */}
        <rect
          x="248"
          y="124"
          width="22"
          height="13"
          rx="5"
          fill={midColor}
          stroke={deepShadow}
          strokeWidth="1.5"
        />

        {/* Door handles */}
        <rect x="355" y="154" width="20" height="4" rx="2" fill={topHighlight} opacity="0.85" />
        <rect x="492" y="154" width="20" height="4" rx="2" fill={topHighlight} opacity="0.85" />

        {/* Front Grille */}
        <path
          d="M78 186 L104 186 L100 206 L76 206 Z"
          fill="#111316"
          stroke="#5c626b"
          strokeWidth="1.2"
        />

        {/* LED Headlight / DRL */}
        <path
          d="M84 176 L132 167"
          stroke={headlightsOn ? '#fef9c3' : '#d4d8dd'}
          strokeWidth={headlightsOn ? '6.5' : '4.5'}
          strokeLinecap="round"
        />
        {headlightsOn && (
          <circle cx="94" cy="175" r="7" fill="#ffffff" opacity="0.9" />
        )}

        {/* LED Taillight */}
        <path
          d="M664 166 L720 176"
          stroke={headlightsOn ? '#ff242c' : '#9e191e'}
          strokeWidth={headlightsOn ? '6.5' : '4.5'}
          strokeLinecap="round"
        />

        {/* Front & Rear Alloy Wheels + Red Brake Calipers */}
        {[cxFront, cxRear].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={cyWheel} r="44" fill="#090a0c" stroke="#2c2f34" strokeWidth="4" />
            <circle cx={cx} cy={cyWheel} r="31" fill="#17191d" stroke="#d0d4d9" strokeWidth="3.5" />
            {/* Performance red brake caliper */}
            <path
              d={`M${cx + 10} ${cyWheel - 14} A17 17 0 0 1 ${cx + 16} ${cyWheel + 6}`}
              fill="none"
              stroke="#ed1c24"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Multi-spoke alloy star */}
            {[0, 72, 144, 216, 288].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const x2 = cx + Math.cos(rad) * 28;
              const y2 = cyWheel + Math.sin(rad) * 28;
              return (
                <line
                  key={deg}
                  x1={cx}
                  y1={cyWheel}
                  x2={x2}
                  y2={y2}
                  stroke="#e2e6eb"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              );
            })}
            <circle cx={cx} cy={cyWheel} r="8" fill="#1f2228" stroke="#ed1c24" strokeWidth="2.5" />
          </g>
        ))}
      </svg>

      {!compact && (
        <div className="font-latin absolute bottom-3.5 end-3.5 z-20 flex items-center gap-2 border border-white/15 bg-black/70 px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-white/90">
          <span
            className="h-2.5 w-2.5 rounded-full border border-white/60"
            style={{ backgroundColor: baseColor }}
          />
          <span>{paintColorName || car.name}</span>
        </div>
      )}
    </div>
  );
}

export function CarVisual({
  car,
  src,
  alt,
  compact = false,
  forceStudio = false,
  isInteriorStudio = false,
  paintColorHex,
  paintColorName,
  studioSide = 'left',
  headlightsOn = true,
  className = '',
  imgClassName = '',
}: CarVisualProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasValidSrc = typeof src === 'string' && src.trim().length > 0;
  const trimmedSrc = hasValidSrc ? src.trim() : '';
  const isCutoutPng = trimmedSrc.length > 0 && /\.png($|\?)/i.test(trimmedSrc);
  const isWhiteStudioShot = trimmedSrc.includes('Cars-Side-Shots/');
  const failed = failedSrc === src;

  if (isInteriorStudio && (!hasValidSrc || failed)) {
    return (
      <div className={`relative overflow-hidden bg-[#101114] ${className}`}>
        <CarCabinStudio
          car={car}
          paintColorHex={paintColorHex}
          compact={compact}
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${
        isWhiteStudioShot
          ? 'bg-[#f4f5f7]'
          : isCutoutPng
            ? 'bg-[radial-gradient(ellipse_at_50%_56%,#30343d_0%,#181a1f_56%,#0d0e11_100%)]'
            : 'bg-[#141518]'
      } ${className}`}
    >
      {!forceStudio && hasValidSrc && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
          className={`h-full w-full ${
            isWhiteStudioShot
              ? 'object-contain p-3'
              : isCutoutPng
                ? 'object-contain p-4 drop-shadow-[0_18px_28px_rgba(0,0,0,0.8)]'
                : 'object-cover object-center'
          } ${imgClassName}`}
        />
      ) : (
        <CarStudioSilhouette
          car={car}
          paintColorHex={paintColorHex}
          paintColorName={paintColorName}
          studioSide={studioSide}
          headlightsOn={headlightsOn}
          compact={compact}
          className="h-full w-full"
        />
      )}
    </div>
  );
}
