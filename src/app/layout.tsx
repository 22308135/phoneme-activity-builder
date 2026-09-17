import type { Metadata } from "next";
import { PreferenceProvider } from "@/components/PreferenceProvider";
import { UsageTracker } from "@/components/UsageTracker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phoneme Play Builder",
  description: "A classroom activity builder for Speech Pathology teachers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><PreferenceProvider><UsageTracker />{children}</PreferenceProvider></body>
    </html>
  );
}
