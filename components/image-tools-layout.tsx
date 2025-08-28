"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Upload, Download, Settings, Eye, Trash2, RotateCcw, 
  CheckCircle, AlertCircle, ImageIcon, ArrowLeft, Grid, List,
  ZoomIn, ZoomOut, Move, RotateCw, Copy, Crop, Square,
  Circle, MousePointer, Hand, X, Plus, Minus, Maximize,
  FlipHorizontal, FlipVertical, Palette, Contrast
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import Link from "next/link"

interface ToolOption {
  key: string
  label: string
  type: "text" | "number" | "select" | "checkbox" | "slider" | "color" | "input"
  defaultValue: any
  min?: number
  max?: number
  step?: number
  selectOptions?: Array<{ value: string; label: string }>
  section?: string
  condition?: (options: any) => boolean
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface ImageFile {
  id: string
  file: File
  originalFile: File
  name: string
  size: number
  type: string
  status: string
  preview: string
  dimensions: { width: number; height: number }
  processed?: boolean
  processedPreview?: string
  processedSize?: number
  blob?: Blob
  cropArea?: CropArea
}

interface ImageToolsLayoutProps {
  title: string
  description: string
  icon: any
  toolType: "resize" | "compress" | "convert" | "crop" | "rotate" | "filters" | "watermark" | "background"
  processFunction: (files: any[], options: any) => Promise<{ success: boolean; processedFiles?: any[]; error?: string }>
  options?: ToolOption[]
  maxFiles?: number
  singleFileOnly?: boolean
  allowBatchProcessing?: boolean
  supportedFormats?: string[]
  outputFormats?: string[]
  presets?: Array<{ name: string; values: any }>
}

export function ImageToolsLayout({
  title,
  description,
  icon: Icon,
  toolType,
  processFunction,
  options = [],
  maxFiles = 20,
  singleFileOnly = false,
  allowBatchProcessing = true,
  supportedFormats = ["image/jpeg", "image/png", "image/webp"],
  outputFormats = ["jpeg", "png", "webp"],
  presets = []
}: ImageToolsLayoutProps) {
  const [files, setFiles] = useState<ImageFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [toolOptions, setToolOptions] = useState<Record<string, any>>({})
  const [selectedFile, setSelectedFile] = useState<ImageFile | null>(null)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 10, y: 10, width: 80, height: 80 })
  const [isDragActive, setIsDragActive] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [zoomLevel, setZoomLevel] = useState(100)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragHandle, setDragHandle] = useState("")
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const isMobile = useIsMobile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Initialize options
  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(defaultOptions)
  }, [options])

  const handleFileUpload = async (uploadedFiles: FileList) => {
    const validFiles: ImageFile[] = []

    for (const file of Array.from(uploadedFiles)) {
      if (!supportedFormats.includes(file.type)) {
        toast({
          title: "Unsupported format",
          description: `${file.name} is not a supported image format`,
          variant: "destructive"
        })
        continue
      }

      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 100MB limit`,
          variant: "destructive"
        })
        continue
      }

      try {
        const preview = await createImagePreview(file)
        const dimensions = await getImageDimensions(file)
        
        const imageFile: ImageFile = {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          originalFile: file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: "ready",
          preview,
          dimensions,
          cropArea: { x: 10, y: 10, width: 80, height: 80 }
        }

        validFiles.push(imageFile)
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error)
      }
    }

    if (singleFileOnly) {
      setFiles(validFiles.slice(0, 1))
      if (validFiles.length > 0) {
        setSelectedFile(validFiles[0])
      }
    } else {
      setFiles(prev => [...prev, ...validFiles].slice(0, maxFiles))
    }
  }

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    if (selectedFile?.id === fileId) {
      setSelectedFile(null)
    }
  }

  // Enhanced crop area handling
  const updateCropArea = useCallback((newCropArea: Partial<CropArea>) => {
    let updatedArea = { ...cropArea, ...newCropArea }
    
    // Ensure crop area stays within bounds with proper validation
    updatedArea.x = Math.max(0, Math.min(95, updatedArea.x))
    updatedArea.y = Math.max(0, Math.min(95, updatedArea.y))
    updatedArea.width = Math.max(5, Math.min(100 - updatedArea.x, updatedArea.width))
    updatedArea.height = Math.max(5, Math.min(100 - updatedArea.y, updatedArea.height))
    
    // Ensure crop area doesn't exceed image bounds
    if (updatedArea.x + updatedArea.width > 100) {
      updatedArea.width = 100 - updatedArea.x
    }
    if (updatedArea.y + updatedArea.height > 100) {
      updatedArea.height = 100 - updatedArea.y
    }
    
    setCropArea(updatedArea)
    
    if (selectedFile) {
      setFiles(prev => prev.map(f => 
        f.id === selectedFile.id 
          ? { ...f, cropArea: updatedArea }
          : f
      ))
    }
  }, [cropArea, selectedFile])

  // Enhanced mouse handlers for crop canvas
  const handleMouseDown = useCallback((e: React.MouseEvent, handle?: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    
    if (handle) {
      setIsResizing(true)
      setDragHandle(handle)
    } else {
      setIsDragging(true)
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || (!isDragging && !isResizing)) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top
    
    const deltaX = ((currentX - dragStart.x) / rect.width) * 100
    const deltaY = ((currentY - dragStart.y) / rect.height) * 100

    if (isDragging) {
      // Move crop area
      updateCropArea({
        x: cropArea.x + deltaX,
        y: cropArea.y + deltaY
      })
    } else if (isResizing && dragHandle) {
      // Resize crop area based on handle
      let newCropArea = { ...cropArea }
      
      switch (dragHandle) {
        case "nw":
          newCropArea.x += deltaX
          newCropArea.y += deltaY
          newCropArea.width -= deltaX
          newCropArea.height -= deltaY
          break
        case "ne":
          newCropArea.y += deltaY
          newCropArea.width += deltaX
          newCropArea.height -= deltaY
          break
        case "sw":
          newCropArea.x += deltaX
          newCropArea.width -= deltaX
          newCropArea.height += deltaY
          break
        case "se":
          newCropArea.width += deltaX
          newCropArea.height += deltaY
          break
        case "n":
          newCropArea.y += deltaY
          newCropArea.height -= deltaY
          break
        case "s":
          newCropArea.height += deltaY
          break
        case "w":
          newCropArea.x += deltaX
          newCropArea.width -= deltaX
          break
        case "e":
          newCropArea.width += deltaX
          break
      }
      
      updateCropArea(newCropArea)
    }
    
    setDragStart({ x: currentX, y: currentY })
  }, [isDragging, isResizing, dragHandle, cropArea, dragStart, updateCropArea])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setDragHandle("")
  }, [])

  const processFiles = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one image file",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await processFunction(files, toolOptions)

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success && result.processedFiles) {
        setFiles(result.processedFiles)
        
        if (result.processedFiles.length === 1) {
          // Single file - auto download
          const file = result.processedFiles[0]
          if (file.blob) {
            const url = URL.createObjectURL(file.blob)
            const link = document.createElement("a")
            link.href = url
            link.download = file.name
            link.click()
            URL.revokeObjectURL(url)
          }
        } else {
          // Multiple files - create ZIP
          const JSZip = (await import("jszip")).default
          const zip = new JSZip()
          
          result.processedFiles.forEach(file => {
            if (file.blob) {
              zip.file(file.name, file.blob)
            }
          })
          
          const zipBlob = await zip.generateAsync({ type: "blob" })
          const url = URL.createObjectURL(zipBlob)
          const link = document.createElement("a")
          link.href = url
          link.download = `${toolType}_images.zip`
          link.click()
          URL.revokeObjectURL(url)
        }

        toast({
          title: "Processing complete",
          description: "Your images have been processed and downloaded"
        })
      } else {
        throw new Error(result.error || "Processing failed")
      }
    } catch (error) {
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProgress(0), 2000)
    }
  }

  const applyPreset = (preset: any) => {
    setToolOptions(prev => ({ ...prev, ...preset.values }))
    toast({
      title: "Preset applied",
      description: `${preset.name} settings applied`
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const renderOptionControl = (option: ToolOption) => {
    if (option.condition && !option.condition(toolOptions)) {
      return null
    }

    switch (option.type) {
      case "select":
        return (
          <Select
            value={toolOptions[option.key]?.toString()}
            onValueChange={(value) => setToolOptions(prev => ({ ...prev, [option.key]: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {option.selectOptions?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={toolOptions[option.key] || false}
              onCheckedChange={(checked) => setToolOptions(prev => ({ ...prev, [option.key]: checked }))}
            />
            <Label className="text-sm">{option.label}</Label>
          </div>
        )

      case "slider":
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">{option.label}</Label>
              <span className="text-sm text-muted-foreground">
                {toolOptions[option.key] || option.defaultValue}
              </span>
            </div>
            <Slider
              value={[toolOptions[option.key] || option.defaultValue]}
              onValueChange={([value]) => setToolOptions(prev => ({ ...prev, [option.key]: value }))}
              min={option.min}
              max={option.max}
              step={option.step}
            />
          </div>
        )

      case "input":
      case "text":
        return (
          <Input
            type={option.type === "input" ? "number" : "text"}
            value={toolOptions[option.key] || ""}
            onChange={(e) => setToolOptions(prev => ({ 
              ...prev, 
              [option.key]: option.type === "input" ? Number(e.target.value) : e.target.value 
            }))}
            min={option.min}
            max={option.max}
            step={option.step}
          />
        )

      case "color":
        return (
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={toolOptions[option.key] || option.defaultValue}
              onChange={(e) => setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
              className="w-8 h-8 border rounded cursor-pointer"
            />
            <Input
              value={toolOptions[option.key] || option.defaultValue}
              onChange={(e) => setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
              className="flex-1 font-mono"
            />
          </div>
        )

      default:
        return null
    }
  }

  // Enhanced crop canvas with proper interaction
  const renderCropCanvas = () => {
    if (!selectedFile || toolType !== "crop") return null

    return (
      <div 
        ref={canvasRef}
        className="relative bg-gray-900 rounded-lg overflow-hidden cursor-crosshair"
        style={{ height: "60vh" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background Image */}
        <img
          src={selectedFile.preview}
          alt={selectedFile.name}
          className="w-full h-full object-contain select-none"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            filter: "brightness(0.7)"
          }}
          draggable={false}
        />

        {/* Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="10%" height="10%" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Crop Overlay */}
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/10 cursor-move"
          style={{
            left: `${cropArea.x}%`,
            top: `${cropArea.y}%`,
            width: `${cropArea.width}%`,
            height: `${cropArea.height}%`,
          }}
          onMouseDown={(e) => handleMouseDown(e)}
        >
          {/* Corner Handles */}
          <div 
            className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize hover:scale-125 transition-transform"
            onMouseDown={(e) => handleMouseDown(e, "nw")}
          />
          <div 
            className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-ne-resize hover:scale-125 transition-transform"
            onMouseDown={(e) => handleMouseDown(e, "ne")}
          />
          <div 
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize hover:scale-125 transition-transform"
            onMouseDown={(e) => handleMouseDown(e, "sw")}
          />
          <div 
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-se-resize hover:scale-125 transition-transform"
            onMouseDown={(e) => handleMouseDown(e, "se")}
          />
          
          {/* Edge Handles */}
          <div 
            className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-n-resize hover:scale-125 transition-transform"
            onMouseDown={(e) => handleMouseDown(e, "n")}
          />
          <div 
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-s-resize hover:scale-125 transition-transform"
            onMouseDown={(e) => handleMouseDown(e, "s")}
          />
          <div 
            className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-w-resize hover:scale-125 transition-transform"
            onMouseDown={(e) => handleMouseDown(e, "w")}
          />
          <div 
            className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-e-resize hover:scale-125 transition-transform"
            onMouseDown={(e) => handleMouseDown(e, "e")}
          />

          {/* Center Move Handle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500/50 border border-blue-500 rounded cursor-move flex items-center justify-center">
            <Move className="h-3 w-3 text-white" />
          </div>
        </div>

        {/* Canvas Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <div className="flex items-center space-x-1 bg-black/80 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-white text-xs font-medium min-w-[3rem] text-center">
              {zoomLevel}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoomLevel(Math.min(400, zoomLevel + 25))}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Crop Info */}
        <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs rounded px-2 py-1 font-mono">
          {Math.round(cropArea.x)}, {Math.round(cropArea.y)} • {Math.round(cropArea.width)}×{Math.round(cropArea.height)}%
        </div>

        {/* Aspect Ratio Presets */}
        <div className="absolute bottom-4 right-4 flex space-x-1">
          {["1:1", "4:3", "16:9", "3:2", "free"].map((ratio) => (
            <Button
              key={ratio}
              variant="outline"
              size="sm"
              onClick={() => {
                if (ratio === "free") return
                const [w, h] = ratio.split(':').map(Number)
                const targetRatio = w / h
                const newHeight = cropArea.width / targetRatio
                updateCropArea({ height: Math.min(90, newHeight) })
              }}
              className="text-xs h-7 bg-black/80 text-white border-white/20 hover:bg-white/20"
            >
              {ratio === "free" ? "Free" : ratio}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  const groupedOptions = options.reduce((groups, option) => {
    const section = option.section || "General"
    if (!groups[section]) groups[section] = []
    groups[section].push(option)
    return groups
  }, {} as Record<string, ToolOption[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/image-tools">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Image Tools
            </Button>
          </Link>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-100">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600">{description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Canvas Area */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    {files.length > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                        >
                          {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                        </Button>
                        {!singleFileOnly && (
                          <Badge variant="secondary">
                            {files.length} file{files.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <div
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer ${
                      isDragActive 
                        ? "border-blue-500 bg-blue-50 scale-105" 
                        : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30"
                    }`}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDragActive(false)
                      if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragActive(true)
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      setIsDragActive(false)
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className={`h-16 w-16 mx-auto mb-4 transition-colors ${
                      isDragActive ? "text-blue-500" : "text-gray-400"
                    }`} />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {isDragActive ? "Drop images here" : "Select images"}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Drag and drop or click to browse your files
                    </p>
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                      <Upload className="h-5 w-5 mr-2" />
                      Select Images
                    </Button>
                    <div className="mt-4 text-sm text-gray-500">
                      <p>Maximum {maxFiles} files • Up to 100MB each</p>
                      <p>Supports: {supportedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Crop Canvas for Single File */}
                    {toolType === "crop" && selectedFile ? (
                      renderCropCanvas()
                    ) : (
                      /* Multiple Files Grid */
                      <ScrollArea className="h-96">
                        <div className={`grid gap-4 ${
                          viewMode === "grid" 
                            ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
                            : "grid-cols-1"
                        }`}>
                          {files.map((file) => (
                            <div
                              key={file.id}
                              className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                                selectedFile?.id === file.id 
                                  ? "border-blue-500 bg-blue-50" 
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => setSelectedFile(file)}
                            >
                              <div className="relative">
                                <img
                                  src={file.processed ? file.processedPreview : file.preview}
                                  alt={file.name}
                                  className="w-full h-32 object-cover rounded"
                                />
                                {file.processed && (
                                  <div className="absolute top-2 left-2">
                                    <Badge className="bg-green-100 text-green-800">
                                      Processed
                                    </Badge>
                                  </div>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="absolute top-2 right-2 h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeFile(file.id)
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>{file.dimensions.width}×{file.dimensions.height}</span>
                                  <span>{formatFileSize(file.processed ? file.processedSize || file.size : file.size)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={supportedFormats.join(",")}
                  multiple={!singleFileOnly && maxFiles > 1}
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Fixed Position */}
          <div className="lg:col-span-1">
            <div className="lg:fixed lg:top-24 lg:right-4 lg:w-80 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto space-y-4">
              {/* Crop Controls for Crop Tool */}
              {toolType === "crop" && selectedFile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Crop options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Width (px)</Label>
                        <Input
                          type="number"
                          value={Math.round((cropArea.width / 100) * (selectedFile.dimensions?.width || 800))}
                          onChange={(e) => {
                            const pixelWidth = Number(e.target.value)
                            const percentWidth = (pixelWidth / (selectedFile.dimensions?.width || 800)) * 100
                            updateCropArea({ width: Math.max(5, Math.min(95, percentWidth)) })
                          }}
                          min={1}
                          max={selectedFile.dimensions?.width || 800}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Height (px)</Label>
                        <Input
                          type="number"
                          value={Math.round((cropArea.height / 100) * (selectedFile.dimensions?.height || 600))}
                          onChange={(e) => {
                            const pixelHeight = Number(e.target.value)
                            const percentHeight = (pixelHeight / (selectedFile.dimensions?.height || 600)) * 100
                            updateCropArea({ height: Math.max(5, Math.min(95, percentHeight)) })
                          }}
                          min={1}
                          max={selectedFile.dimensions?.height || 600}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Position X (px)</Label>
                        <Input
                          type="number"
                          value={Math.round((cropArea.x / 100) * (selectedFile.dimensions?.width || 800))}
                          onChange={(e) => {
                            const pixelX = Number(e.target.value)
                            const percentX = (pixelX / (selectedFile.dimensions?.width || 800)) * 100
                            updateCropArea({ x: Math.max(0, Math.min(95, percentX)) })
                          }}
                          min={0}
                          max={(selectedFile.dimensions?.width || 800) - Math.round((cropArea.width / 100) * (selectedFile.dimensions?.width || 800))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Position Y (px)</Label>
                        <Input
                          type="number"
                          value={Math.round((cropArea.y / 100) * (selectedFile.dimensions?.height || 600))}
                          onChange={(e) => {
                            const pixelY = Number(e.target.value)
                            const percentY = (pixelY / (selectedFile.dimensions?.height || 600)) * 100
                            updateCropArea({ y: Math.max(0, Math.min(95, percentY)) })
                          }}
                          min={0}
                          max={(selectedFile.dimensions?.height || 600) - Math.round((cropArea.height / 100) * (selectedFile.dimensions?.height || 600))}
                        />
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => updateCropArea({ x: 10, y: 10, width: 80, height: 80 })}
                      className="w-full"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Crop
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Presets */}
              {presets.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Presets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-2">
                      {presets.map((preset, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          onClick={() => applyPreset(preset)}
                          className="justify-start h-auto p-3"
                        >
                          <div className="text-left">
                            <div className="font-medium">{preset.name}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tool Options - Simplified */}
              {Object.keys(groupedOptions).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Show only essential options */}
                      {Object.entries(groupedOptions).slice(0, 1).map(([section, sectionOptions]) => (
                        <div key={section} className="space-y-3">
                          {sectionOptions.slice(0, 4).map((option) => (
                            <div key={option.key} className="space-y-2">
                              <Label className="text-sm font-medium">{option.label}</Label>
                              {renderOptionControl(option)}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Processing Status */}
              {isProcessing && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Processing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                    <p className="text-sm text-gray-600">
                      Processing your images...
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Action Button */}
              <Card>
                <CardContent className="pt-6">
                  <Button
                    onClick={processFiles}
                    disabled={files.length === 0 || isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Icon className="h-5 w-5 mr-2" />
                        {toolType === "crop" ? "Crop IMAGE" : title}
                      </>
                    )}
                  </Button>
                  
                  {files.length > 0 && !isProcessing && (
                    <p className="text-xs text-center text-gray-500 mt-2">
                      {files.length} image{files.length > 1 ? 's' : ''} ready to process
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* File Info */}
              {selectedFile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Image Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Dimensions:</span>
                        <span className="ml-2 font-medium">
                          {selectedFile.dimensions.width}×{selectedFile.dimensions.height}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Size:</span>
                        <span className="ml-2 font-medium">
                          {formatFileSize(selectedFile.size)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Format:</span>
                        <span className="ml-2 font-medium">
                          {selectedFile.type.split('/')[1].toUpperCase()}
                        </span>
                      </div>
                      {selectedFile.processed && selectedFile.processedSize && (
                        <div>
                          <span className="text-gray-500">New Size:</span>
                          <span className="ml-2 font-medium">
                            {formatFileSize(selectedFile.processedSize)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}