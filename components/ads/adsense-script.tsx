"use client"

import Script from "next/script"
import { useEffect, useState } from "react"
import { APP_CONFIG } from "@/lib/config"

interface AdSenseScriptProps {
  publisherId: string
  enableAutoAds?: boolean
}

export function AdSenseScript({ publisherId, enableAutoAds = true }: AdSenseScriptProps) {
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    // Only initialize once and if ads are enabled
    if (typeof window !== "undefined" && enableAutoAds && APP_CONFIG.enableAds && !hasInitialized) {
      try {
        (window as any).adsbygoogle = (window as any).adsbygoogle || []
        
        // Only push page level ads once per page
        if (!(window as any).pageAdsInitialized) {
          ;(window as any).adsbygoogle.push({
            google_ad_client: publisherId,
            enable_page_level_ads: true,
            overlays: { bottom: true }
          })
          ;(window as any).pageAdsInitialized = true
        }
        
        setHasInitialized(true)
      } catch (error) {
        console.warn("AdSense initialization failed:", error)
      }
    }
  }, [publisherId, enableAutoAds, hasInitialized])

  // Don't render if ads are disabled
  if (!APP_CONFIG.enableAds || !publisherId) {
    return null
  }

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