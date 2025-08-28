"use client"

import { useEffect, useState } from "react"
import { APP_CONFIG } from "@/lib/config"

interface AdManagerProps {
  children: React.ReactNode
}

export function AdManager({ children }: AdManagerProps) {
  const [adsInitialized, setAdsInitialized] = useState(false)

  useEffect(() => {
    if (!APP_CONFIG.enableAds || !APP_CONFIG.adsensePublisherId) {
      return
    }

    // Initialize AdSense only once per page load
    if (typeof window !== "undefined" && !adsInitialized) {
      try {
        // Ensure adsbygoogle array exists
        ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
        
        // Load AdSense script dynamically
        const script = document.createElement("script")
        script.async = true
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${APP_CONFIG.adsensePublisherId}`
        script.crossOrigin = "anonymous"
        
        script.onload = () => {
          setAdsInitialized(true)
          
          // Initialize page-level ads if enabled
          if (APP_CONFIG.enableAutoAds) {
            ;(window as any).adsbygoogle.push({
              google_ad_client: APP_CONFIG.adsensePublisherId,
              enable_page_level_ads: true
            })
          }
        }
        
        script.onerror = () => {
          console.warn("Failed to load AdSense script")
        }
        
        document.head.appendChild(script)
      } catch (error) {
        console.warn("AdSense initialization failed:", error)
      }
    }
  }, [adsInitialized])

  return <>{children}</>
}

// Safe ad loading for AJAX content
export function initializeAd(adElement: HTMLElement) {
  if (!APP_CONFIG.enableAds || typeof window === "undefined") {
    return
  }

  try {
    // Only push to adsbygoogle if the ad hasn't been initialized
    if (!adElement.dataset.adInitialized) {
      ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
      ;(window as any).adsbygoogle.push({})
      adElement.dataset.adInitialized = "true"
    }
  } catch (error) {
    console.warn("Failed to initialize ad:", error)
  }
}

// Refresh ads safely for dynamic content
export function refreshAds() {
  if (!APP_CONFIG.enableAds || typeof window === "undefined") {
    return
  }

  try {
    // Clear existing ads
    const adElements = document.querySelectorAll('.adsbygoogle')
    adElements.forEach(ad => {
      const element = ad as HTMLElement
      if (element.dataset.adInitialized) {
        element.innerHTML = ""
        delete element.dataset.adInitialized
      }
    })

    // Reinitialize ads
    ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
    adElements.forEach(() => {
      ;(window as any).adsbygoogle.push({})
    })
  } catch (error) {
    console.warn("Failed to refresh ads:", error)
  }
}