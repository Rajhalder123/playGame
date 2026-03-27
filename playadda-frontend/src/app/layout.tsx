import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PlayAdda - Online Sports Betting & Casino",
  description:
    "Your ultimate destination for sports betting, live casino, and online gaming. Get 500% joining bonus and play Cricket, Football, Tennis, and more.",
  keywords: ["sports betting", "online casino", "cricket betting", "football betting", "live betting", "PlayAdda"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "#0f2b1a",
                color: "#fff",
                border: "1px solid #1e4d2b",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
              },
              success: { iconTheme: { primary: "#c6ff00", secondary: "#0f2b1a" } },
              error: { iconTheme: { primary: "#f44336", secondary: "#fff" } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
