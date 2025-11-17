import { ThemeProvider } from "@/context/ThemeContext";
import React from "react";

export default function FullWidthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Full-width layout for landing page and auth pages
  return (
    <ThemeProvider>
      <div className="min-h-screen">{children}</div>
    </ThemeProvider>
  );
}
