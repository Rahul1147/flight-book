import type { Metadata } from "next";
import { Geist, Manrope } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

const heading = Geist({ subsets: ["latin"], variable: "--font-heading" });

const body = Manrope({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Flight Booker",
  description: "Professional flight booking platform for users, airport managers, and admins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(heading.variable, body.variable)}>
      <body className={cn(body.className, "font-sans")}>
        <Navbar />
        <main className="min-h-[calc(100dvh-4.5rem)] px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </body>
    </html>
  );
}