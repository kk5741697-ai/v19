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
  const [cropMode, setCropMode] = useState(false)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 10, y: 10, width: 80, height: 80 })
  const [isDragActive, setIsDragActive] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [zoomLevel, setZoomLevel] = useState(100)
  const [canvasMode, setCanvasMode] = useState<"select" | "crop" | "move">("select")
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const isMobile = useIsMobile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cropOverlayRef = useRef<HTMLDivElement>(null)

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

  const updateCropArea = useCallback((newCropArea: Partial<CropArea>) => {
    setCropArea(prev => ({ ...prev, ...newCropArea }))
    if (selectedFile) {
      setFiles(prev => prev.map(f => 
        f.id === selectedFile.id 
          ? { ...f, cropArea: { ...f.cropArea, ...newCropArea } }
          : f
      ))
    }
  }, [selectedFile])

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (canvasMode === "crop" && selectedFile) {
      setIsDragging(true)
      const rect = e.currentTarget.getBoundingClientRect()
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging && canvasMode === "crop" && selectedFile) {
      const rect = e.currentTarget.getBoundingClientRect()
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top
      
      const deltaX = ((currentX - dragStart.x) / rect.width) * 100
      const deltaY = ((currentY - dragStart.y) / rect.height) * 100
      
      updateCropArea({
        x: Math.max(0, Math.min(90, cropArea.x + deltaX)),
        y: Math.max(0, Math.min(90, cropArea.y + deltaY))
      })
      
      setDragStart({ x: currentX, y: currentY })
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

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

  const groupedOptions = options.reduce((groups, option) => {
    const section = option.section || "General"
    if (!groups[section]) groups[section] = []
    groups[section].push(option)
    return groups
  }, {} as Record<string, ToolOption[]>)

  const renderCropCanvas = () => {
    if (!selectedFile || toolType !== "crop") return null

    return (
      <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <img
          src={selectedFile.preview}
          alt={selectedFile.name}
          className="w-full h-full object-contain"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        />
        
        {/* Crop Overlay */}
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move"
          style={{
            left: `${cropArea.x}%`,
            top: `${cropArea.y}%`,
            width: `${cropArea.width}%`,
            height: `${cropArea.height}%`,
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        >
          {/* Resize Handles */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize"></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize"></div>
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize"></div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize"></div>
          
          {/* Edge Handles */}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-n-resize"></div>
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-s-resize"></div>
          <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-w-resize"></div>
          <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-e-resize"></div>
        </div>

        {/* Canvas Tools */}
        <div className="absolute top-4 left-4 flex space-x-2">
          <Button
            variant={canvasMode === "select" ? "default" : "outline"}
            size="sm"
            onClick={() => setCanvasMode("select")}
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            variant={canvasMode === "crop" ? "default" : "outline"}
            size="sm"
            onClick={() => setCanvasMode("crop")}
          >
            <Crop className="h-4 w-4" />
          </Button>
          <Button
            variant={canvasMode === "move" ? "default" : "outline"}
            size="sm"
            onClick={() => setCanvasMode("move")}
          >
            <Hand className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-lg p-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[3rem] text-center">
            {zoomLevel}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(Math.min(400, zoomLevel + 25))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Crop Info */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
          <div>X: {Math.round(cropArea.x)}% Y: {Math.round(cropArea.y)}%</div>
          <div>W: {Math.round(cropArea.width)}% H: {Math.round(cropArea.height)}%</div>
        </div>
      </div>
    )
  }

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
                  <CardTitle className="text-lg">Canvas</CardTitle>
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
                    {/* Single File Canvas for Crop Tool */}
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

          {/* Right Sidebar */}
          <div className="space-y-6">
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
                          <div className="text-xs text-gray-500">
                            {Object.entries(preset.values).slice(0, 2).map(([key, value]) => 
                              `${key}: ${value}`
                            ).join(', ')}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Crop Controls */}
            {toolType === "crop" && selectedFile && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Crop Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">X Position</Label>
                      <Input
                        type="number"
                        value={Math.round(cropArea.x)}
                        onChange={(e) => updateCropArea({ x: Number(e.target.value) })}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Y Position</Label>
                      <Input
                        type="number"
                        value={Math.round(cropArea.y)}
                        onChange={(e) => updateCropArea({ y: Number(e.target.value) })}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Width</Label>
                      <Input
                        type="number"
                        value={Math.round(cropArea.width)}
                        onChange={(e) => updateCropArea({ width: Number(e.target.value) })}
                        min={1}
                        max={100}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Height</Label>
                      <Input
                        type="number"
                        value={Math.round(cropArea.height)}
                        onChange={(e) => updateCropArea({ height: Number(e.target.value) })}
                        min={1}
                        max={100}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Aspect Ratio Presets</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: "1:1", ratio: 1 },
                        { name: "4:3", ratio: 4/3 },
                        { name: "16:9", ratio: 16/9 },
                        { name: "3:2", ratio: 3/2 }
                      ].map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newHeight = cropArea.width / preset.ratio
                            updateCropArea({ height: Math.min(90, newHeight) })
                          }}
                        >
                          {preset.name}
                        </Button>
                      ))}
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

            {/* Tool Options */}
            {Object.keys(groupedOptions).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={Object.keys(groupedOptions)[0]} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      {Object.keys(groupedOptions).slice(0, 2).map((section) => (
                        <TabsTrigger key={section} value={section} className="text-xs">
                          {section}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {Object.entries(groupedOptions).map(([section, sectionOptions]) => (
                      <TabsContent key={section} value={section} className="space-y-4 mt-4">
                        {sectionOptions.map((option) => (
                          <div key={option.key} className="space-y-2">
                            <Label className="text-sm font-medium">{option.label}</Label>
                            {renderOptionControl(option)}
                          </div>
                        ))}
                      </TabsContent>
                    ))}
                  </Tabs>
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
                      {title}
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

      <Footer />
    </div>
  )
}