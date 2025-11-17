import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Root layout for all pages - only provides global providers
  // Individual route groups will handle their own layouts
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-gray-50">
        <ThemeProvider>
          <div className="min-h-screen">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
