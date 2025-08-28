"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { QRProcessor } from "@/lib/qr-processor"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QRDesignStudio } from "@/components/qr-design-studio"
import {
  QrCode,
  Download,
  Link,
  FileText,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  User,
  Upload,
  Palette,
  CheckCircle,
  Globe,
  MapPin,
  Settings,
  AlertCircle,
  Copy,
  Image as ImageIcon,
  X
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function QRCodeGeneratorPage() {
  const [activeType, setActiveType] = useState("url")
  const [content, setContent] = useState("https://example.com")
  const [qrSize, setQrSize] = useState([1000])
  const [errorCorrection, setErrorCorrection] = useState("M")
  const [foregroundColor, setForegroundColor] = useState("#000000")
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF")
  const [logoUrl, setLogoUrl] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState("")
  const [qrStyle, setQrStyle] = useState("square")
  const [cornerStyle, setCornerStyle] = useState("square")
  const [dotStyle, setDotStyle] = useState("square")
  const [qrDataUrl, setQrDataUrl] = useState("")
  
  // Content type specific fields
  const [emailData, setEmailData] = useState({ email: "", subject: "", body: "" })
  const [phoneData, setPhoneData] = useState({ phone: "" })
  const [smsData, setSmsData] = useState({ phone: "", message: "" })
  const [wifiData, setWifiData] = useState({ ssid: "", password: "", security: "WPA", hidden: false })
  const [vcardData, setVcardData] = useState({ 
    firstName: "", lastName: "", organization: "", phone: "", email: "", url: "", address: "" 
  })
  const [eventData, setEventData] = useState({
    title: "", location: "", startDate: "", endDate: "", description: ""
  })

  const contentTypes = [
    { id: "url", label: "URL", icon: Link },
    { id: "text", label: "TEXT", icon: FileText },
    { id: "email", label: "EMAIL", icon: Mail },
    { id: "phone", label: "PHONE", icon: Phone },
    { id: "sms", label: "SMS", icon: MessageSquare },
    { id: "vcard", label: "VCARD", icon: User },
    { id: "wifi", label: "WIFI", icon: Wifi },
    { id: "event", label: "EVENT", icon: Calendar },
    { id: "location", label: "LOCATION", icon: MapPin },
  ]

  const generateQRContent = () => {
          if (!phoneData.phone.trim()) return ""
        return `tel:${phoneData.phone}`
      case "sms":
          if (!smsData.phone.trim()) return ""
        return `sms:${smsData.phone}?body=${encodeURIComponent(smsData.message)}`
      case "wifi":
          if (!wifiData.ssid.trim()) return ""
        return QRProcessor.generateWiFiQR(wifiData.ssid, wifiData.password, wifiData.security as any, wifiData.hidden)
      case "vcard":
          if (!vcardData.firstName && !vcardData.lastName && !vcardData.email) return ""
        return QRProcessor.generateVCardQR(vcardData)
      case "event":
          if (!eventData.title.trim()) return ""
        return QRProcessor.generateEventQR(eventData)
      case "location":
          if (!content.trim()) return ""
        return `geo:${content}`
      default:
        return content
    }
    } catch (error) {
      console.error("Error generating QR content:", error)
      return ""
    }
  }

  const downloadQR = async (format: string) => {
    try {
      const qrContent = generateQRContent()
      if (!qrContent.trim()) {
        toast({
          title: "No content to generate QR code",
          description: "Please enter content first",
          variant: "destructive"
        })
        return
      }

      if (format === "svg") {
        const svgString = await QRProcessor.generateQRCodeSVG(qrContent, {
          width: 1000,
          color: { dark: "#000000", light: "#FFFFFF" },
          errorCorrectionLevel: "M"
        })
        const blob = new Blob([svgString], { type: "image/svg+xml" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.download = "qr-code.svg"
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
      } else {
        if (!qrDataUrl) {
          toast({
            title: "No QR code to download",
            description: "Please generate a QR code first",
            variant: "destructive"
          })
          return
        }
        const link = document.createElement("a")
        link.download = `qr-code.${format}`
        link.href = qrDataUrl
        link.click()
      }
      
      toast({
        title: "Download started",
        description: `QR code downloaded as ${format.toUpperCase()}`
      })
    } catch (error) {
      console.error("Failed to download QR code:", error)
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Unable to download QR code",
        variant: "destructive"
      })
    }
  }

  const renderContentForm = () => {
    switch (activeType) {
      case "url":
        return (
          <div>
            <Label htmlFor="url-content">Your URL</Label>
            <Input
              id="url-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="https://example.com"
              className="mt-1"
            />
          </div>
        )
      
      case "text":
        return (
          <div>
            <Label htmlFor="text-content">Your Text</Label>
            <Textarea
              id="text-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your text here..."
              className="mt-1"
              rows={3}
            />
          </div>
        )
      
      case "email":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={emailData.email}
                onChange={(e) => setEmailData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contact@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={emailData.body}
                onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Email message"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        )
      
      case "phone":
        return (
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneData.phone}
              onChange={(e) => setPhoneData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1234567890"
              className="mt-1"
            />
          </div>
        )
      
      case "sms":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="sms-phone">Phone Number</Label>
              <Input
                id="sms-phone"
                type="tel"
                value={smsData.phone}
                onChange={(e) => setSmsData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1234567890"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sms-message">Message</Label>
              <Textarea
                id="sms-message"
                value={smsData.message}
                onChange={(e) => setSmsData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Your SMS message"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        )
      
      case "wifi":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="wifi-ssid">Network Name (SSID)</Label>
              <Input
                id="wifi-ssid"
                value={wifiData.ssid}
                onChange={(e) => setWifiData(prev => ({ ...prev, ssid: e.target.value }))}
                placeholder="MyWiFiNetwork"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="wifi-password">Password</Label>
              <Input
                id="wifi-password"
                type="password"
                value={wifiData.password}
                onChange={(e) => setWifiData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="WiFi password"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="wifi-security">Security Type</Label>
              <select
                id="wifi-security"
                value={wifiData.security}
                onChange={(e) => setWifiData(prev => ({ ...prev, security: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md bg-white mt-1"
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">No Password</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wifi-hidden"
                checked={wifiData.hidden}
                onCheckedChange={(checked) => setWifiData(prev => ({ ...prev, hidden: checked as boolean }))}
              />
              <Label htmlFor="wifi-hidden" className="text-sm">Hidden Network</Label>
            </div>
          </div>
        )
      
      case "vcard":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={vcardData.firstName}
                  onChange={(e) => setVcardData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={vcardData.lastName}
                  onChange={(e) => setVcardData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={vcardData.organization}
                onChange={(e) => setVcardData(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="Company Name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="vcard-phone">Phone</Label>
              <Input
                id="vcard-phone"
                type="tel"
                value={vcardData.phone}
                onChange={(e) => setVcardData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1234567890"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="vcard-email">Email</Label>
              <Input
                id="vcard-email"
                type="email"
                value={vcardData.email}
                onChange={(e) => setVcardData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="vcard-url">Website</Label>
              <Input
                id="vcard-url"
                type="url"
                value={vcardData.url}
                onChange={(e) => setVcardData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="vcard-address">Address</Label>
              <Textarea
                id="vcard-address"
                value={vcardData.address}
                onChange={(e) => setVcardData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main St, City, State, ZIP"
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
        )
      
      case "event":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="event-title">Event Title</Label>
              <Input
                id="event-title"
                value={eventData.title}
                onChange={(e) => setEventData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Meeting Title"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={eventData.location}
                onChange={(e) => setEventData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Conference Room A"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="datetime-local"
                  value={eventData.startDate}
                  onChange={(e) => setEventData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="datetime-local"
                  value={eventData.endDate}
                  onChange={(e) => setEventData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={eventData.description}
                onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Event description"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        )
      
      case "location":
        return (
          <div>
            <Label htmlFor="location-content">Coordinates or Address</Label>
            <Input
              id="location-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="40.7128,-74.0060 or 123 Main St, New York"
              className="mt-1"
            />
          </div>
        )
      
      default:
        return (
          <div>
            <Label htmlFor="default-content">Content</Label>
            <Textarea
              id="default-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your content here..."
              className="mt-1"
              rows={3}
            />
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600">
      <Header />

      {/* Top Navigation Bar */}
      <div className="bg-green-500/90 backdrop-blur-sm text-white border-b border-green-400">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-6 py-4 text-sm font-medium overflow-x-auto">
            {contentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                  activeType === type.id 
                    ? "bg-white text-green-600 font-semibold shadow-lg scale-105" 
                    : "hover:bg-green-400/50 hover:scale-105"
                }`}
              >
                <type.icon className="h-4 w-4" />
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-green-200">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Panel - Content Input */}
            <div className="p-8 space-y-6">
              {/* Content Input */}
              <Card>
                <CardHeader className="pb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-800">ENTER CONTENT</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderContentForm()}
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - QR Code Preview */}
            <div className="bg-gradient-to-b from-gray-50 to-gray-100 p-8">
              <QRDesignStudio
                content={generateQRContent()}
                onQRGenerated={setQrDataUrl}
              />
              
              {/* Download Section */}
              <Card className="mt-6">
                <CardContent className="pt-6 space-y-4">
                  <Button 
                    onClick={() => downloadQR("png")} 
                    disabled={!qrDataUrl}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    size="lg"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download High Quality PNG
                  </Button>
            </div>
          </div>
        </div>
      </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={() => downloadQR("svg")}
                      disabled={!generateQRContent().trim()}
                      className="text-blue-500 border-blue-400 hover:bg-blue-50 font-semibold py-3 rounded-lg transition-all hover:scale-105"
                    >
                      .SVG
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={() => downloadQR("pdf")}
                      disabled={!generateQRContent().trim()}
                      className="text-orange-500 border-orange-400 hover:bg-orange-50 font-semibold py-3 rounded-lg transition-all hover:scale-105"
                    >
                      .PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={() => {
                        navigator.clipboard.writeText(generateQRContent())
                        toast({ title: "Content copied", description: "QR code content copied to clipboard" })
                      }}
                      className="text-purple-500 border-purple-400 hover:bg-purple-50 font-semibold py-3 rounded-lg transition-all hover:scale-105"
                    >
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
      <Footer />
    </div>
  )
}