import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PlayAdda - Online Sports Betting & Casino",
  description:
    "Your ultimate destination for sports betting, live casino, and online gaming. Get 500% joining bonus and play Cricket, Football, Tennis, and more.",
  keywords: [
    "sports betting",
    "online casino",
    "cricket betting",
    "football betting",
    "live betting",
    "PlayAdda",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
