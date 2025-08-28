"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { QRProcessor, type QRCodeOptions } from "@/lib/qr-processor"
import { 
  Palette, Upload, Download, Eye, RotateCcw, 
  Square, Circle, Hexagon, Star, Heart
} from "lucide-react"

interface QRDesignStudioProps {
  content: string
  onQRGenerated: (dataUrl: string) => void
  className?: string
}

export function QRDesignStudio({ content, onQRGenerated, className = "" }: QRDesignStudioProps) {
  const [qrOptions, setQrOptions] = useState<QRCodeOptions>({
    width: 1000,
    margin: 4,
    color: { dark: "#000000", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
    style: {
      bodyShape: "square",
      eyeFrameShape: "square", 
      eyeBallShape: "square",
      gradientType: "none"
    }
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState("")
  const [qrPreview, setQrPreview] = useState("")

  useEffect(() => {
    if (content.trim()) {
      generateQRPreview()
    }
  }, [content, qrOptions, logoFile])

  const generateQRPreview = async () => {
    try {
      let logoSrc = ""
      if (logoFile) {
        logoSrc = URL.createObjectURL(logoFile)
      }

      const options = {
        ...qrOptions,
        logo: logoSrc ? {
          src: logoSrc,
          width: qrOptions.width! * 0.2,
          removeBackground: true,
          borderRadius: 12,
          margin: 8
        } : undefined
      }

      const qrDataUrl = await QRProcessor.generateQRCode(content, options)
      setQrPreview(qrDataUrl)
      onQRGenerated(qrDataUrl)
    } catch (error) {
      console.error("QR preview generation failed:", error)
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

  const updateQROption = (key: string, value: any) => {
    setQrOptions(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateStyleOption = (key: string, value: any) => {
    setQrOptions(prev => ({
      ...prev,
      style: {
        ...prev.style,
        [key]: value
      }
    }))
  }

  const updateColorOption = (key: string, value: string) => {
    setQrOptions(prev => ({
      ...prev,
      color: {
        ...prev.color,
        [key]: value
      }
    }))
  }

  const bodyShapes = [
    { id: "square", name: "Square", icon: Square },
    { id: "rounded", name: "Rounded", icon: Square },
    { id: "dots", name: "Dots", icon: Circle },
    { id: "extra-rounded", name: "Extra Rounded", icon: Square },
    { id: "classy", name: "Classy", icon: Hexagon },
    { id: "classy-rounded", name: "Classy Rounded", icon: Hexagon }
  ]

  const eyeFrameShapes = [
    { id: "square", name: "Square", icon: Square },
    { id: "rounded", name: "Rounded", icon: Square },
    { id: "extra-rounded", name: "Extra Rounded", icon: Square },
    { id: "leaf", name: "Leaf", icon: Heart },
    { id: "circle", name: "Circle", icon: Circle }
  ]

  const eyeBallShapes = [
    { id: "square", name: "Square", icon: Square },
    { id: "rounded", name: "Rounded", icon: Square },
    { id: "extra-rounded", name: "Extra Rounded", icon: Square },
    { id: "leaf", name: "Leaf", icon: Heart },
    { id: "circle", name: "Circle", icon: Circle }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* QR Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            QR Code Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {qrPreview ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={qrPreview}
                  alt="QR Code Preview"
                  className="max-w-full h-auto rounded-lg shadow-lg border"
                  style={{ maxWidth: "300px" }}
                />
                {logoPreview && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-100 text-green-800">
                      Logo Applied
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                Size: {qrOptions.width}×{qrOptions.width}px • 
                Error Correction: {qrOptions.errorCorrectionLevel}
              </div>
            </div>
          ) : (
            <div className="py-12 text-gray-500">
              <Square className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>QR code preview will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Design Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Customize Design
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="shapes">Shapes</TabsTrigger>
              <TabsTrigger value="logo">Logo</TabsTrigger>
              <TabsTrigger value="frame">Frame</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Foreground Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="color"
                      value={qrOptions.color?.dark || "#000000"}
                      onChange={(e) => updateColorOption("dark", e.target.value)}
                      className="w-8 h-8 border rounded cursor-pointer"
                    />
                    <Input
                      value={qrOptions.color?.dark || "#000000"}
                      onChange={(e) => updateColorOption("dark", e.target.value)}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Background Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="color"
                      value={qrOptions.color?.light || "#FFFFFF"}
                      onChange={(e) => updateColorOption("light", e.target.value)}
                      className="w-8 h-8 border rounded cursor-pointer"
                    />
                    <Input
                      value={qrOptions.color?.light || "#FFFFFF"}
                      onChange={(e) => updateColorOption("light", e.target.value)}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Gradient Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Gradient Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["none", "linear", "radial"].map((type) => (
                    <Button
                      key={type}
                      variant={qrOptions.style?.gradientType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateStyleOption("gradientType", type)}
                      className="capitalize"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color Presets */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Color Presets</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: "Classic", dark: "#000000", light: "#FFFFFF" },
                    { name: "Blue", dark: "#1e40af", light: "#dbeafe" },
                    { name: "Green", dark: "#166534", light: "#dcfce7" },
                    { name: "Purple", dark: "#7c3aed", light: "#ede9fe" },
                    { name: "Red", dark: "#dc2626", light: "#fee2e2" },
                    { name: "Orange", dark: "#ea580c", light: "#fed7aa" },
                    { name: "Pink", dark: "#ec4899", light: "#fce7f3" },
                    { name: "Teal", dark: "#0f766e", light: "#ccfbf1" }
                  ].map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateColorOption("dark", preset.dark)
                        updateColorOption("light", preset.light)
                      }}
                      className="h-auto p-2 flex flex-col items-center"
                    >
                      <div 
                        className="w-6 h-6 rounded border mb-1"
                        style={{ 
                          background: `linear-gradient(45deg, ${preset.dark} 50%, ${preset.light} 50%)`
                        }}
                      />
                      <span className="text-xs">{preset.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shapes" className="space-y-4 mt-4">
              {/* Body Shape */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Body Shape</Label>
                <div className="grid grid-cols-3 gap-2">
                  {bodyShapes.map((shape) => {
                    const Icon = shape.icon
                    return (
                      <Button
                        key={shape.id}
                        variant={qrOptions.style?.bodyShape === shape.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateStyleOption("bodyShape", shape.id)}
                        className="h-auto p-3 flex flex-col items-center"
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <span className="text-xs">{shape.name}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Eye Frame Shape */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Eye Frame Shape</Label>
                <div className="grid grid-cols-3 gap-2">
                  {eyeFrameShapes.map((shape) => {
                    const Icon = shape.icon
                    return (
                      <Button
                        key={shape.id}
                        variant={qrOptions.style?.eyeFrameShape === shape.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateStyleOption("eyeFrameShape", shape.id)}
                        className="h-auto p-3 flex flex-col items-center"
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <span className="text-xs">{shape.name}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Eye Ball Shape */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Eye Ball Shape</Label>
                <div className="grid grid-cols-3 gap-2">
                  {eyeBallShapes.map((shape) => {
                    const Icon = shape.icon
                    return (
                      <Button
                        key={shape.id}
                        variant={qrOptions.style?.eyeBallShape === shape.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateStyleOption("eyeBallShape", shape.id)}
                        className="h-auto p-3 flex flex-col items-center"
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <span className="text-xs">{shape.name}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logo" className="space-y-4 mt-4">
              <div>
                <Label className="text-sm font-medium">Upload Logo</Label>
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
                  <Label className="text-sm font-medium">Logo Preview</Label>
                  <div className="flex items-center space-x-3">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-16 h-16 object-contain border rounded-lg bg-white"
                    />
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label className="text-xs">Logo Size</Label>
                        <Slider
                          value={[((qrOptions.logo?.width || qrOptions.width! * 0.2) / qrOptions.width!) * 100]}
                          onValueChange={([value]) => {
                            const logoWidth = (value / 100) * qrOptions.width!
                            setQrOptions(prev => ({
                              ...prev,
                              logo: { ...prev.logo, src: logoPreview, width: logoWidth }
                            }))
                          }}
                          min={10}
                          max={40}
                          step={1}
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLogoFile(null)
                        setLogoPreview("")
                        setQrOptions(prev => ({ ...prev, logo: undefined }))
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              {/* Social Media Logos */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Quick Logo Gallery</Label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { name: "Facebook", icon: "📘", color: "#1877F2" },
                    { name: "Twitter", icon: "🐦", color: "#1DA1F2" },
                    { name: "Instagram", icon: "📷", color: "#E4405F" },
                    { name: "LinkedIn", icon: "💼", color: "#0A66C2" },
                    { name: "YouTube", icon: "📺", color: "#FF0000" },
                    { name: "TikTok", icon: "🎵", color: "#000000" }
                  ].map((social) => (
                    <button
                      key={social.name}
                      className="w-10 h-10 rounded-lg border-2 border-gray-200 hover:border-gray-400 flex items-center justify-center text-lg transition-all hover:scale-110"
                      style={{ backgroundColor: social.color + "20" }}
                      title={social.name}
                    >
                      {social.icon}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="frame" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Frame Style</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "none", name: "No Frame" },
                    { id: "square", name: "Square Frame" },
                    { id: "rounded", name: "Rounded Frame" },
                    { id: "banner", name: "Text Banner" }
                  ].map((frame) => (
                    <Button
                      key={frame.id}
                      variant={qrOptions.frame?.style === frame.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setQrOptions(prev => ({
                        ...prev,
                        frame: { ...prev.frame, style: frame.id as any }
                      }))}
                    >
                      {frame.name}
                    </Button>
                  ))}
                </div>
              </div>

              {qrOptions.frame?.style && qrOptions.frame.style !== "none" && (
                <>
                  <div>
                    <Label className="text-sm font-medium">Frame Color</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="color"
                        value={qrOptions.frame?.color || "#000000"}
                        onChange={(e) => setQrOptions(prev => ({
                          ...prev,
                          frame: { ...prev.frame, color: e.target.value }
                        }))}
                        className="w-8 h-8 border rounded cursor-pointer"
                      />
                      <Input
                        value={qrOptions.frame?.color || "#000000"}
                        onChange={(e) => setQrOptions(prev => ({
                          ...prev,
                          frame: { ...prev.frame, color: e.target.value }
                        }))}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Frame Text</Label>
                    <Input
                      value={qrOptions.frame?.text || ""}
                      onChange={(e) => setQrOptions(prev => ({
                        ...prev,
                        frame: { ...prev.frame, text: e.target.value }
                      }))}
                      placeholder="Enter frame text"
                    />
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Advanced Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">QR Code Size</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Slider
                value={[qrOptions.width || 1000]}
                onValueChange={([value]) => updateQROption("width", value)}
                min={200}
                max={2000}
                step={100}
                className="flex-1"
              />
              <span className="text-sm text-gray-500 min-w-[4rem]">
                {qrOptions.width}px
              </span>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Error Correction Level</Label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {[
                { value: "L", label: "Low (7%)" },
                { value: "M", label: "Medium (15%)" },
                { value: "Q", label: "Quartile (25%)" },
                { value: "H", label: "High (30%)" }
              ].map((level) => (
                <Button
                  key={level.value}
                  variant={qrOptions.errorCorrectionLevel === level.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateQROption("errorCorrectionLevel", level.value)}
                  className="text-xs"
                >
                  {level.value}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Margin</Label>
            <Slider
              value={[qrOptions.margin || 4]}
              onValueChange={([value]) => updateQROption("margin", value)}
              min={0}
              max={10}
              step={1}
            />
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setQrOptions({
                width: 1000,
                margin: 4,
                color: { dark: "#000000", light: "#FFFFFF" },
                errorCorrectionLevel: "M",
                style: {
                  bodyShape: "square",
                  eyeFrameShape: "square",
                  eyeBallShape: "square",
                  gradientType: "none"
                }
              })
              setLogoFile(null)
              setLogoPreview("")
            }}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}