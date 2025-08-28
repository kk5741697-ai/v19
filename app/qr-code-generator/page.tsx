"use client"

import { useState, useEffect } from "react"
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
import { QrCode, Download, Copy, Upload, Palette, Settings, Eye, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function QRCodeGeneratorPage() {
  const [content, setContent] = useState("https://pixoratools.com")
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
    { value: "url", label: "Website URL", placeholder: "https://example.com" },
    { value: "text", label: "Plain Text", placeholder: "Enter your text here" },
    { value: "email", label: "Email", placeholder: "email@example.com" },
    { value: "phone", label: "Phone", placeholder: "+1234567890" },
    { value: "sms", label: "SMS", placeholder: "Phone number" },
    { value: "wifi", label: "WiFi", placeholder: "Network name" },
    { value: "vcard", label: "Contact Card", placeholder: "Contact information" },
    { value: "location", label: "Location", placeholder: "Latitude, Longitude" }
  ]

  useEffect(() => {
    generateQR()
  }, [content, qrOptions, logoFile])

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
    } catch (error) {
      console.error("QR generation failed:", error)
      setQrDataUrl("")
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
    if (!qrDataUrl) return

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
      url: "https://pixoratools.com",
      text: "Welcome to PixoraTools - Professional Online Tools!",
      email: "support@pixoratools.com",
      phone: "+1-555-0123",
      wifi: "PixoraGuest",
      location: "37.7749,-122.4194"
    }
    setContent(examples[type as keyof typeof examples] || "")
    setQrType(type)
  }

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
          {/* Main Canvas */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>QR Code Preview</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{qrOptions.width}×{qrOptions.width}px</Badge>
                    <Badge variant="outline">{qrOptions.errorCorrectionLevel}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center min-h-[500px]">
                {qrDataUrl ? (
                  <div className="text-center space-y-6">
                    <div className="relative inline-block">
                      <img
                        src={qrDataUrl}
                        alt="Generated QR Code"
                        className="max-w-full h-auto rounded-lg shadow-lg border"
                        style={{ maxWidth: "400px" }}
                      />
                      {logoPreview && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-100 text-green-800">Logo</Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button onClick={() => downloadQR("png")} className="bg-blue-600 hover:bg-blue-700">
                        <Download className="h-4 w-4 mr-2" />
                        Download PNG
                      </Button>
                      <Button variant="outline" onClick={() => downloadQR("svg")}>
                        SVG
                      </Button>
                      <Button variant="outline" onClick={() => downloadQR("pdf")}>
                        PDF
                      </Button>
                      <Button variant="outline" onClick={copyToClipboard}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Content
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-gray-500">
                    <QrCode className="h-20 w-20 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Enter content to generate QR code</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Fixed Position */}
          <div className="lg:col-span-1">
            <div className="lg:fixed lg:top-24 lg:right-4 lg:w-80 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto space-y-4">
              {/* Content Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Content Type</Label>
                    <Select value={qrType} onValueChange={setQrType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {qrTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Content</Label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={qrTypes.find(t => t.value === qrType)?.placeholder}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadExample("url")}>
                      URL Example
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => loadExample("email")}>
                      Email Example
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Design Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Design
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="colors" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="colors">Colors</TabsTrigger>
                      <TabsTrigger value="shapes">Shapes</TabsTrigger>
                      <TabsTrigger value="logo">Logo</TabsTrigger>
                    </TabsList>

                    <TabsContent value="colors" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">Foreground</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <input
                              type="color"
                              value={qrOptions.foregroundColor}
                              onChange={(e) => setQrOptions(prev => ({ ...prev, foregroundColor: e.target.value }))}
                              className="w-8 h-8 border rounded cursor-pointer"
                            />
                            <Input
                              value={qrOptions.foregroundColor}
                              onChange={(e) => setQrOptions(prev => ({ ...prev, foregroundColor: e.target.value }))}
                              className="flex-1 font-mono text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">Background</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <input
                              type="color"
                              value={qrOptions.backgroundColor}
                              onChange={(e) => setQrOptions(prev => ({ ...prev, backgroundColor: e.target.value }))}
                              className="w-8 h-8 border rounded cursor-pointer"
                            />
                            <Input
                              value={qrOptions.backgroundColor}
                              onChange={(e) => setQrOptions(prev => ({ ...prev, backgroundColor: e.target.value }))}
                              className="flex-1 font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="shapes" className="space-y-4 mt-4">
                      <div>
                        <Label className="text-sm">Body Shape</Label>
                        <Select 
                          value={qrOptions.bodyShape} 
                          onValueChange={(value) => setQrOptions(prev => ({ ...prev, bodyShape: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="square">Square</SelectItem>
                            <SelectItem value="rounded">Rounded</SelectItem>
                            <SelectItem value="dots">Dots</SelectItem>
                            <SelectItem value="extra-rounded">Extra Rounded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm">Eye Shape</Label>
                        <Select 
                          value={qrOptions.eyeFrameShape} 
                          onValueChange={(value) => setQrOptions(prev => ({ ...prev, eyeFrameShape: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="square">Square</SelectItem>
                            <SelectItem value="rounded">Rounded</SelectItem>
                            <SelectItem value="circle">Circle</SelectItem>
                            <SelectItem value="leaf">Leaf</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>

                    <TabsContent value="logo" className="space-y-4 mt-4">
                      <div>
                        <Label className="text-sm">Upload Logo</Label>
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>
                      </div>

                      {logoPreview && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="w-12 h-12 object-contain border rounded bg-white"
                            />
                            <div className="flex-1">
                              <Label className="text-xs">Logo Size: {qrOptions.logoSize}%</Label>
                              <Slider
                                value={[qrOptions.logoSize]}
                                onValueChange={([value]) => setQrOptions(prev => ({ ...prev, logoSize: value }))}
                                min={10}
                                max={40}
                                step={1}
                                className="mt-1"
                              />
                            </div>
                          </div>
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
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm">Size: {qrOptions.width}px</Label>
                    <Slider
                      value={[qrOptions.width]}
                      onValueChange={([value]) => setQrOptions(prev => ({ ...prev, width: value }))}
                      min={200}
                      max={2000}
                      step={100}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Error Correction</Label>
                    <Select 
                      value={qrOptions.errorCorrectionLevel} 
                      onValueChange={(value) => setQrOptions(prev => ({ ...prev, errorCorrectionLevel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Low (7%)</SelectItem>
                        <SelectItem value="M">Medium (15%)</SelectItem>
                        <SelectItem value="Q">Quartile (25%)</SelectItem>
                        <SelectItem value="H">High (30%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Margin</Label>
                    <Slider
                      value={[qrOptions.margin]}
                      onValueChange={([value]) => setQrOptions(prev => ({ ...prev, margin: value }))}
                      min={0}
                      max={10}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Card>
                <CardContent className="pt-6">
                  <Button
                    onClick={generateQR}
                    disabled={!content.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    <QrCode className="h-5 w-5 mr-2" />
                    Generate QR Code
                  </Button>
                  
                  {content.trim() && (
                    <p className="text-xs text-center text-gray-500 mt-2">
                      Ready to generate QR code
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}