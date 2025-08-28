"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { QRProcessor } from "@/lib/qr-processor"
import { QrCode, Download, Copy, Upload, Palette, Settings, Eye, RefreshCw, Minus, Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function QRCodeGeneratorPage() {
  const [content, setContent] = useState("https://www.qrcode-monkey.com")
  const [qrType, setQrType] = useState("url")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState("")
  
  // QR Design Options
  const [qrOptions, setQrOptions] = useState({
    width: 1000,
    margin: 4,
    errorCorrectionLevel: "M",
    foregroundColor: "#000000",
    backgroundColor: "#FFFFFF",
    bodyShape: "square",
    eyeFrameShape: "square",
    eyeBallShape: "square",
    gradientType: "none",
    logoSize: 20,
    frameStyle: "none",
    frameColor: "#000000",
    frameText: ""
  })

  // QR Content Types
  const qrTypes = [
    { value: "url", label: "URL", placeholder: "Your URL" },
    { value: "text", label: "TEXT", placeholder: "Enter your text here" },
    { value: "email", label: "EMAIL", placeholder: "email@example.com" },
    { value: "phone", label: "PHONE", placeholder: "+1234567890" },
    { value: "sms", label: "SMS", placeholder: "Phone number" },
    { value: "vcard", label: "VCARD", placeholder: "Contact information" },
    { value: "mecard", label: "MECARD", placeholder: "Contact information" },
    { value: "location", label: "LOCATION", placeholder: "Latitude, Longitude" },
    { value: "facebook", label: "FACEBOOK", placeholder: "Facebook URL" },
    { value: "twitter", label: "TWITTER", placeholder: "Twitter URL" },
    { value: "youtube", label: "YOUTUBE", placeholder: "YouTube URL" },
    { value: "wifi", label: "WIFI", placeholder: "WiFi settings" },
    { value: "event", label: "EVENT", placeholder: "Event details" },
    { value: "bitcoin", label: "BITCOIN", placeholder: "Bitcoin address" },
  ]

  const generateQR = async () => {
    try {
      if (!content.trim()) {
        setQrDataUrl("")
        return
      }

      let qrContent = content
      
      // Format content based on type
      switch (qrType) {
        case "email":
          qrContent = `mailto:${content}`
          break
        case "phone":
          qrContent = `tel:${content}`
          break
        case "sms":
          qrContent = `sms:${content}`
          break
      }

      const options = {
        width: qrOptions.width,
        margin: qrOptions.margin,
        color: {
          dark: qrOptions.foregroundColor,
          light: qrOptions.backgroundColor
        },
        errorCorrectionLevel: qrOptions.errorCorrectionLevel as "L" | "M" | "Q" | "H",
        style: {
          bodyShape: qrOptions.bodyShape,
          eyeFrameShape: qrOptions.eyeFrameShape,
          eyeBallShape: qrOptions.eyeBallShape,
          gradientType: qrOptions.gradientType
        },
        logo: logoFile ? {
          src: logoPreview,
          width: qrOptions.width * (qrOptions.logoSize / 100),
          removeBackground: true,
          borderRadius: 12,
          margin: 8
        } : undefined,
        frame: qrOptions.frameStyle !== "none" ? {
          style: qrOptions.frameStyle,
          color: qrOptions.frameColor,
          text: qrOptions.frameText
        } : undefined
      }

      const qrDataURL = await QRProcessor.generateQRCode(qrContent, options)
      setQrDataUrl(qrDataURL)
      
      toast({
        title: "QR Code Generated",
        description: "Your QR code is ready for download"
      })
    } catch (error) {
      console.error("QR generation failed:", error)
      setQrDataUrl("")
      toast({
        title: "Generation failed",
        description: "Failed to generate QR code",
        variant: "destructive"
      })
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file)
      
      const reader = new FileReader()
      reader.onload = (e) => setLogoPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const downloadQR = (format: string) => {
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

    toast({
      title: "Download started",
      description: `QR code downloaded as ${format.toUpperCase()}`
    })
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
    toast({
      title: "Copied to clipboard",
      description: "QR code content has been copied"
    })
  }

  const loadExample = (type: string) => {
    const examples = {
      url: "https://www.qrcode-monkey.com",
      text: "Welcome to QR Code Monkey - Free QR Code Generator!",
      email: "support@qrcode-monkey.com",
      phone: "+1-555-0123",
      wifi: "QRCodeMonkey",
      location: "37.7749,-122.4194"
    }
    setContent(examples[type as keyof typeof examples] || "")
    setQrType(type)
  }

  // Body shape options
  const bodyShapes = [
    "square", "rounded", "dots", "extra-rounded", "classy", "classy-rounded",
    "small-square", "large-square", "circle", "diamond", "leaf", "pointed",
    "rounded-pointed", "star", "plus", "cross", "heart", "shield"
  ]

  // Eye frame shapes
  const eyeFrameShapes = [
    "square", "rounded", "extra-rounded", "leaf", "circle", "pointed",
    "rounded-pointed", "star", "plus", "cross", "heart", "shield", "diamond"
  ]

  // Eye ball shapes  
  const eyeBallShapes = [
    "square", "rounded", "extra-rounded", "leaf", "circle", "pointed",
    "rounded-pointed", "star", "plus", "cross", "heart", "shield", "diamond",
    "small-square", "large-square"
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 mb-4">
            <QrCode className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">QR Code Generator</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create custom QR codes with logos, colors, and professional styling. Perfect for marketing and business use.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Options */}
          <div className="lg:col-span-1 space-y-4">
            {/* Content Type Tabs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Content Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {qrTypes.slice(0, 14).map((type) => (
                    <Button
                      key={type.value}
                      variant={qrType === type.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setQrType(type.value)}
                      className="text-xs h-8"
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content Input */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  ENTER CONTENT
                  <Button variant="ghost" size="sm" className="ml-auto">
                    <Minus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">Your {qrTypes.find(t => t.value === qrType)?.label}</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={qrTypes.find(t => t.value === qrType)?.placeholder}
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="statistics" />
                  <Label htmlFor="statistics" className="text-sm">Statistics and Editability</Label>
                </div>
              </CardContent>
            </Card>

            {/* Set Colors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  SET COLORS
                  <Button variant="ghost" size="sm" className="ml-auto">
                    <Minus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">Foreground Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center space-x-1">
                      <input
                        type="radio"
                        name="foregroundType"
                        id="singleColor"
                        defaultChecked
                      />
                      <Label htmlFor="singleColor" className="text-xs">Single Color</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <input
                        type="radio"
                        name="foregroundType"
                        id="colorGradient"
                      />
                      <Label htmlFor="colorGradient" className="text-xs">Color Gradient</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <input
                        type="radio"
                        name="foregroundType"
                        id="customEye"
                      />
                      <Label htmlFor="customEye" className="text-xs">Custom Eye Color</Label>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <div 
                      className="w-8 h-8 border rounded cursor-pointer"
                      style={{ backgroundColor: qrOptions.foregroundColor }}
                      onClick={() => document.getElementById('foregroundColorPicker')?.click()}
                    />
                    <Input
                      value={qrOptions.foregroundColor}
                      onChange={(e) => setQrOptions(prev => ({ ...prev, foregroundColor: e.target.value }))}
                      className="flex-1 font-mono text-xs"
                    />
                    <input
                      id="foregroundColorPicker"
                      type="color"
                      value={qrOptions.foregroundColor}
                      onChange={(e) => setQrOptions(prev => ({ ...prev, foregroundColor: e.target.value }))}
                      className="hidden"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Background Color</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <div 
                      className="w-8 h-8 border rounded cursor-pointer"
                      style={{ backgroundColor: qrOptions.backgroundColor }}
                      onClick={() => document.getElementById('backgroundColorPicker')?.click()}
                    />
                    <Input
                      value={qrOptions.backgroundColor}
                      onChange={(e) => setQrOptions(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="flex-1 font-mono text-xs"
                    />
                    <input
                      id="backgroundColorPicker"
                      type="color"
                      value={qrOptions.backgroundColor}
                      onChange={(e) => setQrOptions(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="hidden"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Logo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  ADD LOGO IMAGE
                  <Button variant="ghost" size="sm" className="ml-auto">
                    <Minus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  {logoPreview ? (
                    <div className="space-y-3">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-16 h-16 object-contain border rounded bg-white mx-auto"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLogoFile(null)
                          setLogoPreview("")
                        }}
                        className="w-full"
                      >
                        Remove Logo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded mx-auto flex items-center justify-center text-gray-400">
                        NO LOGO
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('logoUpload')?.click()}
                        className="w-full"
                      >
                        Upload Image
                      </Button>
                    </div>
                  )}
                  
                  <input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="removeBg" />
                  <Label htmlFor="removeBg" className="text-sm">Remove Background Behind Logo</Label>
                </div>

                {/* Social Media Icons Grid */}
                <div className="grid grid-cols-8 gap-2">
                  {[
                    "🌐", "📘", "📘", "🐦", "📺", "📺", "🔴", "📷", 
                    "💼", "❌", "📌", "🎵", "☁️", "🔗", "🎮", "📧",
                    "📞", "📱", "🌐", "🎯", "🔒", "💰", "📝", "🎨"
                  ].map((icon, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-xs"
                      onClick={() => loadExample("url")}
                    >
                      {icon}
                    </Button>
                  ))}
                </div>

                <p className="text-xs text-gray-500">
                  Upload your own custom logo image as <strong>.png</strong>, <strong>.jpg</strong>, or <strong>.gif</strong> file format with a 
                  maximum size of <strong>2 MB</strong>. You can also select a logo for your QR Code from the gallery.
                </p>
              </CardContent>
            </Card>

            {/* Customize Design */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  CUSTOMIZE DESIGN
                  <Button variant="ghost" size="sm" className="ml-auto">
                    <Minus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Body Shape</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {bodyShapes.slice(0, 20).map((shape, index) => (
                      <Button
                        key={shape}
                        variant={qrOptions.bodyShape === shape ? "default" : "outline"}
                        size="sm"
                        onClick={() => setQrOptions(prev => ({ ...prev, bodyShape: shape }))}
                        className="h-8 w-8 p-0 text-xs"
                        title={shape}
                      >
                        ⬛
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Eye Frame Shape</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {eyeFrameShapes.slice(0, 15).map((shape, index) => (
                      <Button
                        key={shape}
                        variant={qrOptions.eyeFrameShape === shape ? "default" : "outline"}
                        size="sm"
                        onClick={() => setQrOptions(prev => ({ ...prev, eyeFrameShape: shape }))}
                        className="h-8 w-8 p-0 text-xs"
                        title={shape}
                      >
                        ⬜
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Eye Ball Shape</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {eyeBallShapes.slice(0, 17).map((shape, index) => (
                      <Button
                        key={shape}
                        variant={qrOptions.eyeBallShape === shape ? "default" : "outline"}
                        size="sm"
                        onClick={() => setQrOptions(prev => ({ ...prev, eyeBallShape: shape }))}
                        className="h-8 w-8 p-0 text-xs"
                        title={shape}
                      >
                        ⚫
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Canvas Area */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">QR Code Preview</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">1000 x 1000 Px</Badge>
                    <Badge variant="outline">High Quality</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
                {qrDataUrl ? (
                  <>
                    <div className="relative">
                      <img
                        src={qrDataUrl}
                        alt="Generated QR Code"
                        className="max-w-full h-auto rounded-lg border"
                        style={{ maxWidth: "400px" }}
                      />
                      {logoPreview && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-100 text-green-800 text-xs">Logo</Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Quality Slider */}
                    <div className="flex items-center space-x-4 w-full max-w-md">
                      <span className="text-sm text-gray-500">Low Quality</span>
                      <Slider
                        value={[qrOptions.width]}
                        onValueChange={([value]) => setQrOptions(prev => ({ ...prev, width: value }))}
                        min={200}
                        max={2000}
                        step={100}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500">High Quality</span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-3 w-full max-w-md">
                      <Button 
                        onClick={() => downloadQR("png")} 
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold"
                      >
                        Create QR Code
                      </Button>
                      
                      <Button 
                        onClick={() => downloadQR("png")} 
                        variant="outline"
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 text-lg font-semibold"
                      >
                        Download PNG
                      </Button>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" onClick={() => downloadQR("svg")} className="text-sm">
                          SVG
                        </Button>
                        <Button variant="outline" onClick={() => downloadQR("pdf")} className="text-sm">
                          PDF*
                        </Button>
                        <Button variant="outline" onClick={() => downloadQR("eps")} className="text-sm">
                          EPS*
                        </Button>
                      </div>
                      
                      <p className="text-xs text-gray-500 text-center">
                        * no support for color gradients
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 text-gray-500">
                    <QrCode className="h-20 w-20 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-4">Enter content and click generate</p>
                    <Button 
                      onClick={generateQR}
                      disabled={!content.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold"
                    >
                      Create QR Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Upload <strong>MP3, PDF or any file</strong> you wish to your QR Code.
          </p>
          <Button variant="outline" className="text-blue-600">
            Upload MP3, PDF or any file
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  )
}