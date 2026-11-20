import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { Fraunces, Source_Sans_3 } from "next/font/google"
import "./globals.css"

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
})

export const metadata: Metadata = {
  title: "Hawa Saathi — urban air quality assistant",
  description:
    "A persona-aware air assistant for Indian cities. It reads live PM2.5, maps a CPCB-style band, and tells you whether to go out, limit time, or stay in.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#eef4f6",
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en-IN"
      className={`${sourceSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  )
}
