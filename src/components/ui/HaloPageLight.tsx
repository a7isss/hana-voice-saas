import React, { useEffect, useRef } from "react";

type HaloProps = {
  radius?: number;       // halo radius
  intensity?: number;    // brightness multiplier
};

export default function HaloPageLight({
  radius = 180,
  intensity = 1.4
}: HaloProps) {

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const move = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      el.style.setProperty("--x", `${x}px`);
      el.style.setProperty("--y", `${y}px`);
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 99999,
        mixBlendMode: "screen",

        // CSS Variables
        "--radius": `${radius}px`,
        "--intensity": intensity.toString(),

        // Brightening effect + halo mask following cursor
        background:
          `radial-gradient(
            circle var(--radius) at var(--x) var(--y),
            rgba(255,255,255, var(--intensity)) 0%,
            rgba(255,255,255, 0.0) 70%
          )`
      } as React.CSSProperties}
    />
  );
}
