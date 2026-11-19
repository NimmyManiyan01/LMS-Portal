import { useEffect, useId, useState } from "react"

interface AnimatedLogoProps {
  className?: string
  title?: string
}

const layers = [
  {
    name: "outer",
    className: "kgs-logo-layer kgs-logo-outer",
    path: "M68 178C20 132 52 60 164 38c115-23 222 28 282 60 54-31 139-52 184-22-75 2-126 16-167 44-80-48-179-78-279-57C94 81 51 123 68 178Zm8 10c37 50 132 56 225 25 50-17 89-43 112-73-12 43-54 81-113 105-97 39-193 20-224-57Z",
    delay: ".05s",
    duration: ".68s",
    fillDelay: ".48s",
    gradient: "blue",
  },
  {
    name: "light",
    className: "kgs-logo-layer kgs-logo-light",
    path: "M339 79c68-50 165-70 244-48-61 9-113 27-162 57 65-9 126-1 167 34 45 38 39 94-4 123 28-37 24-79-7-104-42-34-109-37-174-23-27 6-49 11-70 10l-34-20Z",
    delay: ".48s",
    duration: ".58s",
    fillDelay: ".88s",
    gradient: "light",
  },
  {
    name: "K",
    className: "kgs-logo-layer kgs-logo-letter",
    path: "M112 88h34v49l58-49h49l-72 59 78 64h-51l-62-52v52h-34V88Z",
    delay: ".92s",
    duration: ".52s",
    fillDelay: "1.28s",
    gradient: "blue",
  },
  {
    name: "G",
    className: "kgs-logo-layer kgs-logo-letter",
    path: "M360 85c-59 0-96 27-96 65 0 40 39 67 96 67 31 0 60-10 78-29v-45h-81l-25 24h68v12c-10 7-23 10-38 10-35 0-59-15-59-39 0-23 23-38 57-38h87l28-27H360Z",
    delay: "1.36s",
    duration: ".54s",
    fillDelay: "1.72s",
    gradient: "blue",
  },
  {
    name: "S",
    className: "kgs-logo-layer kgs-logo-letter",
    path: "M483 85c-30 0-52 17-52 40 0 22 19 37 49 37h75c9 0 15 5 15 12s-7 13-18 13H446l-29 28h137c34 0 55-17 55-42 0-23-20-38-51-38h-72c-10 0-16-5-16-11 0-7 7-12 17-12h94l-27-27h-71Z",
    delay: "1.82s",
    duration: ".54s",
    fillDelay: "2.18s",
    gradient: "blue",
  },
  {
    name: "arrow",
    className: "kgs-logo-layer kgs-logo-arrow",
    path: "M405 104c71 5 129-14 170-49l-31-9 73-29-9 76-21-25c-47 42-105 54-182 36Z",
    delay: "2.28s",
    duration: ".58s",
    fillDelay: "2.68s",
    gradient: "green",
  },
] as const

export function AnimatedLogo({ className = "", title = "KGS logo" }: AnimatedLogoProps) {
  const rawId = useId()
  const id = rawId.replace(/:/g, "")
  const [animationKey, setAnimationKey] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updatePreference = () => setReducedMotion(media.matches)
    updatePreference()
    media.addEventListener("change", updatePreference)
    return () => media.removeEventListener("change", updatePreference)
  }, [])

  return (
    <span
      className={`kgs-animated-logo ${reducedMotion ? "kgs-logo-reduced" : ""} ${className}`}
      onMouseEnter={() => {
        if (!reducedMotion) setAnimationKey((key) => key + 1)
      }}
    >
      <svg
        key={animationKey}
        viewBox="0 0 640 260"
        role="img"
        aria-labelledby={`${id}-title`}
        className="block h-auto w-full overflow-visible"
      >
        <title id={`${id}-title`}>{title}</title>
        <defs>
          <linearGradient id={`${id}-blue`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0A5BD8" />
            <stop offset="1" stopColor="#4FC3F7" />
          </linearGradient>
          <linearGradient id={`${id}-light`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4FC3F7" />
            <stop offset="1" stopColor="#C8F1FF" />
          </linearGradient>
          <linearGradient id={`${id}-green`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#2E8B00" />
            <stop offset="1" stopColor="#7ED321" />
          </linearGradient>
          <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset=".5" stopColor="white" stopOpacity=".85" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id={`${id}-logo-mask`}>
            <g fill="white">
              {layers.map((layer) => <path key={layer.name} d={layer.path} />)}
            </g>
          </mask>
        </defs>

        {layers.map((layer) => (
          <path
            key={layer.name}
            pathLength="1"
            d={layer.path}
            className={layer.className}
            fill={`url(#${id}-${layer.gradient})`}
            stroke={layer.gradient === "green" ? "#2E8B00" : layer.gradient === "light" ? "#4FC3F7" : "#0A5BD8"}
            style={{
              "--draw-delay": layer.delay,
              "--draw-duration": layer.duration,
              "--fill-delay": layer.fillDelay,
            } as React.CSSProperties}
          />
        ))}

        <g mask={`url(#${id}-logo-mask)`} className="kgs-logo-shine">
          <rect x="-230" y="-80" width="110" height="430" fill={`url(#${id}-shine)`} transform="rotate(20 0 130)" />
        </g>
      </svg>

      <style>{`
        .kgs-animated-logo { display: inline-block; background: transparent; }
        .kgs-logo-layer {
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          fill-opacity: 0;
          animation:
            kgs-draw var(--draw-duration) ease-in-out var(--draw-delay) forwards,
            kgs-fill .32s ease-in-out var(--fill-delay) forwards;
        }
        .kgs-logo-outer { stroke-width: 4; }
        .kgs-logo-light { stroke-width: 3.5; }
        .kgs-logo-shine {
          opacity: 0;
          animation: kgs-shine 0.6s ease-in-out 2.9s forwards;
        }
        .kgs-logo-shine rect { animation: kgs-shine-move 0.6s ease-in-out 2.9s forwards; }
        @keyframes kgs-draw { to { stroke-dashoffset: 0; } }
        @keyframes kgs-fill { to { fill-opacity: 1; } }
        @keyframes kgs-shine { 0% { opacity: 0; } 20%, 80% { opacity: .75; } 100% { opacity: 0; } }
        @keyframes kgs-shine-move { from { transform: translateX(0) rotate(20deg); } to { transform: translateX(980px) rotate(20deg); } }
        .kgs-logo-reduced .kgs-logo-layer { animation: none; stroke-dashoffset: 0; fill-opacity: 1; }
        .kgs-logo-reduced .kgs-logo-shine { display: none; }
        @media (prefers-reduced-motion: reduce) {
          .kgs-logo-layer { animation: none; stroke-dashoffset: 0; fill-opacity: 1; }
          .kgs-logo-shine { display: none; }
        }
      `}</style>
    </span>
  )
}
