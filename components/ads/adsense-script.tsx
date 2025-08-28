"use client"

import Script from "next/script"
import { useEffect } from "react"

interface AdSenseScriptProps {
  publisherId: string
  enableAutoAds?: boolean
}

export function AdSenseScript({ publisherId, enableAutoAds = true }: AdSenseScriptProps) {
  useEffect(() => {
    // Initialize AdSense after script loads
    if (typeof window !== "undefined" && enableAutoAds) {
      try {
        (window as any).adsbygoogle = (window as any).adsbygoogle || []
        ;(window as any).adsbygoogle.push({
          google_ad_client: publisherId,
          enable_page_level_ads: true,
          overlays: { bottom: true }
        })
      } catch (error) {
        console.warn("AdSense initialization failed:", error)
      }
    }
  }, [publisherId, enableAutoAds])

  return (
    <>
      <Script
        id="adsense-script"
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
        onError={(e) => {
          console.warn("AdSense script failed to load:", e)
        }}
      />
      
      {/* Funding Choices (CMP) Script for GDPR compliance */}
      <Script
        id="funding-choices"
        src={`https://fundingchoicesmessages.google.com/i/${publisherId.replace('ca-pub-', '')}?ers=1`}
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== "undefined") {
            (window as any).googlefc = (window as any).googlefc || {}
            ;(window as any).googlefc.callbackQueue = (window as any).googlefc.callbackQueue || []
          }
        }}
      />
    </>
  )
}