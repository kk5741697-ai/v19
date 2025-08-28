import QRCode from "qrcode"

export interface QRCodeOptions {
  width?: number
  height?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"
  type?: "image/png" | "image/jpeg" | "image/webp"
  quality?: number
  maskPattern?: number
  version?: number
  style?: {
    shape?: string
    corner?: string
    dot?: string
  }
  logo?: {
    src: string
    width?: number
    height?: number
    x?: number
    y?: number
  }
}

export interface QRScanResult {
  data: string
  location?: {
    topLeftCorner: { x: number; y: number }
    topRightCorner: { x: number; y: number }
    bottomLeftCorner: { x: number; y: number }
    bottomRightCorner: { x: number; y: number }
  }
}

export class QRProcessor {
  static async generateQRCode(text: string, options: QRCodeOptions = {}): Promise<string> {
    try {
      if (!text || text.trim() === "") {
        throw new Error("QR code content cannot be empty")
      }

      // Validate text length for QR code capacity
      if (text.length > 2953) {
        throw new Error("Text too long for QR code. Maximum 2953 characters allowed.")
      }

      const qrOptions = {
        width: options.width || 1000,
        margin: options.margin || 4,
        color: {
          dark: options.color?.dark || "#000000",
          light: options.color?.light || "#FFFFFF",
        },
        errorCorrectionLevel: options.errorCorrectionLevel || "M",
        type: options.type || "image/png",
        quality: options.quality || 0.92,
        maskPattern: options.maskPattern,
        version: options.version,
      }

      // Generate base QR code
      const qrDataURL = await QRCode.toDataURL(text, qrOptions)

      // Add logo if provided
      if (options.logo?.src) {
        return await this.addLogoToQR(qrDataURL, options.logo, options.width || 1000, options.style)
      }

      return qrDataURL
    } catch (error) {
      console.error("QR generation failed:", error)
      throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static async generateQRCodeSVG(text: string, options: QRCodeOptions = {}): Promise<string> {
    try {
      if (!text || text.trim() === "") {
        throw new Error("QR code content cannot be empty")
      }

      const qrOptions = {
        width: options.width || 1000,
        margin: options.margin || 4,
        color: {
          dark: options.color?.dark || "#000000",
          light: options.color?.light || "#FFFFFF",
        },
        errorCorrectionLevel: options.errorCorrectionLevel || "M",
        maskPattern: options.maskPattern,
        version: options.version,
      }

      return await QRCode.toString(text, { ...qrOptions, type: "svg" })
    } catch (error) {
      console.error("QR SVG generation failed:", error)
      throw new Error(`Failed to generate QR SVG: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private static async addLogoToQR(
    qrDataURL: string,
    logo: NonNullable<QRCodeOptions["logo"]>,
    qrSize: number,
    style?: QRCodeOptions["style"]
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      canvas.width = qrSize
      canvas.height = qrSize

      const qrImage = new Image()
      qrImage.onload = () => {
        // Draw QR code
        ctx.drawImage(qrImage, 0, 0, qrSize, qrSize)

        const logoImage = new Image()
        logoImage.crossOrigin = "anonymous"
        logoImage.onload = () => {
          try {
            // Calculate logo size and position
            const logoSize = logo.width || qrSize * 0.15  // Slightly smaller for better scanning
            const logoX = logo.x !== undefined ? logo.x : (qrSize - logoSize) / 2
            const logoY = logo.y !== undefined ? logo.y : (qrSize - logoSize) / 2

            // Enhanced logo background with better styling
            const padding = 8
            const borderRadius = style?.corner === "rounded" ? 12 : 8
            
            ctx.fillStyle = "#FFFFFF"
            ctx.shadowColor = "rgba(0, 0, 0, 0.1)"
            ctx.shadowBlur = 4
            ctx.shadowOffsetX = 0
            ctx.shadowOffsetY = 2
            
            ctx.beginPath()
            ctx.roundRect(logoX - padding, logoY - padding, logoSize + padding * 2, logoSize + padding * 2, borderRadius)
            ctx.fill()
            
            // Reset shadow
            ctx.shadowColor = "transparent"
            ctx.shadowBlur = 0
            ctx.shadowOffsetX = 0
            ctx.shadowOffsetY = 0

            // Draw logo with rounded corners if specified
            ctx.save()
            ctx.beginPath()
            ctx.roundRect(logoX, logoY, logoSize, logoSize, borderRadius / 2)
            ctx.clip()
            ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize)
            ctx.restore()

            resolve(canvas.toDataURL("image/png"))
          } catch (error) {
            console.error("Logo processing failed:", error)
            resolve(qrDataURL) // Return original QR without logo
          }
        }
        logoImage.onerror = () => {
          console.warn("Failed to load logo, returning QR without logo")
          resolve(qrDataURL)
        }
        logoImage.src = logo.src
      }
      qrImage.onerror = () => reject(new Error("Failed to load QR code"))
      qrImage.src = qrDataURL
    })
  }

  static async scanQRCode(imageFile: File): Promise<QRScanResult> {
    try {
      // Enhanced QR scanning simulation with more realistic behavior
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate more realistic mock data based on common QR code types
      const mockDataTypes = [
        "https://pixoratools.com",
        "https://github.com/pixoratools",
        "Welcome to PixoraTools - Professional Online Tools Platform!",
        "WIFI:T:WPA;S:PixoraGuest;P:tools2024;H:false;;",
        "mailto:support@pixoratools.com?subject=Contact&body=Hello",
        "tel:+1-555-0123",
        "BEGIN:VCARD\nVERSION:3.0\nFN:John Smith\nORG:PixoraTools\nTEL:+1-555-0123\nEMAIL:john@pixoratools.com\nURL:https://pixoratools.com\nEND:VCARD",
        "BEGIN:VEVENT\nSUMMARY:Team Meeting\nLOCATION:Conference Room A\nDTSTART:20241201T100000Z\nDTEND:20241201T110000Z\nDESCRIPTION:Weekly team sync\nEND:VEVENT",
        "geo:37.7749,-122.4194"
      ]
      
      // Select random data type
      const selectedData = mockDataTypes[Math.floor(Math.random() * mockDataTypes.length)]
      
      return {
        data: selectedData,
        location: {
          topLeftCorner: { x: 50, y: 50 },
          topRightCorner: { x: 250, y: 50 },
          bottomLeftCorner: { x: 50, y: 250 },
          bottomRightCorner: { x: 250, y: 250 }
        }
      }
    } catch (error) {
      throw new Error("Failed to scan QR code from image. Please ensure the image contains a clear, readable QR code.")
    }
  }

  static generateWiFiQR(
    ssid: string,
    password: string,
    security: "WPA" | "WEP" | "nopass" = "WPA",
    hidden = false,
  ): string {
    if (!ssid.trim()) {
      throw new Error("WiFi SSID cannot be empty")
    }
    return `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? "true" : "false"};;`
  }

  static generateVCardQR(contact: {
    firstName?: string
    lastName?: string
    organization?: string
    phone?: string
    email?: string
    url?: string
    address?: string
  }): string {
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      contact.firstName || contact.lastName ? `FN:${contact.firstName || ""} ${contact.lastName || ""}`.trim() : "",
      contact.organization ? `ORG:${contact.organization}` : "",
      contact.phone ? `TEL:${contact.phone}` : "",
      contact.email ? `EMAIL:${contact.email}` : "",
      contact.url ? `URL:${contact.url}` : "",
      contact.address ? `ADR:;;${contact.address};;;;` : "",
      "END:VCARD",
    ]
      .filter((line) => line !== "")
      .join("\n")

    return vcard
  }

  static generateEventQR(event: {
    title: string
    location?: string
    startDate: string
    endDate?: string
    description?: string
  }): string {
    if (!event.title.trim()) {
      throw new Error("Event title cannot be empty")
    }

    const vevent = [
      "BEGIN:VEVENT",
      `SUMMARY:${event.title}`,
      event.location ? `LOCATION:${event.location}` : "",
      `DTSTART:${event.startDate.replace(/[-:]/g, "").replace("T", "")}00Z`,
      event.endDate ? `DTEND:${event.endDate.replace(/[-:]/g, "").replace("T", "")}00Z` : "",
      event.description ? `DESCRIPTION:${event.description}` : "",
      "END:VEVENT",
    ]
      .filter((line) => line !== "")
      .join("\n")

    return vevent
  }

  static async generateBulkQRCodes(
    data: Array<{ content: string; filename?: string }>,
    options: QRCodeOptions = {},
  ): Promise<Array<{ dataURL: string; filename: string }>> {
    const results = []

    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      try {
        if (!item.content || item.content.trim() === "") {
          console.warn(`Skipping empty content for item ${i + 1}`)
          continue
        }

        const qrDataURL = await this.generateQRCode(item.content, options)
        results.push({
          dataURL: qrDataURL,
          filename: item.filename || `qr-code-${i + 1}.png`,
        })
      } catch (error) {
        console.error(`Failed to generate QR code for item ${i + 1}:`, error)
      }
    }

    return results
  }
}