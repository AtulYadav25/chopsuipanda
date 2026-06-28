interface LoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
}

export default function LoadingSpinner({
  fullScreen = false,
  message = "Built For $SUI With Builder Love",
}: LoadingSpinnerProps) {
  const containerClasses = fullScreen
    ? "h-screen flex items-center justify-center bg-[#070B14]"
    : "flex items-center justify-center min-h-screen bg-[#070B14]";

  return (
    <div className={containerClasses}>
      <style>{`
        @keyframes core-breathe {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 14px rgba(41,141,255,0.55)) drop-shadow(0 0 28px rgba(41,141,255,0.3)); }
          50% { transform: scale(1.06); filter: drop-shadow(0 0 22px rgba(127,207,255,0.75)) drop-shadow(0 0 44px rgba(41,141,255,0.45)); }
        }
        @keyframes ring-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ring-spin-rev {
          to { transform: rotate(-360deg); }
        }
        @keyframes particle-rise {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.5; }
          100% { transform: translateY(-46px) scale(1); opacity: 0; }
        }
        @keyframes aura-pulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
        .lp-particle {
          animation: particle-rise 3.2s ease-in infinite;
        }
      `}</style>

      <div className="flex flex-col items-center gap-7">
        {/* Core stage */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* outer ambient aura */}
          <div
            className="absolute w-32 h-32 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(41,141,255,0.22) 0%, rgba(91,108,255,0.10) 45%, transparent 75%)",
              animation: "aura-pulse 3.6s ease-in-out infinite",
            }}
          />

          {/* rising ambient particles */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (i / 6) * 360;
            const delay = i * 0.55;
            const radius = 38;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            return (
              <span
                key={i}
                className="lp-particle absolute rounded-full"
                style={{
                  width: 3,
                  height: 3,
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  background: "#9FD9FF",
                  boxShadow: "0 0 6px 1px rgba(127,207,255,0.9)",
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}

          {/* outer orbit ring (loading indicator) */}
          <svg
            className="absolute w-28 h-28"
            style={{ animation: "ring-spin 2s linear infinite" }}
            viewBox="0 0 100 100"
          >
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(41,141,255,0.15)" strokeWidth="2" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#7FCFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="40 218"
              style={{ filter: "drop-shadow(0 0 4px #7FCFFF)" }}
            />
          </svg>

          {/* inner counter-rotating dashed ring */}
          <svg
            className="absolute w-20 h-20"
            style={{ animation: "ring-spin-rev 3.4s linear infinite" }}
            viewBox="0 0 100 100"
          >
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(91,108,255,0.35)" strokeWidth="1.5" strokeDasharray="3 9" />
          </svg>

          {/* glowing droplet core */}
          <svg
            viewBox="0 0 783 1000"
            className="relative w-12 h-12"
            style={{ animation: "core-breathe 2.8s ease-in-out infinite" }}
          >
            <defs>
              <linearGradient id="sui-core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#BFE6FF" />
                <stop offset="45%" stopColor="#5BAEFF" />
                <stop offset="100%" stopColor="#1E6FE0" />
              </linearGradient>
            </defs>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M626.027 417.029C666.817 468.244 691.209 533.014 691.209 603.469C691.209 673.925 666.076 740.673 624.214 792.176L620.588 796.626L619.641 790.981C618.817 786.201 617.869 781.34 616.757 776.478C595.785 684.349 527.471 605.365 415.03 541.378C339.095 498.28 295.626 446.448 284.213 387.487C276.838 349.375 282.318 311.098 292.907 278.301C303.496 245.545 319.235 218.063 332.626 201.541L376.383 148.06C384.046 138.666 398.426 138.666 406.09 148.06L626.068 417.029H626.027ZM695.206 363.59L402.01 5.12968C396.407 -1.70989 385.942 -1.70989 380.338 5.12968L87.184 363.59L86.2363 364.784C32.3026 431.738 0 516.821 0 609.444C0 825.138 175.151 1000 391.174 1000C607.198 1000 782.349 825.138 782.349 609.444C782.349 516.821 750.046 431.738 696.112 364.826L695.165 363.631L695.206 363.59ZM157.351 415.876L183.556 383.779L184.339 389.712C184.957 394.409 185.74 399.106 186.646 403.844C203.622 492.883 264.23 567.088 365.546 624.565C453.637 674.708 504.934 732.35 519.684 795.554C525.864 821.924 526.936 847.881 524.258 870.584L524.093 871.985L522.816 872.603C483.055 892.009 438.351 902.927 391.133 902.927C225.459 902.927 91.1394 768.855 91.1394 603.428C91.1394 532.396 115.902 467.172 157.269 415.793L157.351 415.876Z"
              fill="url(#sui-core-grad)"
            />
          </svg>
        </div>

        {/* message */}
        <p
          className="text-sm tracking-wide text-center"
          style={{ color: "#A9C7E8", letterSpacing: "0.04em" }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}