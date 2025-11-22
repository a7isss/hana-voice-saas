import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
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
          <AuthProvider>
            <div className="min-h-screen">{children}</div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
