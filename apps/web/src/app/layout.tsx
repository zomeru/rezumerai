import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { Providers } from "../components/providers";
import "./globals.css";
import type { NextFontWithVariable } from "next/dist/compiled/@next/font";

const outfitSans: NextFontWithVariable = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap", // Improve font loading performance
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Rezumer - AI-Powered Resume Builder",
    template: "%s | Rezumer",
  },
  description:
    "Create professional, ATS-friendly resumes with AI assistance. Build, customize, and download your resume in minutes.",
  keywords: ["resume builder", "AI resume", "CV builder", "ATS resume", "professional resume", "job application"],
  authors: [{ name: "Rezumer Team" }],
  creator: "Rezumer",
  publisher: "Rezumer",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rezumer.ai",
    siteName: "Rezumer",
    title: "Rezumer - AI-Powered Resume Builder",
    description: "Create professional, ATS-friendly resumes with AI assistance.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rezumer - AI-Powered Resume Builder",
    description: "Create professional, ATS-friendly resumes with AI assistance.",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

/**
 * RootLayout is the main layout component for the application.
 * It sets up global styles, fonts, metadata, and wraps the application with necessary providers.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${outfitSans.variable} antialiased`} suppressHydrationWarning={true}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
