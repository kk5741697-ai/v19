// AdSense management for AJAX content compatibility
export class AdManager {
  private static instance: AdManager
  private initialized = false
  private consentGiven = false

  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager()
    }
    return AdManager.instance
  }

  async initialize(publisherId: string): Promise<void> {
    if (this.initialized || typeof window === "undefined") {
      return
    }

    try {
      // Load AdSense script
      const script = document.createElement("script")
      script.async = true
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`
      script.crossOrigin = "anonymous"
      
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve()
        script.onerror = () => reject(new Error("Failed to load AdSense"))
        document.head.appendChild(script)
      })

      // Initialize adsbygoogle array
      ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
      
      this.initialized = true
    } catch (error) {
      console.warn("AdSense initialization failed:", error)
    }
  }

  setConsent(consent: boolean): void {
    this.consentGiven = consent
    
    if (consent && this.initialized) {
      this.refreshAllAds()
    }
  }

  // Safe method for AJAX-loaded content
  initializeAd(adElement: HTMLElement): void {
    if (!this.initialized || !this.consentGiven || typeof window === "undefined") {
      return
    }

    try {
      // Only initialize if not already done
      if (!adElement.dataset.adInitialized) {
        ;(window as any).adsbygoogle.push({})
        adElement.dataset.adInitialized = "true"
      }
    } catch (error) {
      console.warn("Failed to initialize ad:", error)
    }
  }

  // Refresh ads for dynamic content (use sparingly)
  refreshAllAds(): void {
    if (!this.initialized || typeof window === "undefined") {
      return
    }

    try {
      // Clear and reinitialize all ads
      const adElements = document.querySelectorAll('.adsbygoogle')
      adElements.forEach(ad => {
        const element = ad as HTMLElement
        if (element.dataset.adInitialized) {
          element.innerHTML = ""
          delete element.dataset.adInitialized
          ;(window as any).adsbygoogle.push({})
        }
      })
    } catch (error) {
      console.warn("Failed to refresh ads:", error)
    }
  }

  // Check if ads can be displayed
  canShowAds(): boolean {
    return this.initialized && this.consentGiven
  }
}

export const adManager = AdManager.getInstance()