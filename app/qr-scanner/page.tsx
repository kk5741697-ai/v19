"use client"

import { useState, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QRProcessor } from "@/lib/qr-processor"
import { 
  ScanLine, 
  Upload, 
  Camera, 
  Copy, 
  ExternalLink, 
  Mail, 
  Phone, 
  Wifi, 
  User,
  Calendar,
  MapPin,
  FileText
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ScanResult {
  data: string
  type: string
  formatted?: any
}

export default function QRScannerPage() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    setIsScanning(true)
    setError("")
    setScanResult(null)

    try {
      const result = await QRProcessor.scanQRCode(file)
      const processedResult = processQRData(result.data)
      setScanResult(processedResult)
      
      toast({
        title: "QR Code scanned",
        description: "Successfully decoded QR code data"
      })
    } catch (error) {
      setError("Failed to scan QR code from image")
      toast({
        title: "Scan failed",
        description: "Could not detect QR code in the image",
        variant: "destructive"
      })
    } finally {
      setIsScanning(false)
    }
  }

  const processQRData = (data: string): ScanResult => {
    // Detect QR code type and format data
    if (data.startsWith("http://") || data.startsWith("https://")) {
      return { data, type: "URL" }
    } else if (data.startsWith("mailto:")) {
      const email = data.replace("mailto:", "").split("?")[0]
      return { 
        data, 
        type: "EMAIL", 
        formatted: { email, subject: "", body: "" }
      }
    } else if (data.startsWith("tel:")) {
      const phone = data.replace("tel:", "")
      return { 
        data, 
        type: "PHONE", 
        formatted: { phone }
      }
    } else if (data.startsWith("WIFI:")) {
      const wifiMatch = data.match(/WIFI:T:([^;]*);S:([^;]*);P:([^;]*);H:([^;]*);/)
      if (wifiMatch) {
        return {
          data,
          type: "WIFI",
          formatted: {
            security: wifiMatch[1],
            ssid: wifiMatch[2],
            password: wifiMatch[3],
            hidden: wifiMatch[4] === "true"
          }
        }
      }
    } else if (data.startsWith("BEGIN:VCARD")) {
      return { data, type: "VCARD", formatted: parseVCard(data) }
    } else if (data.startsWith("BEGIN:VEVENT")) {
      return { data, type: "EVENT", formatted: parseEvent(data) }
    } else if (data.startsWith("geo:")) {
      const coords = data.replace("geo:", "")
      return { 
        data, 
        type: "LOCATION", 
        formatted: { coordinates: coords }
      }
    }

    return { data, type: "TEXT" }
  }

  const parseVCard = (vcard: string) => {
    const lines = vcard.split('\n')
    const contact: any = {}
    
    lines.forEach(line => {
      if (line.startsWith('FN:')) contact.name = line.substring(3)
      if (line.startsWith('ORG:')) contact.organization = line.substring(4)
      if (line.startsWith('TEL:')) contact.phone = line.substring(4)
      if (line.startsWith('EMAIL:')) contact.email = line.substring(6)
      if (line.startsWith('URL:')) contact.url = line.substring(4)
    })
    
    return contact
  }

  const parseEvent = (vevent: string) => {
    const lines = vevent.split('\n')
    const event: any = {}
    
    lines.forEach(line => {
      if (line.startsWith('SUMMARY:')) event.title = line.substring(8)
      if (line.startsWith('LOCATION:')) event.location = line.substring(9)
      if (line.startsWith('DTSTART:')) event.startDate = line.substring(8)
      if (line.startsWith('DTEND:')) event.endDate = line.substring(6)
      if (line.startsWith('DESCRIPTION:')) event.description = line.substring(12)
    })
    
    return event
  }

  const copyData = () => {
    navigator.clipboard.writeText(scanResult?.data || "")
    toast({
      title: "Copied to clipboard",
      description: "QR code data copied"
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "URL": return ExternalLink
      case "EMAIL": return Mail
      case "PHONE": return Phone
      case "WIFI": return Wifi
      case "VCARD": return User
      case "EVENT": return Calendar
      case "LOCATION": return MapPin
      default: return FileText
    }
  }

  const renderFormattedData = (result: ScanResult) => {
    const Icon = getTypeIcon(result.type)

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-blue-600" />
          <Badge variant="secondary">{result.type}</Badge>
        </div>

        {result.type === "URL" && (
          <div className="space-y-2">
            <Button asChild className="w-full">
              <a href={result.data} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open URL
              </a>
            </Button>
          </div>
        )}

        {result.type === "EMAIL" && result.formatted && (
          <div className="space-y-2">
            <Button asChild className="w-full">
              <a href={result.data}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </a>
            </Button>
            <p className="text-sm text-gray-600">To: {result.formatted.email}</p>
          </div>
        )}

        {result.type === "PHONE" && result.formatted && (
          <div className="space-y-2">
            <Button asChild className="w-full">
              <a href={result.data}>
                <Phone className="h-4 w-4 mr-2" />
                Call Number
              </a>
            </Button>
            <p className="text-sm text-gray-600">Number: {result.formatted.phone}</p>
          </div>
        )}

        {result.type === "WIFI" && result.formatted && (
          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 mb-2">WiFi Network</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <div><strong>Network:</strong> {result.formatted.ssid}</div>
                <div><strong>Security:</strong> {result.formatted.security}</div>
                <div><strong>Password:</strong> {result.formatted.password || "None"}</div>
                <div><strong>Hidden:</strong> {result.formatted.hidden ? "Yes" : "No"}</div>
              </div>
            </div>
          </div>
        )}

        {result.type === "VCARD" && result.formatted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="font-medium text-green-900 mb-2">Contact Information</h4>
            <div className="space-y-1 text-sm text-green-800">
              {result.formatted.name && <div><strong>Name:</strong> {result.formatted.name}</div>}
              {result.formatted.organization && <div><strong>Company:</strong> {result.formatted.organization}</div>}
              {result.formatted.phone && <div><strong>Phone:</strong> {result.formatted.phone}</div>}
              {result.formatted.email && <div><strong>Email:</strong> {result.formatted.email}</div>}
              {result.formatted.url && <div><strong>Website:</strong> {result.formatted.url}</div>}
            </div>
          </div>
        )}

        <div className="bg-gray-50 border rounded-lg p-3">
          <Label className="text-sm font-medium">Raw Data</Label>
          <div className="mt-2 p-2 bg-white border rounded text-sm font-mono break-all">
            {result.data}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <ScanLine className="h-8 w-8 text-accent" />
            <h1 className="text-3xl font-heading font-bold text-foreground">QR Code Scanner</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Scan and decode QR codes from images. Upload QR code images to extract and format the contained data.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload QR Code Image</CardTitle>
              <CardDescription>Select an image containing a QR code to scan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload QR Code Image</h3>
                <p className="text-gray-500 mb-4">Click to browse or drag and drop</p>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </Button>
                <p className="text-xs text-gray-500 mt-4">
                  Supports JPG, PNG, WebP formats
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {isScanning && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-medium text-blue-800">Scanning QR code...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-red-800">{error}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle>Scan Results</CardTitle>
              <CardDescription>Decoded QR code data and actions</CardDescription>
            </CardHeader>
            <CardContent>
              {scanResult ? (
                <div className="space-y-4">
                  {renderFormattedData(scanResult)}
                  
                  <Button onClick={copyData} variant="outline" className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Data
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ScanLine className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Upload an image to scan QR code</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>How to Use QR Scanner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-medium mb-2">Upload Image</h4>
                <p className="text-sm text-muted-foreground">
                  Select an image file containing a QR code
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h4 className="font-medium mb-2">Automatic Scan</h4>
                <p className="text-sm text-muted-foreground">
                  Our scanner automatically detects and decodes the QR code
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h4 className="font-medium mb-2">View Results</h4>
                <p className="text-sm text-muted-foreground">
                  Get formatted data with appropriate actions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}