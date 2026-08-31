import React from 'react';

interface ContinuousOceanWavesProps {
  className?: string;
  height?: string;
  opacity?: string;
  theme?: 'emerald' | 'sapphire' | 'abyssal';
  showFoamSparkles?: boolean;
}

export default function ContinuousOceanWaves({
  className = '',
  height = 'h-32',
  opacity = 'opacity-40',
  theme = 'sapphire',
  showFoamSparkles = true,
}: ContinuousOceanWavesProps) {
  // Gradients according to nautical color theme
  const isEmerald = theme === 'emerald';
  const isAbyssal = theme === 'abyssal';

  const deepColor1 = isEmerald ? '#047857' : isAbyssal ? '#0284C7' : '#0369A1';
  const deepColor2 = isEmerald ? '#022C22' : isAbyssal ? '#02131F' : '#041E33';

  const midColor1 = isEmerald ? '#10B981' : isAbyssal ? '#38BDF8' : '#0EA5E9';
  const midColor2 = isEmerald ? '#064E3B' : isAbyssal ? '#0B2A3E' : '#082F49';

  const frontColor1 = isEmerald ? '#6EE7B7' : isAbyssal ? '#7DD3FC' : '#38BDF8';
  const frontColor2 = isEmerald ? '#065F46' : isAbyssal ? '#07253B' : '#0C4A6E';

  const uniqueId = React.useId().replace(/:/g, '_');

  return (
    <div className={`continuous-ocean-stage ${height} ${opacity} ${className} pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden`}>
      {/* ── LAYER 1: Deep Abyssal Current ── */}
      <div className="ocean-wave-layer ocean-wave-deep">
        <svg viewBox="0 0 1440 140" preserveAspectRatio="none" className="ocean-wave-svg">
          <defs>
            <linearGradient id={`deepGrad_${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={deepColor1} stopOpacity="0.85" />
              <stop offset="100%" stopColor={deepColor2} stopOpacity="0.98" />
            </linearGradient>
          </defs>
          <path
            d="M0,50 C240,95 480,15 720,55 C960,95 1200,15 1440,55 L1440,140 L0,140 Z"
            fill={`url(#deepGrad_${uniqueId})`}
          />
        </svg>
        <svg viewBox="0 0 1440 140" preserveAspectRatio="none" className="ocean-wave-svg">
          <path
            d="M0,50 C240,95 480,15 720,55 C960,95 1200,15 1440,55 L1440,140 L0,140 Z"
            fill={`url(#deepGrad_${uniqueId})`}
          />
        </svg>
      </div>

      {/* ── LAYER 2: Mid-Tide Swell ── */}
      <div className="ocean-wave-layer ocean-wave-mid">
        <svg viewBox="0 0 1440 140" preserveAspectRatio="none" className="ocean-wave-svg">
          <defs>
            <linearGradient id={`midGrad_${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={midColor1} stopOpacity="0.8" />
              <stop offset="100%" stopColor={midColor2} stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <path
            d="M0,65 C200,25 440,105 720,55 C980,10 1200,95 1440,50 L1440,140 L0,140 Z"
            fill={`url(#midGrad_${uniqueId})`}
          />
        </svg>
        <svg viewBox="0 0 1440 140" preserveAspectRatio="none" className="ocean-wave-svg">
          <path
            d="M0,65 C200,25 440,105 720,55 C980,10 1200,95 1440,50 L1440,140 L0,140 Z"
            fill={`url(#midGrad_${uniqueId})`}
          />
        </svg>
      </div>

      {/* ── LAYER 3: Surface Seafoam & Liquid Crest ── */}
      <div className="ocean-wave-layer ocean-wave-front">
        <svg viewBox="0 0 1440 140" preserveAspectRatio="none" className="ocean-wave-svg">
          <defs>
            <linearGradient id={`frontGrad_${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={frontColor1} stopOpacity="0.9" />
              <stop offset="100%" stopColor={frontColor2} stopOpacity="0.98" />
            </linearGradient>
          </defs>
          {/* Liquid Wave Body */}
          <path
            d="M0,75 C180,40 360,110 540,70 C720,35 900,105 1080,65 C1260,30 1440,95 1440,65 L1440,140 L0,140 Z"
            fill={`url(#frontGrad_${uniqueId})`}
          />
          {/* Frosted Seafoam Crest Stroke */}
          <path
            d="M0,75 C180,40 360,110 540,70 C720,35 900,105 1080,65 C1260,30 1440,95 1440,65"
            fill="none"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="3"
            strokeDasharray="20,10,35,10"
            strokeLinecap="round"
          />
        </svg>
        <svg viewBox="0 0 1440 140" preserveAspectRatio="none" className="ocean-wave-svg">
          <path
            d="M0,75 C180,40 360,110 540,70 C720,35 900,105 1080,65 C1260,30 1440,95 1440,65 L1440,140 L0,140 Z"
            fill={`url(#frontGrad_${uniqueId})`}
          />
          <path
            d="M0,75 C180,40 360,110 540,70 C720,35 900,105 1080,65 C1260,30 1440,95 1440,65"
            fill="none"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="3"
            strokeDasharray="20,10,35,10"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Ambient Foam Sparkles */}
      {showFoamSparkles && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-4 left-[15%] w-1.5 h-1.5 rounded-full bg-white/70 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-6 left-[45%] w-2 h-2 rounded-full bg-sky-200/80 animate-ping" style={{ animationDuration: '4s', animationDelay: '1.2s' }} />
          <div className="absolute bottom-3 left-[75%] w-1.5 h-1.5 rounded-full bg-emerald-200/70 animate-ping" style={{ animationDuration: '3.5s', animationDelay: '2.4s' }} />
        </div>
      )}
    </div>
  );
}
