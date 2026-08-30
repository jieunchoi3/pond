import type { Metadata } from "next";
import { Indie_Flower, Inria_Serif, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inria = Inria_Serif({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-inria",
  display: "swap",
});

const indie = Indie_Flower({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-indie",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-inter",
  display: "swap",
});

const fortyTwoDot = localFont({
  src: "./fonts/42dot-sans.woff2",
  variable: "--font-42dot",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Pond",
  description: "Throw a spark in the water. Fish it out later.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${inria.variable} ${indie.variable} ${inter.variable} ${fortyTwoDot.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-water-1 font-sans text-ink">{children}</body>
    </html>
  );
}
