import type React from "react"
import type { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { APP_CONFIG } from "@/lib/config"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "PixoraTools - Every tool you could want to edit images in bulk",
  description:
    "Your online photo editor is here and forever free! Compress, resize, crop, convert images and more with 300+ professional tools.",
  generator: "PixoraTools",
  keywords: "image tools, pdf tools, qr generator, online tools, photo editor, image converter, pdf merger, compress image, resize image, crop image, convert image, background remover, web tools, free tools",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#3b82f6",
  openGraph: {
    title: "PixoraTools - Professional Online Tools Platform",
    description: "300+ professional web tools for PDF, image, QR, code, and SEO tasks. Fast, secure, and free.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PixoraTools - Professional Online Tools",
    description: "300+ professional web tools for PDF, image, QR, code, and SEO tasks.",
  },
  verification: {
    google: "your-google-verification-code-here",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      {APP_CONFIG.enableAds && APP_CONFIG.adsensePublisherId && (
        <head>
          <meta name="google-adsense-account" content={APP_CONFIG.adsensePublisherId} />
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${APP_CONFIG.adsensePublisherId}`}
            crossOrigin="anonymous"
          />
        </head>
      )}
      <body className={`${inter.variable} ${poppins.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}