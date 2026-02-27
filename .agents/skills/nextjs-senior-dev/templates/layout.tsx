// @ts-nocheck
/**
 * Next.js Root Layout Template (App Router)
 *
 * STYLING: This template is styling-agnostic.
 * Configure your preferred styling solution:
 *
 * TAILWIND:
 *   import "./globals.css"
 *   <body className="min-h-screen bg-background">
 *
 * MUI:
 *   import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter"
 *   import { ThemeProvider } from "@mui/material/styles"
 *   import CssBaseline from "@mui/material/CssBaseline"
 *   <AppRouterCacheProvider>
 *     <ThemeProvider theme={theme}>
 *       <CssBaseline />
 *       {children}
 *     </ThemeProvider>
 *   </AppRouterCacheProvider>
 *
 * CSS MODULES:
 *   import styles from "./layout.module.css"
 *   <body className={styles.body}>
 *
 * FONTS:
 *   import { Inter } from "next/font/google"
 *   const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
 *   <html className={inter.variable}>
 */

import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: {
    default: "App Name",
    template: "%s | App Name",
  },
  description: "App description",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
}

interface LayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body>
        {/*
         * Add your providers here:
         * - Auth: <SessionProvider>
         * - Theme: <ThemeProvider>
         * - State: <QueryClientProvider>
         * - i18n: <NextIntlClientProvider>
         */}

        {/* Navigation component */}
        <header>{/* <Navbar /> */}</header>

        {/* Main content */}
        <main>{children}</main>

        {/* Footer component */}
        <footer>{/* <Footer /> */}</footer>
      </body>
    </html>
  )
}