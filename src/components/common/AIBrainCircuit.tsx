import React, { useMemo } from 'react';

type ColorTheme = 'coral' | 'blue' | 'purple';

interface AIBrainCircuitProps {
  /**
   * Color theme for the component
   * - 'coral': Warm coral/salmon red (default, matches original design)
   * - 'blue': Cool electric blue
   * - 'purple': Deep purple/violet
   */
  theme?: ColorTheme;
  /**
   * Size of the component in pixels
   * @default 400
   */
  size?: number;
  /**
   * Animation speed multiplier (1 = normal, 0.5 = slow, 2 = fast)
   * @default 1
   */
  animationSpeed?: number;
}

const AIBrainCircuit: React.FC<AIBrainCircuitProps> = ({
  theme = 'coral',
  size = 400,
  animationSpeed = 1,
}) => {
  // Color palettes for each theme
  const colorPalettes = {
    coral: {
      primary: '#C85A54',
      secondary: '#D97A6E',
      background: '#F5F0E8',
      accent: '#E8A89A',
    },
    blue: {
      primary: '#2563EB',
      secondary: '#3B82F6',
      background: '#F0F4FF',
      accent: '#60A5FA',
    },
    purple: {
      primary: '#7C3AED',
      secondary: '#A855F7',
      background: '#F5F3FF',
      accent: '#D8B4FE',
    },
  };

  const colors = colorPalettes[theme];

  // Generate animation keyframes dynamically
  const animationId = useMemo(() => `pulse-${theme}-${Math.random().toString(36).substr(2, 9)}`, [theme]);

  const pulseAnimationDuration = 2 / animationSpeed;

  return (
    <div style={{ display: 'inline-block', width: size, height: size }}>
      <style>{`
        @keyframes ${animationId}-pulse {
          0% {
            opacity: 0.6;
            stroke-width: 1.5;
          }
          50% {
            opacity: 1;
            stroke-width: 2.5;
          }
          100% {
            opacity: 0.6;
            stroke-width: 1.5;
          }
        }

        @keyframes ${animationId}-pulse-nodes {
          0% {
            r: 3;
            opacity: 0.7;
          }
          50% {
            r: 5;
            opacity: 1;
          }
          100% {
            r: 3;
            opacity: 0.7;
          }
        }

        @keyframes ${animationId}-pulse-glow {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            opacity: 0;
          }
        }

        .${animationId}-animated-line {
          animation: ${animationId}-pulse ${pulseAnimationDuration}s ease-in-out infinite;
        }

        .${animationId}-animated-node {
          animation: ${animationId}-pulse-nodes ${pulseAnimationDuration}s ease-in-out infinite;
        }

        .${animationId}-glow {
          animation: ${animationId}-pulse-glow ${pulseAnimationDuration}s ease-in-out infinite;
        }
      `}
      </style>

      <svg
        viewBox="0 0 1000 600"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: colors.background,
          borderRadius: '8px',
        }}
      >
        {/* Left side: Input waves */}
        <g>
          {/* Wave 1 */}
          <path
            d="M 50 80 Q 100 60, 150 80 T 250 80"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className={`${animationId}-animated-line`}
          />
          <circle cx="250" cy="80" r="4" fill={colors.primary} className={`${animationId}-animated-node`} />

          {/* Wave 2 */}
          <path
            d="M 50 180 Q 100 160, 150 180 T 250 180"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className={`${animationId}-animated-line`}
            style={{ animationDelay: `${-0.2 / animationSpeed}s` }}
          />
          <circle cx="250" cy="180" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.2 / animationSpeed}s` }} />

          {/* Wave 3 */}
          <path
            d="M 50 280 Q 100 260, 150 280 T 250 280"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className={`${animationId}-animated-line`}
            style={{ animationDelay: `${-0.4 / animationSpeed}s` }}
          />
          <circle cx="250" cy="280" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.4 / animationSpeed}s` }} />

          {/* Wave 4 */}
          <path
            d="M 50 380 Q 100 360, 150 380 T 250 380"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className={`${animationId}-animated-line`}
            style={{ animationDelay: `${-0.6 / animationSpeed}s` }}
          />
          <circle cx="250" cy="380" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.6 / animationSpeed}s` }} />

          {/* Wave 5 */}
          <path
            d="M 50 480 Q 100 460, 150 480 T 250 480"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className={`${animationId}-animated-line`}
            style={{ animationDelay: `${-0.8 / animationSpeed}s` }}
          />
          <circle cx="250" cy="480" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.8 / animationSpeed}s` }} />
        </g>

        {/* Center: Brain illustration */}
        <g>
          {/* Brain outline - simplified stylized brain */}
          <ellipse cx="380" cy="250" rx="70" ry="90" stroke={colors.primary} strokeWidth="2.5" fill="none" />

          {/* Brain convolutions */}
          <path
            d="M 330 200 Q 340 190, 350 200 Q 360 210, 370 200"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 320 240 Q 330 230, 340 240 Q 350 250, 360 240"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 330 280 Q 340 270, 350 280 Q 360 290, 370 280"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 340 320 Q 350 310, 360 320 Q 370 330, 380 320"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Right side of brain */}
          <path
            d="M 430 200 Q 420 190, 410 200 Q 400 210, 390 200"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 440 240 Q 430 230, 420 240 Q 410 250, 400 240"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 430 280 Q 420 270, 410 280 Q 400 290, 390 280"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 420 320 Q 410 310, 400 320 Q 390 330, 380 320"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Binary code in brain */}
          <text
            x="380"
            y="200"
            textAnchor="middle"
            fontSize="10"
            fill={colors.secondary}
            opacity="0.6"
            fontFamily="monospace"
            fontWeight="bold"
          >
            1010
          </text>
          <text
            x="380"
            y="230"
            textAnchor="middle"
            fontSize="9"
            fill={colors.secondary}
            opacity="0.6"
            fontFamily="monospace"
            fontWeight="bold"
          >
            0110
          </text>
          <text
            x="380"
            y="260"
            textAnchor="middle"
            fontSize="9"
            fill={colors.secondary}
            opacity="0.6"
            fontFamily="monospace"
            fontWeight="bold"
          >
            1001
          </text>
          <text
            x="380"
            y="290"
            textAnchor="middle"
            fontSize="9"
            fill={colors.secondary}
            opacity="0.6"
            fontFamily="monospace"
            fontWeight="bold"
          >
            0101
          </text>
          <text
            x="380"
            y="320"
            textAnchor="middle"
            fontSize="10"
            fill={colors.secondary}
            opacity="0.6"
            fontFamily="monospace"
            fontWeight="bold"
          >
            1100
          </text>
        </g>

        {/* Center to right: Connection lines with binary */}
        <g>
          {/* Main connection paths */}
          <path
            d="M 450 150 L 520 120"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className={`${animationId}-animated-line`}
          />
          <path
            d="M 450 220 L 520 200"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className={`${animationId}-animated-line`}
            style={{ animationDelay: `${-0.15 / animationSpeed}s` }}
          />
          <path
            d="M 450 280 L 520 300"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className={`${animationId}-animated-line`}
            style={{ animationDelay: `${-0.3 / animationSpeed}s` }}
          />
          <path
            d="M 450 350 L 520 380"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className={`${animationId}-animated-line`}
            style={{ animationDelay: `${-0.45 / animationSpeed}s` }}
          />

          {/* Binary code text in transition zone */}
          <text
            x="480"
            y="160"
            fontSize="8"
            fill={colors.secondary}
            opacity="0.5"
            fontFamily="monospace"
            fontWeight="bold"
          >
            01
          </text>
          <text
            x="490"
            y="250"
            fontSize="8"
            fill={colors.secondary}
            opacity="0.5"
            fontFamily="monospace"
            fontWeight="bold"
          >
            10
          </text>
          <text
            x="480"
            y="340"
            fontSize="8"
            fill={colors.secondary}
            opacity="0.5"
            fontFamily="monospace"
            fontWeight="bold"
          >
            11
          </text>
        </g>

        {/* Right side: Circuit board */}
        <g>
          {/* Vertical lines */}
          <line x1="550" y1="50" x2="550" y2="150" stroke={colors.primary} strokeWidth="2" className={`${animationId}-animated-line`} />
          <circle cx="550" cy="100" r="4" fill={colors.primary} className={`${animationId}-animated-node`} />

          <line x1="600" y1="80" x2="600" y2="180" stroke={colors.primary} strokeWidth="2" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.2 / animationSpeed}s` }} />
          <circle cx="600" cy="130" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.2 / animationSpeed}s` }} />

          <line x1="650" y1="60" x2="650" y2="160" stroke={colors.primary} strokeWidth="2" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.1 / animationSpeed}s` }} />
          <circle cx="650" cy="110" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.1 / animationSpeed}s` }} />

          {/* Horizontal connections - top row */}
          <path
            d="M 550 100 L 600 100 L 600 130 L 650 130"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            className={`${animationId}-animated-line`}
            style={{ animationDelay: `${-0.25 / animationSpeed}s` }}
          />

          {/* Output nodes - top */}
          <circle cx="700" cy="80" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.3 / animationSpeed}s` }} />
          <circle cx="720" cy="100" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.35 / animationSpeed}s` }} />
          <circle cx="740" cy="120" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.4 / animationSpeed}s` }} />

          {/* Lines to output nodes - top */}
          <line x1="650" y1="110" x2="700" y2="80" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.3 / animationSpeed}s` }} />
          <line x1="650" y1="130" x2="720" y2="100" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.35 / animationSpeed}s` }} />
          <line x1="650" y1="150" x2="740" y2="120" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.4 / animationSpeed}s` }} />

          {/* Middle section */}
          <line x1="550" y1="280" x2="550" y2="380" stroke={colors.primary} strokeWidth="2" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.5 / animationSpeed}s` }} />
          <circle cx="550" cy="330" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.5 / animationSpeed}s` }} />

          <line x1="600" y1="250" x2="600" y2="350" stroke={colors.primary} strokeWidth="2" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.6 / animationSpeed}s` }} />
          <circle cx="600" cy="300" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.6 / animationSpeed}s` }} />

          <line x1="650" y1="270" x2="650" y2="370" stroke={colors.primary} strokeWidth="2" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.55 / animationSpeed}s` }} />
          <circle cx="650" cy="320" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.55 / animationSpeed}s` }} />

          {/* Output nodes - middle */}
          <circle cx="700" cy="280" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.65 / animationSpeed}s` }} />
          <circle cx="720" cy="300" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.7 / animationSpeed}s` }} />
          <circle cx="740" cy="320" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.75 / animationSpeed}s` }} />

          {/* Lines to output nodes - middle */}
          <line x1="650" y1="320" x2="700" y2="280" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.65 / animationSpeed}s` }} />
          <line x1="650" y1="340" x2="720" y2="300" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.7 / animationSpeed}s` }} />
          <line x1="650" y1="360" x2="740" y2="320" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.75 / animationSpeed}s` }} />

          {/* Bottom section */}
          <line x1="550" y1="450" x2="550" y2="550" stroke={colors.primary} strokeWidth="2" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.8 / animationSpeed}s` }} />
          <circle cx="550" cy="500" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.8 / animationSpeed}s` }} />

          <line x1="600" y1="420" x2="600" y2="520" stroke={colors.primary} strokeWidth="2" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.9 / animationSpeed}s` }} />
          <circle cx="600" cy="470" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.9 / animationSpeed}s` }} />

          <line x1="650" y1="440" x2="650" y2="540" stroke={colors.primary} strokeWidth="2" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.85 / animationSpeed}s` }} />
          <circle cx="650" cy="490" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.85 / animationSpeed}s` }} />

          {/* Output nodes - bottom */}
          <circle cx="700" cy="460" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.95 / animationSpeed}s` }} />
          <circle cx="720" cy="480" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-1.0 / animationSpeed}s` }} />
          <circle cx="740" cy="500" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-1.05 / animationSpeed}s` }} />

          {/* Lines to output nodes - bottom */}
          <line x1="650" y1="490" x2="700" y2="460" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.95 / animationSpeed}s` }} />
          <line x1="650" y1="510" x2="720" y2="480" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-1.0 / animationSpeed}s` }} />
          <line x1="650" y1="530" x2="740" y2="500" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-1.05 / animationSpeed}s` }} />

          {/* Final output lines */}
          <line x1="700" y1="80" x2="800" y2="60" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.3 / animationSpeed}s` }} />
          <line x1="720" y1="100" x2="800" y2="100" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.35 / animationSpeed}s` }} />
          <line x1="740" y1="120" x2="800" y2="140" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.4 / animationSpeed}s` }} />

          <line x1="700" y1="280" x2="800" y2="260" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.65 / animationSpeed}s` }} />
          <line x1="720" y1="300" x2="800" y2="300" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.7 / animationSpeed}s` }} />
          <line x1="740" y1="320" x2="800" y2="340" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.75 / animationSpeed}s` }} />

          <line x1="700" y1="460" x2="800" y2="440" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-0.95 / animationSpeed}s` }} />
          <line x1="720" y1="480" x2="800" y2="480" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-1.0 / animationSpeed}s` }} />
          <line x1="740" y1="500" x2="800" y2="520" stroke={colors.primary} strokeWidth="1.5" className={`${animationId}-animated-line`} style={{ animationDelay: `${-1.05 / animationSpeed}s` }} />

          {/* Final output nodes */}
          <circle cx="800" cy="60" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.3 / animationSpeed}s` }} />
          <circle cx="800" cy="100" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.35 / animationSpeed}s` }} />
          <circle cx="800" cy="140" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.4 / animationSpeed}s` }} />
          <circle cx="800" cy="260" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.65 / animationSpeed}s` }} />
          <circle cx="800" cy="300" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.7 / animationSpeed}s` }} />
          <circle cx="800" cy="340" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.75 / animationSpeed}s` }} />
          <circle cx="800" cy="440" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-0.95 / animationSpeed}s` }} />
          <circle cx="800" cy="480" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-1.0 / animationSpeed}s` }} />
          <circle cx="800" cy="520" r="4" fill={colors.primary} className={`${animationId}-animated-node`} style={{ animationDelay: `${-1.05 / animationSpeed}s` }} />
        </g>
      </svg>
    </div>
  );
};

export default AIBrainCircuit;
