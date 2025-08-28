"use client"

import { APP_CONFIG } from "@/lib/config"
import { AdSenseBanner } from "./adsense-banner"

interface ConditionalAdBannerProps {
  adSlot: string
  adFormat?: "auto" | "rectangle" | "vertical" | "horizontal"
  fullWidthResponsive?: boolean
  className?: string
  style?: React.CSSProperties
}

export function ConditionalAdBanner(props: ConditionalAdBannerProps) {
  // Only render ads if enabled in config and publisher ID is available
  if (!APP_CONFIG.enableAds || !APP_CONFIG.adsensePublisherId) {
    return null
  }

  return <AdSenseBanner {...props} />
}