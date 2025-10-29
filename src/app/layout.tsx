import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
