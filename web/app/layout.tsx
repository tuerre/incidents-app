import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/providers/theme-providers"
import { ActiveThemeProvider } from "@/components/active-theme";
import { Toaster } from "sileo"
import "sileo/styles.css"
import { cookies } from "next/headers";
import { cn } from "@/lib/utils";

const META_THEME_COLORS = {
  light: "#F0F0F0",
  dark: "#09090b"
}

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Panel de Administración | Amanera",
  description: "Hotel incidents management mobile and web app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;

}>) {

  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value || 'light'
  const isScaled = activeThemeValue?.endsWith('-scaled')

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn(
        poppins.className,
        "antialiased bg-background overscroll-none",
        activeThemeValue ? `theme-${activeThemeValue}` : '',
        isScaled && 'theme-scaled',
      )}>
        <TooltipProvider >
          <ThemeProvider attribute="class" defaultTheme={activeThemeValue} enableSystem disableTransitionOnChange enableColorScheme>
            <ActiveThemeProvider initialTheme={activeThemeValue}>
              {children}
            </ActiveThemeProvider>
            <Toaster />
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
