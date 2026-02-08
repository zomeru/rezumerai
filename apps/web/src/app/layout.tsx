import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Providers } from "../components/providers";
import "./globals.css";
import type { NextFontWithVariable } from "next/dist/compiled/@next/font";

const outfitSans: NextFontWithVariable = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Rezumer",
  description: "AI-powered resume builder",
};

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
