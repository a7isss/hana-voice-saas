import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import "./globals.css";

// Layout paths that should use full-width (no sidebar)
const FULL_WIDTH_PATHS = ['/'];

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if current path should be full-width (for auth pages and root)
  const isFullWidth = true; // For now, make root full-width

  if (isFullWidth) {
    // Full-width layout for landing page and auth pages
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

  // Admin layout with sidebar for other pages
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ThemeProvider>
          <SidebarProvider>
            <div className="min-h-screen xl:flex">
              {/* Sidebar and Backdrop */}
              <AppSidebar />
              <Backdrop />
              {/* Main Content Area */}
              <div className="flex-1 transition-all duration-300 ease-in-out lg:ml-[90px] xl:ml-[290px]">
                {/* Header */}
                <AppHeader />
                {/* Page Content */}
                <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
                  {children}
                </div>
              </div>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
