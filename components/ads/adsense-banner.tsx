"use client"

import { useEffect, useRef, useState } from "react"
import { APP_CONFIG } from "@/lib/config"

interface AdSenseBannerProps {
  adSlot: string
  adFormat?: "auto" | "rectangle" | "vertical" | "horizontal"
  fullWidthResponsive?: boolean
  className?: string
  style?: React.CSSProperties
}

export function AdSenseBanner({
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  className = "",
  style = {}
}: AdSenseBannerProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    // Only initialize if ads are enabled and we haven't already initialized this ad
    if (typeof window !== "undefined" && adRef.current && APP_CONFIG.enableAds && !hasInitialized) {
      try {
        // Ensure adsbygoogle array exists
        ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
        
        // Only push if this specific ad hasn't been initialized
        ;(window as any).adsbygoogle.push({})
        setHasInitialized(true)
      } catch (error) {
        console.warn("AdSense ad initialization failed:", error)
      }
    }
  }, [hasInitialized])

  // Don't render if ads are disabled
  if (!APP_CONFIG.enableAds || !APP_CONFIG.adsensePublisherId) {
    return null
  }

  // Don't render in development
  if (process.env.NODE_ENV === "development") {
    return (
      <div className={`bg-gray-100 border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 text-sm ${className}`}>
        AdSense Banner ({adSlot})
      </div>
    )
  }

  return (
    <div ref={adRef} className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          textAlign: "center",
          ...style
        }}
        data-ad-client="ca-pub-your-publisher-id"
        data-ad-client={APP_CONFIG.adsensePublisherId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  )
}