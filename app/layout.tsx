import type { Metadata } from "next";
import { Asta_Sans, Inria_Serif, Inter } from "next/font/google";
import { ALL_DECOR_SRCS } from "@/lib/notes/decor";
import "./globals.css";

const inria = Inria_Serif({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-inria",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-inter",
  display: "swap",
});

/** Asta Sans is 42dot Sans renamed on Google Fonts. Hangul still comes from /fonts/42dot-sans.woff2. */
const fortyTwoDot = Asta_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-42dot",
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
      className={`${inria.variable} ${inter.variable} ${fortyTwoDot.variable} h-full antialiased`}
    >
      <head>
        {ALL_DECOR_SRCS.map((src) => (
          <link key={src} rel="preload" as="image" href={src} fetchPriority="high" />
        ))}
      </head>
      <body className="min-h-full bg-water-1 font-sans text-ink">{children}</body>
    </html>
  );
}
