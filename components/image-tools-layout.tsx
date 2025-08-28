"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Upload, 
  Download, 
  Trash2, 
  X,
  ArrowLeft,
  CheckCircle,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Move,
  Maximize2,
  AlertCircle,
  Info,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Square,
  Circle,
  MousePointer,
  Grid,
  Eye,
  EyeOff,
  Undo,
  Redo,
  Save,
  Settings,
  Layers,
  History,
  Menu,
  Smartphone,
  Monitor
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

interface ImageFile {
  id: string
  file: File
  originalFile?: File
  name: string
  size: number
  preview: string
  dimensions: { width: number; height: number }
  processed?: boolean
  processedPreview?: string
  processedSize?: number
  blob?: Blob
  cropArea?: { x: number; y: number; width: number; height: number }
  history?: Array<{ action: string; timestamp: number; data: any }>
  layers?: Array<{ id: string; name: string; visible: boolean; opacity: number }>
}

interface CropHandle {
  type: "corner" | "edge" | "move"
  position: string
  cursor: string
}

interface HistoryState {
  action: string
  timestamp: number
  files: ImageFile[]
  cropSelection: any
}

interface ToolOption {
  key: string
  label: string
  type: "select" | "slider" | "input" | "checkbox" | "color" | "text"
  defaultValue: any
  min?: number
  max?: number
  step?: number
  selectOptions?: Array<{ value: string; label: string }>
  section?: string
  condition?: (options: any) => boolean
}

interface EnhancedImageToolsLayoutProps {
  title: string
  description: string
  icon: any
  toolType: "resize" | "compress" | "convert" | "crop" | "rotate" | "watermark" | "background" | "filters"
  processFunction: (files: ImageFile[], options: any) => Promise<{ success: boolean; processedFiles?: ImageFile[]; error?: string }>
  options: ToolOption[]
  maxFiles?: number
  singleFileOnly?: boolean
  allowBatchProcessing?: boolean
  supportedFormats?: string[]
  outputFormats?: string[]
  presets?: Array<{ name: string; values: any }>
}

const cropHandles: CropHandle[] = [
  { type: "corner", position: "nw", cursor: "nw-resize" },
  { type: "corner", position: "ne", cursor: "ne-resize" },
  { type: "corner", position: "sw", cursor: "sw-resize" },
  { type: "corner", position: "se", cursor: "se-resize" },
  { type: "edge", position: "n", cursor: "n-resize" },
  { type: "edge", position: "s", cursor: "s-resize" },
  { type: "edge", position: "w", cursor: "w-resize" },
  { type: "edge", position: "e", cursor: "e-resize" },
  { type: "move", position: "center", cursor: "move" }
]

export function ImageToolsLayout({
  title,
  description,
  icon: Icon,
  toolType,
  processFunction,
  options,
  maxFiles = 20,
  singleFileOnly = false,
  allowBatchProcessing = true,
  supportedFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  outputFormats = ["jpeg", "png", "webp"],
  presets = []
}: EnhancedImageToolsLayoutProps) {
  const [files, setFiles] = useState<ImageFile[]>([])
  const [toolOptions, setToolOptions] = useState<Record<string, any>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFiles, setProcessedFiles] = useState<ImageFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [cropSelection, setCropSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [activeHandle, setActiveHandle] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState("options")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Detect mobile and handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarCollapsed(true)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Initialize options with defaults
  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(defaultOptions)
  }, [options])

  // Save state to history
  const saveToHistory = useCallback((action: string) => {
    const newHistoryItem: HistoryState = {
      action,
      timestamp: Date.now(),
      files: JSON.parse(JSON.stringify(files)),
      cropSelection: JSON.parse(JSON.stringify(cropSelection))
    }
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(newHistoryItem)
      return newHistory.slice(-50) // Keep last 50 actions
    })
    setHistoryIndex(prev => prev + 1)
  }, [files, cropSelection, historyIndex])

  // Undo/Redo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setFiles(prevState.files)
      setCropSelection(prevState.cropSelection)
      setHistoryIndex(prev => prev - 1)
      toast({ title: "Undone", description: prevState.action })
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setFiles(nextState.files)
      setCropSelection(nextState.cropSelection)
      setHistoryIndex(prev => prev + 1)
      toast({ title: "Redone", description: nextState.action })
    }
  }, [history, historyIndex])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case 'g':
            e.preventDefault()
            setShowGrid(!showGrid)
            break
          case 's':
            e.preventDefault()
            handleProcess()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, showGrid])

  const handleFileUpload = async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return

    // Validate file types first
    const invalidFiles = Array.from(uploadedFiles).filter(file => 
      !supportedFormats.includes(file.type)
    )
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file types",
        description: `${invalidFiles.length} files are not supported. Please upload ${supportedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} files only.`,
        variant: "destructive"
      })
      return
    }

    if (singleFileOnly && files.length > 0) {
      setFiles([])
      setProcessedFiles([])
    }

    const newFiles: ImageFile[] = []
    const maxFilesToProcess = singleFileOnly ? 1 : Math.min(uploadedFiles.length, maxFiles)
    
    for (let i = 0; i < maxFilesToProcess; i++) {
      const file = uploadedFiles[i]
      if (!supportedFormats.includes(file.type)) continue

      try {
        const preview = await createImagePreview(file)
        const dimensions = await getImageDimensions(file)
        
        const imageFile: ImageFile = {
          id: `${file.name}-${Date.now()}-${i}`,
          file,
          originalFile: file,
          name: file.name,
          size: file.size,
          preview,
          dimensions,
          history: [],
          layers: [{ id: 'base', name: 'Background', visible: true, opacity: 100 }]
        }

        newFiles.push(imageFile)
      } catch (error) {
        toast({
          title: "Error loading image",
          description: `Failed to load ${file.name}`,
          variant: "destructive"
        })
      }
    }

    if (newFiles.length === 0) {
      toast({
        title: "No valid images",
        description: "No valid image files were found to upload.",
        variant: "destructive"
      })
      return
    }

    const updatedFiles = singleFileOnly ? newFiles : [...files, ...newFiles]
    setFiles(updatedFiles)
    
    if (newFiles.length > 0) {
      setSelectedFile(newFiles[0].id)
      saveToHistory("Upload images")
      
      toast({
        title: "Images uploaded",
        description: `${newFiles.length} image${newFiles.length > 1 ? 's' : ''} uploaded successfully`
      })
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFileUpload(e.dataTransfer.files)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    setProcessedFiles(prev => prev.filter(f => f.id !== fileId))
    if (selectedFile === fileId) {
      const remainingFiles = files.filter(f => f.id !== fileId)
      setSelectedFile(remainingFiles.length > 0 ? remainingFiles[0].id : null)
    }
    saveToHistory("Remove file")
  }

  const resetTool = () => {
    setFiles([])
    setProcessedFiles([])
    setSelectedFile(null)
    setCropSelection(null)
    setZoomLevel(100)
    setPanOffset({ x: 0, y: 0 })
    setHistory([])
    setHistoryIndex(-1)
    
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(defaultOptions)
    
    toast({
      title: "Tool reset",
      description: "All files and settings have been reset"
    })
  }

  // Enhanced crop functionality with transform controls
  const handleCropStart = (e: React.MouseEvent<HTMLImageElement>) => {
    if (toolType !== "crop") return
    
    e.preventDefault()
    e.stopPropagation()
    
    const img = e.currentTarget
    const rect = img.getBoundingClientRect()
    
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    const boundedX = Math.max(0, Math.min(95, x))
    const boundedY = Math.max(0, Math.min(95, y))
    
    setDragStart({ x: boundedX, y: boundedY })
    setIsDragging(true)
    setCropSelection({ x: boundedX, y: boundedY, width: 0, height: 0 })
  }

  const handleCropMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (toolType !== "crop" || !isDragging || !dragStart) return
    
    e.preventDefault()
    
    const img = e.currentTarget
    const rect = img.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    const boundedX = Math.max(0, Math.min(100, x))
    const boundedY = Math.max(0, Math.min(100, y))
    
    let newSelection = {
      x: Math.min(dragStart.x, boundedX),
      y: Math.min(dragStart.y, boundedY),
      width: Math.abs(boundedX - dragStart.x),
      height: Math.abs(boundedY - dragStart.y)
    }
    
    // Apply aspect ratio constraint
    if (toolOptions.aspectRatio && toolOptions.aspectRatio !== "free") {
      const [ratioW, ratioH] = toolOptions.aspectRatio.split(':').map(Number)
      if (ratioW && ratioH) {
        const targetRatio = ratioW / ratioH
        
        if (newSelection.width / newSelection.height > targetRatio) {
          newSelection.width = newSelection.height * targetRatio
        } else {
          newSelection.height = newSelection.width / targetRatio
        }
        
        if (newSelection.x + newSelection.width > 100) {
          newSelection.width = 100 - newSelection.x
          newSelection.height = newSelection.width / targetRatio
        }
        if (newSelection.y + newSelection.height > 100) {
          newSelection.height = 100 - newSelection.y
          newSelection.width = newSelection.height * targetRatio
        }
      }
    }
    
    // Snap to grid if enabled
    if (snapToGrid) {
      const gridSize = 5
      newSelection.x = Math.round(newSelection.x / gridSize) * gridSize
      newSelection.y = Math.round(newSelection.y / gridSize) * gridSize
      newSelection.width = Math.round(newSelection.width / gridSize) * gridSize
      newSelection.height = Math.round(newSelection.height / gridSize) * gridSize
    }
    
    setCropSelection(newSelection)
  }

  const handleCropEnd = (e: React.MouseEvent) => {
    if (toolType !== "crop") return
    
    e.preventDefault()
    setIsDragging(false)
    setDragStart(null)
    setActiveHandle(null)
    
    if (cropSelection && selectedFile) {
      const updatedFiles = files.map(file => 
        file.id === selectedFile 
          ? { ...file, cropArea: cropSelection }
          : file
      )
      setFiles(updatedFiles)
      saveToHistory("Adjust crop area")
    }
  }

  // Handle crop handle interactions
  const handleCropHandleStart = (e: React.MouseEvent, handleType: string) => {
    if (toolType !== "crop" || !cropSelection) return
    
    e.preventDefault()
    e.stopPropagation()
    
    setActiveHandle(handleType)
    setIsDragging(true)
    
    const img = imageRef.current
    if (!img) return
    
    const rect = img.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setDragStart({ x, y })
  }

  const handleCropHandleMove = (e: React.MouseEvent) => {
    if (toolType !== "crop" || !isDragging || !activeHandle || !cropSelection || !dragStart) return
    
    e.preventDefault()
    
    const img = imageRef.current
    if (!img) return
    
    const rect = img.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    const deltaX = x - dragStart.x
    const deltaY = y - dragStart.y
    
    let newSelection = { ...cropSelection }
    
    switch (activeHandle) {
      case "nw":
        newSelection.x += deltaX
        newSelection.y += deltaY
        newSelection.width -= deltaX
        newSelection.height -= deltaY
        break
      case "ne":
        newSelection.y += deltaY
        newSelection.width += deltaX
        newSelection.height -= deltaY
        break
      case "sw":
        newSelection.x += deltaX
        newSelection.width -= deltaX
        newSelection.height += deltaY
        break
      case "se":
        newSelection.width += deltaX
        newSelection.height += deltaY
        break
      case "n":
        newSelection.y += deltaY
        newSelection.height -= deltaY
        break
      case "s":
        newSelection.height += deltaY
        break
      case "w":
        newSelection.x += deltaX
        newSelection.width -= deltaX
        break
      case "e":
        newSelection.width += deltaX
        break
      case "center":
        newSelection.x += deltaX
        newSelection.y += deltaY
        break
    }
    
    // Ensure bounds
    newSelection.x = Math.max(0, Math.min(100 - newSelection.width, newSelection.x))
    newSelection.y = Math.max(0, Math.min(100 - newSelection.height, newSelection.y))
    newSelection.width = Math.max(5, Math.min(100 - newSelection.x, newSelection.width))
    newSelection.height = Math.max(5, Math.min(100 - newSelection.y, newSelection.height))
    
    setCropSelection(newSelection)
    setDragStart({ x, y })
  }

  // Touch gesture support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return
    
    if (e.touches.length === 2) {
      // Pinch to zoom
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      setLastPanPoint({ x: distance, y: 0 })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return
    
    if (e.touches.length === 2) {
      // Handle pinch zoom
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      const scale = distance / lastPanPoint.x
      const newZoom = Math.max(25, Math.min(400, zoomLevel * scale))
      setZoomLevel(newZoom)
      setLastPanPoint({ x: distance, y: 0 })
    }
  }

  const handleProcess = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one image file",
        variant: "destructive"
      })
      return
    }

    const invalidFiles = files.filter(file => 
      !supportedFormats.includes(file.file.type)
    )
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Unsupported file formats",
        description: `${invalidFiles.length} files are not supported. Please use ${supportedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} formats only.`,
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    setProcessedFiles([])

    try {
      const result = await processFunction(files, toolOptions)
      
      if (result.success && result.processedFiles) {
        setProcessedFiles(result.processedFiles)
        saveToHistory("Process images")
        toast({
          title: "Processing complete",
          description: `${result.processedFiles.length} images processed successfully`
        })
      } else {
        toast({
          title: "Processing failed",
          description: result.error || "An error occurred",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = async () => {
    if (processedFiles.length === 1) {
      const file = processedFiles[0]
      if (file.blob) {
        const url = URL.createObjectURL(file.blob)
        const link = document.createElement("a")
        link.href = url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast({
          title: "Download started",
          description: `${file.name} downloaded successfully`
        })
      }
    } else if (processedFiles.length > 1) {
      try {
        const JSZip = (await import("jszip")).default
        const zip = new JSZip()
        
        processedFiles.forEach(file => {
          if (file.blob) {
            zip.file(file.name, file.blob)
          }
        })

        const zipBlob = await zip.generateAsync({ type: "blob" })
        const url = URL.createObjectURL(zipBlob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${toolType}_images.zip`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast({
          title: "Download started",
          description: `ZIP file with ${processedFiles.length} images downloaded`
        })
      } catch (error) {
        toast({
          title: "Download failed",
          description: "Failed to create ZIP file",
          variant: "destructive"
        })
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const currentFile = selectedFile ? files.find(f => f.id === selectedFile) : files[0]

  const groupedOptions = options.reduce((acc, option) => {
    const section = option.section || "General"
    if (!acc[section]) acc[section] = []
    acc[section].push(option)
    return acc
  }, {} as Record<string, ToolOption[]>)

  // Render crop handles
  const renderCropHandles = () => {
    if (toolType !== "crop" || !cropSelection) return null
    
    return cropHandles.map((handle) => {
      let style: React.CSSProperties = {
        position: "absolute",
        width: "12px",
        height: "12px",
        backgroundColor: "#3b82f6",
        border: "2px solid white",
        borderRadius: handle.type === "corner" ? "50%" : "2px",
        cursor: handle.cursor,
        zIndex: 10
      }
      
      switch (handle.position) {
        case "nw":
          style.left = `${cropSelection.x}%`
          style.top = `${cropSelection.y}%`
          style.transform = "translate(-50%, -50%)"
          break
        case "ne":
          style.left = `${cropSelection.x + cropSelection.width}%`
          style.top = `${cropSelection.y}%`
          style.transform = "translate(-50%, -50%)"
          break
        case "sw":
          style.left = `${cropSelection.x}%`
          style.top = `${cropSelection.y + cropSelection.height}%`
          style.transform = "translate(-50%, -50%)"
          break
        case "se":
          style.left = `${cropSelection.x + cropSelection.width}%`
          style.top = `${cropSelection.y + cropSelection.height}%`
          style.transform = "translate(-50%, -50%)"
          break
        case "n":
          style.left = `${cropSelection.x + cropSelection.width / 2}%`
          style.top = `${cropSelection.y}%`
          style.transform = "translate(-50%, -50%)"
          break
        case "s":
          style.left = `${cropSelection.x + cropSelection.width / 2}%`
          style.top = `${cropSelection.y + cropSelection.height}%`
          style.transform = "translate(-50%, -50%)"
          break
        case "w":
          style.left = `${cropSelection.x}%`
          style.top = `${cropSelection.y + cropSelection.height / 2}%`
          style.transform = "translate(-50%, -50%)"
          break
        case "e":
          style.left = `${cropSelection.x + cropSelection.width}%`
          style.top = `${cropSelection.y + cropSelection.height / 2}%`
          style.transform = "translate(-50%, -50%)"
          break
        case "center":
          style.left = `${cropSelection.x + cropSelection.width / 2}%`
          style.top = `${cropSelection.y + cropSelection.height / 2}%`
          style.transform = "translate(-50%, -50%)"
          style.cursor = "move"
          style.backgroundColor = "rgba(59, 130, 246, 0.8)"
          break
      }
      
      return (
        <div
          key={handle.position}
          style={style}
          onMouseDown={(e) => handleCropHandleStart(e, handle.position)}
          onMouseMove={handleCropHandleMove}
          onMouseUp={handleCropEnd}
          className="hover:scale-125 transition-transform"
        />
      )
    })
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden bg-gray-50 ${isMobile ? 'flex-col' : ''}`}>
      {/* Left Canvas - Enhanced Image Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Header with more controls */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
            <Badge variant="secondary">{files.length} files</Badge>
            {currentFile && (
              <Badge variant="outline">
                {currentFile.dimensions.width} × {currentFile.dimensions.height}
              </Badge>
            )}
            {isMobile && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {/* History Controls */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="h-4 w-4" />
            </Button>
            
            {/* Canvas Controls */}
            {toolType === "crop" && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowGrid(!showGrid)}
                  className={showGrid ? "bg-blue-50 text-blue-600" : ""}
                  title="Toggle Grid (Ctrl+G)"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSnapToGrid(!snapToGrid)}
                  className={snapToGrid ? "bg-blue-50 text-blue-600" : ""}
                  title="Snap to Grid"
                >
                  <MousePointer className="h-4 w-4" />
                </Button>
              </>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetTool}
              title="Reset Tool"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            {currentFile && (
              <div className="flex items-center space-x-1 border rounded-lg bg-gray-50">
                <Button variant="ghost" size="sm" onClick={() => setZoomLevel(prev => Math.max(25, prev - 25))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm px-3 py-1 bg-white rounded border font-mono">{zoomLevel}%</span>
                <Button variant="ghost" size="sm" onClick={() => setZoomLevel(prev => Math.min(400, prev + 25))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setZoomLevel(100); setPanOffset({ x: 0, y: 0 }) }}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Canvas Content */}
        <div className="flex-1 overflow-hidden">
          {files.length === 0 ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center p-6">
                <div 
                  className="max-w-lg w-full border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 p-12 group"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                    <Upload className="relative h-16 w-16 text-blue-500 group-hover:text-blue-600 transition-colors group-hover:scale-110 transform duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-700 group-hover:text-blue-600 transition-colors">Drop images here</h3>
                  <p className="text-gray-500 mb-4 text-base">or click to browse files</p>
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Images
                  </Button>
                  <div className="mt-4 space-y-1">
                    <p className="text-sm text-gray-500 font-medium">
                      Supported formats: {supportedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}
                    </p>
                    <p className="text-xs text-gray-400">
                      Maximum {maxFiles} files • Up to 100MB each
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Enhanced Image Canvas */}
              <div 
                className="flex-1 overflow-hidden relative bg-gray-100" 
                ref={canvasRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                {/* Grid overlay */}
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none z-5">
                    <svg className="w-full h-full opacity-30">
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>
                )}
                
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  {currentFile && (
                    <div className="relative group max-w-full max-h-full select-none">
                      <div 
                        className="relative inline-block transition-transform duration-200"
                        style={{ 
                          transform: `scale(${zoomLevel / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                          maxWidth: isMobile ? "100vw" : "calc(100vw - 400px)",
                          maxHeight: isMobile ? "60vh" : "calc(100vh - 200px)"
                        }}
                        onMouseDown={toolType === "crop" ? undefined : (e) => {
                          setIsPanning(true)
                          setLastPanPoint({ x: e.clientX, y: e.clientY })
                        }}
                        onMouseMove={toolType === "crop" ? undefined : (e) => {
                          if (!isPanning) return
                          const deltaX = e.clientX - lastPanPoint.x
                          const deltaY = e.clientY - lastPanPoint.y
                          setPanOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }))
                          setLastPanPoint({ x: e.clientX, y: e.clientY })
                        }}
                        onMouseUp={toolType === "crop" ? undefined : () => setIsPanning(false)}
                        onMouseLeave={toolType === "crop" ? undefined : () => setIsPanning(false)}
                      >
                        <img
                          ref={imageRef}
                          src={currentFile.processedPreview || currentFile.preview}
                          alt={currentFile.name}
                          className="max-w-full max-h-[70vh] object-contain border-2 border-gray-300 rounded-lg shadow-xl bg-white"
                          style={{ 
                            userSelect: "none",
                            cursor: toolType === "crop" ? "crosshair" : isPanning ? "grabbing" : "grab"
                          }}
                          onMouseDown={toolType === "crop" ? handleCropStart : undefined}
                          onMouseMove={toolType === "crop" ? handleCropMove : undefined}
                          onMouseUp={toolType === "crop" ? handleCropEnd : undefined}
                          onMouseLeave={toolType === "crop" ? handleCropEnd : undefined}
                          draggable={false}
                        />
                        
                        {/* Enhanced Crop Overlay with Transform Controls */}
                        {toolType === "crop" && cropSelection && (
                          <>
                            {/* Crop Selection Area */}
                            <div
                              className="absolute border-2 border-blue-500 bg-blue-500/10 backdrop-blur-sm"
                              style={{
                                left: `${cropSelection.x}%`,
                                top: `${cropSelection.y}%`,
                                width: `${cropSelection.width}%`,
                                height: `${cropSelection.height}%`
                              }}
                            >
                              {/* Crop Info Tooltip */}
                              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                                <div className="text-center">
                                  {Math.round(cropSelection.width)}% × {Math.round(cropSelection.height)}%
                                </div>
                                {currentFile && (
                                  <div className="text-center mt-1 text-gray-300">
                                    {Math.round((cropSelection.width / 100) * currentFile.dimensions.width)} × {Math.round((cropSelection.height / 100) * currentFile.dimensions.height)} px
                                  </div>
                                )}
                              </div>
                              
                              {/* Rule of thirds grid */}
                              <div className="absolute inset-0 pointer-events-none">
                                <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                                  {Array.from({ length: 9 }).map((_, i) => (
                                    <div key={i} className="border border-white/30"></div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            {/* Transform Handles */}
                            {renderCropHandles()}
                            
                            {/* Darkened overlay for non-selected areas */}
                            <div className="absolute inset-0 pointer-events-none">
                              <div 
                                className="absolute inset-0 bg-black/40"
                                style={{
                                  clipPath: `polygon(
                                    0% 0%, 
                                    0% 100%, 
                                    ${cropSelection.x}% 100%, 
                                    ${cropSelection.x}% ${cropSelection.y}%, 
                                    ${cropSelection.x + cropSelection.width}% ${cropSelection.y}%, 
                                    ${cropSelection.x + cropSelection.width}% ${cropSelection.y + cropSelection.height}%, 
                                    ${cropSelection.x}% ${cropSelection.y + cropSelection.height}%, 
                                    ${cropSelection.x}% 100%, 
                                    100% 100%, 
                                    100% 0%
                                  )`
                                }}
                              />
                            </div>
                          </>
                        )}

                        {/* Enhanced Image Info Overlay */}
                        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center space-x-4">
                            <span>{currentFile.dimensions.width} × {currentFile.dimensions.height}</span>
                            <span>{formatFileSize(currentFile.size)}</span>
                            <span>{currentFile.name.split('.').pop()?.toUpperCase()}</span>
                            <span>Zoom: {zoomLevel}%</span>
                          </div>
                        </div>
                        
                        {/* Canvas Tools Overlay */}
                        {toolType === "crop" && (
                          <div className="absolute top-4 right-4 flex flex-col space-y-2">
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => setCropSelection({ x: 10, y: 10, width: 80, height: 80 })}
                              className="bg-white/90 backdrop-blur-sm"
                            >
                              <Square className="h-4 w-4 mr-2" />
                              Reset Crop
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => setCropSelection({ x: 0, y: 0, width: 100, height: 100 })}
                              className="bg-white/90 backdrop-blur-sm"
                            >
                              <Maximize2 className="h-4 w-4 mr-2" />
                              Select All
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced File Thumbnails Bar */}
              {files.length > 1 && (
                <div className="border-t bg-white p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {files.length} images loaded
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-3 w-3 mr-1" />
                        Add More
                      </Button>
                    </div>
                  </div>
                  <ScrollArea orientation="horizontal">
                    <div className="flex space-x-3">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className={`relative flex-shrink-0 cursor-pointer transition-all duration-200 ${
                            selectedFile === file.id 
                              ? "ring-3 ring-blue-500 scale-105 shadow-lg" 
                              : "hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-gray-300"
                          }`}
                          onClick={() => setSelectedFile(file.id)}
                        >
                          <img
                            src={file.processedPreview || file.preview}
                            alt={file.name}
                            className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 bg-white"
                          />
                          
                          {/* File info overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-lg">
                            <div className="truncate">{file.name}</div>
                            <div className="text-gray-300">{file.dimensions.width}×{file.dimensions.height}</div>
                          </div>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFile(file.id)
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          
                          {file.processed && (
                            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Right Sidebar */}
      <div className={`${isMobile ? 'w-full' : 'w-96'} bg-white ${isMobile ? 'border-t' : 'border-l'} shadow-lg flex flex-col max-h-screen ${isMobile && sidebarCollapsed ? 'hidden' : ''}`}>
        {/* Enhanced Sidebar Header */}
        <div className="px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {isMobile && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSidebarCollapsed(true)}
                className="ml-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>

        {/* Enhanced Sidebar Content with Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Sidebar Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 m-2">
              <TabsTrigger value="options" className="text-xs">
                <Settings className="h-3 w-3 mr-1" />
                Options
              </TabsTrigger>
              <TabsTrigger value="layers" className="text-xs">
                <Layers className="h-3 w-3 mr-1" />
                Layers
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs">
                <History className="h-3 w-3 mr-1" />
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="options" className="flex-1 overflow-hidden">
          <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
              {/* Quick Presets */}
              {presets.length > 0 && (
                  <Card className="p-3">
                  <Label className="text-sm font-medium">Quick Presets</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                    {presets.map((preset) => (
                      <Button
                        key={preset.name}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setToolOptions(prev => ({ ...prev, ...preset.values }))
                          saveToHistory(`Apply preset: ${preset.name}`)
                        }}
                          className="text-xs h-8 hover:bg-blue-50"
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                  </Card>
              )}

              {/* Crop Selection Info */}
              {toolType === "crop" && cropSelection && currentFile && (
                  <Card className="p-3 bg-blue-50 border-blue-200">
                    <Label className="text-sm font-medium text-blue-900 mb-2 block">Crop Selection</Label>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <span className="text-blue-700">Percentage:</span>
                        <div className="font-mono">{Math.round(cropSelection.width)}% × {Math.round(cropSelection.height)}%</div>
                    </div>
                    <div>
                        <span className="text-blue-700">Pixels:</span>
                        <div className="font-mono">
                        {Math.round((cropSelection.width / 100) * currentFile.dimensions.width)} × {Math.round((cropSelection.height / 100) * currentFile.dimensions.height)}
                      </div>
                    </div>
                      <div>
                        <span className="text-blue-700">Position:</span>
                        <div className="font-mono">{Math.round(cropSelection.x)}, {Math.round(cropSelection.y)}</div>
                      </div>
                      <div>
                        <span className="text-blue-700">Aspect:</span>
                        <div className="font-mono">{(cropSelection.width / cropSelection.height).toFixed(2)}</div>
                      </div>
                  </div>
                  </Card>
              )}

              {/* Grouped Options */}
              {Object.entries(groupedOptions).map(([section, sectionOptions]) => (
                  <Card key={section} className="p-3">
                  {section !== "General" && (
                      <Label className="text-sm font-medium text-gray-900 mb-3 block">{section}</Label>
                  )}
                  
                    <div className="space-y-3">
                      {sectionOptions.map((option) => {
                    // Check condition if exists
                    if (option.condition && !option.condition(toolOptions)) {
                      return null
                    }

                    return (
                        <div key={option.key} className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">{option.label}</Label>
                        
                        {option.type === "select" && (
                          <Select
                            value={toolOptions[option.key]?.toString()}
                            onValueChange={(value) => {
                              setToolOptions(prev => ({ ...prev, [option.key]: value }))
                              saveToHistory(`Change ${option.label}`)
                            }}
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
                        )}

                        {option.type === "slider" && (
                          <div className="space-y-2">
                            <Slider
                              value={[toolOptions[option.key] || option.defaultValue]}
                                onValueChange={([value]) => {
                                  setToolOptions(prev => ({ ...prev, [option.key]: value }))
                                }}
                                onValueCommit={() => saveToHistory(`Adjust ${option.label}`)}
                              min={option.min}
                              max={option.max}
                              step={option.step}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{option.min}</span>
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">{toolOptions[option.key] || option.defaultValue}</span>
                              <span>{option.max}</span>
                            </div>
                          </div>
                        )}

                        {option.type === "input" && (
                          <Input
                            type="number"
                            value={toolOptions[option.key] || option.defaultValue}
                            onChange={(e) => {
                              setToolOptions(prev => ({ ...prev, [option.key]: parseInt(e.target.value) || option.defaultValue }))
                            }}
                              onBlur={() => saveToHistory(`Change ${option.label}`)}
                            min={option.min}
                            max={option.max}
                              className="font-mono"
                          />
                        )}

                        {option.type === "checkbox" && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={toolOptions[option.key] || false}
                              onCheckedChange={(checked) => {
                                setToolOptions(prev => ({ ...prev, [option.key]: checked }))
                                saveToHistory(`Toggle ${option.label}`)
                              }}
                            />
                              <Label className="text-sm cursor-pointer">{option.label}</Label>
                          </div>
                        )}

                        {option.type === "color" && (
                            <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={toolOptions[option.key] || option.defaultValue}
                              onChange={(e) => {
                                setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))
                                saveToHistory(`Change ${option.label}`)
                              }}
                                className="w-12 h-10 border-2 border-gray-300 rounded-lg cursor-pointer shadow-sm"
                            />
                            <Input
                              value={toolOptions[option.key] || option.defaultValue}
                              onChange={(e) => {
                                setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))
                              }}
                                onBlur={() => saveToHistory(`Change ${option.label}`)}
                                className="flex-1 font-mono"
                            />
                          </div>
                        )}

                        {option.type === "text" && (
                          <Input
                            value={toolOptions[option.key] || option.defaultValue}
                            onChange={(e) => {
                              setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))
                            }}
                              onBlur={() => saveToHistory(`Change ${option.label}`)}
                            placeholder={option.label}
                          />
                        )}
                        </div>
                    )
                      })}
                    </div>
                  </Card>
              ))}
            </div>
          </ScrollArea>
            </TabsContent>
            
            <TabsContent value="layers" className="flex-1 overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {currentFile?.layers?.map((layer) => (
                    <Card key={layer.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox checked={layer.visible} />
                          <span className="text-sm font-medium">{layer.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{layer.opacity}%</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="history" className="flex-1 overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {history.map((item, index) => (
                    <div 
                      key={index}
                      className={`p-2 rounded-lg text-sm cursor-pointer transition-colors ${
                        index === historyIndex 
                          ? "bg-blue-100 text-blue-900 border border-blue-300" 
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setFiles(item.files)
                        setCropSelection(item.cropSelection)
                        setHistoryIndex(index)
                      }}
                    >
                      <div className="font-medium">{item.action}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No history yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Enhanced Sidebar Footer */}
          <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-gray-100 space-y-3 flex-shrink-0">
            {/* Processing Status */}
            {isProcessing && (
                <Card className="p-3 bg-blue-50 border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-medium text-blue-800">Processing images...</span>
                </div>
                  <Progress value={66} className="h-3" />
                <p className="text-xs text-blue-600 mt-1">This may take a few moments</p>
                </Card>
            )}

            {/* Ready Status */}
            {!isProcessing && files.length > 0 && processedFiles.length === 0 && (
                <Card className="p-3 bg-amber-50 border-amber-200">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-800">Ready to process {files.length} image{files.length > 1 ? 's' : ''}</span>
                </div>
                </Card>
            )}

            {/* Main Action Button */}
            <Button 
              onClick={handleProcess}
              disabled={isProcessing || files.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py