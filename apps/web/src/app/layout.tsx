import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Providers } from "../components/providers";
import "./globals.css";

const outfitSans = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "RezumerAI",
  description: "AI-powered resume builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${outfitSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
