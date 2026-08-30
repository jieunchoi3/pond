import type { Metadata } from "next";
import { Inria_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inria = Inria_Serif({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-inria",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pond",
  description: "Throw a spark in the water. Fish it out later.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${inria.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-surface font-sans text-ink">{children}</body>
    </html>
  );
}
