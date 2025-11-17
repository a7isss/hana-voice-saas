'use client';

import { useEffect, useState, useRef } from "react";

export const AlienRobot = () => {
  const [eyePosition, setEyePosition] = useState({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } });
  const robotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!robotRef.current) return;

      const rect = robotRef.current.getBoundingClientRect();
      const robotCenterX = rect.left + rect.width / 2;
      const robotCenterY = rect.top + rect.height / 2;

      // Calculate angle for left eye
      const leftEyeX = robotCenterX - 40;
      const leftEyeY = robotCenterY - 20;
      const leftAngle = Math.atan2(e.clientY - leftEyeY, e.clientX - leftEyeX);
      const leftDistance = Math.min(8, Math.hypot(e.clientX - leftEyeX, e.clientY - leftEyeY) / 50);

      // Calculate angle for right eye
      const rightEyeX = robotCenterX + 40;
      const rightEyeY = robotCenterY - 20;
      const rightAngle = Math.atan2(e.clientY - rightEyeY, e.clientX - rightEyeX);
      const rightDistance = Math.min(8, Math.hypot(e.clientX - rightEyeX, e.clientY - rightEyeY) / 50);

      setEyePosition({
        left: {
          x: Math.cos(leftAngle) * leftDistance,
          y: Math.sin(leftAngle) * leftDistance,
        },
        right: {
          x: Math.cos(rightAngle) * rightDistance,
          y: Math.sin(rightAngle) * rightDistance,
        },
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={robotRef} className="relative w-64 h-80">
      <svg
        viewBox="0 0 200 250"
        className="w-full h-full drop-shadow-2xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Antenna */}
        <g className="animate-bounce" style={{ animationDuration: '3s' }}>
          <line x1="100" y1="20" x2="100" y2="5" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="5" r="5" fill="#60A5FA" className="animate-pulse" />
        </g>

        {/* Head */}
        <ellipse cx="100" cy="80" rx="70" ry="60" fill="#1E40AF" opacity="0.9" />
        <ellipse cx="100" cy="80" rx="65" ry="55" fill="#1F2937" />

        {/* Head shine */}
        <ellipse cx="85" cy="60" rx="20" ry="15" fill="#3B82F6" opacity="0.3" />

        {/* Eyes (white part) */}
        <circle cx="70" cy="75" r="18" fill="#F3F4F6" />
        <circle cx="130" cy="75" r="18" fill="#F3F4F6" />

        {/* Pupils that follow mouse */}
        <circle
          cx={70 + eyePosition.left.x}
          cy={75 + eyePosition.left.y}
          r="8"
          fill="#3B82F6"
          className="transition-all duration-100"
        />
        <circle
          cx={130 + eyePosition.right.x}
          cy={75 + eyePosition.right.y}
          r="8"
          fill="#3B82F6"
          className="transition-all duration-100"
        />

        {/* Pupil highlights */}
        <circle
          cx={70 + eyePosition.left.x - 2}
          cy={75 + eyePosition.left.y - 2}
          r="3"
          fill="#FFFFFF"
          opacity="0.8"
        />
        <circle
          cx={130 + eyePosition.right.x - 2}
          cy={75 + eyePosition.right.y - 2}
          r="3"
          fill="#FFFFFF"
          opacity="0.8"
        />

        {/* Mouth */}
        <path
          d="M 75 100 Q 100 110 125 100"
          stroke="#3B82F6"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Body */}
        <rect x="60" y="125" width="80" height="70" rx="15" fill="#1E40AF" opacity="0.9" />
        <rect x="65" y="130" width="70" height="60" rx="12" fill="#1F2937" />

        {/* Chest panel */}
        <rect x="85" y="145" width="30" height="30" rx="5" fill="#374151" />
        <circle cx="100" cy="160" r="8" fill="#3B82F6" className="animate-pulse" />

        {/* Arms */}
        <g>
          <rect x="30" y="140" width="25" height="50" rx="12" fill="#1E40AF" opacity="0.9" />
          <rect x="33" y="143" width="19" height="44" rx="9" fill="#1F2937" />
        </g>
        <g>
          <rect x="145" y="140" width="25" height="50" rx="12" fill="#1E40AF" opacity="0.9" />
          <rect x="148" y="143" width="19" height="44" rx="9" fill="#1F2937" />
        </g>

        {/* Body details */}
        <circle cx="75" cy="150" r="3" fill="#3B82F6" opacity="0.5" />
        <circle cx="125" cy="150" r="3" fill="#3B82F6" opacity="0.5" />
        <circle cx="75" cy="180" r="3" fill="#60A5FA" opacity="0.5" />
        <circle cx="125" cy="180" r="3" fill="#60A5FA" opacity="0.5" />
      </svg>

      {/* Glow effect under robot */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-blue-500/30 rounded-full blur-xl animate-pulse" />
    </div>
  );
};

export default AlienRobot;
