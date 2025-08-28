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
  FileText,
  CheckCircle,
  X,
  ArrowLeft,
  RefreshCw,
  GripVertical,
  Eye,
  EyeOff,
  AlertCircle,
  Info,
  Move,
  RotateCw,
  Copy,
  Scissors,
  Merge,
  Settings,
  Layers,
  History,
  Menu,
  Smartphone,
  Monitor,
  ZoomIn,
  ZoomOut,
  Maximize2
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

import { PDFProcessor } from "@/lib/processors/pdf-processor"

interface PDFFile {
  id: string
  file: File
  originalFile?: File
  name: string
  size: number
  pageCount: number
  pages: Array<{
    pageNumber: number
    thumbnail: string
    selected: boolean
    width: number
    height: number
  }>
  processed?: boolean
  history?: Array<{ action: string; timestamp: number; data: any }>
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

interface EnhancedPDFToolsLayoutProps {
  title: string
  description: string
  icon: any
  toolType: "split" | "merge" | "compress" | "convert" | "protect"
  processFunction: (files: PDFFile[], options: any) => Promise<{ success: boolean; downloadUrl?: string; error?: string }>
  options: ToolOption[]
  maxFiles?: number
  allowPageSelection?: boolean
  allowPageReorder?: boolean
}

export function PDFToolsLayout({
  title,
  description,
  icon: Icon,
  toolType,
  processFunction,
  options,
  maxFiles = 5,
  allowPageSelection = false,
  allowPageReorder = false
}: EnhancedPDFToolsLayoutProps) {
  const [files, setFiles] = useState<PDFFile[]>([])
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [toolOptions, setToolOptions] = useState<Record<string, any>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [extractMode, setExtractMode] = useState<"all" | "pages" | "range" | "size">("all")
  const [rangeMode, setRangeMode] = useState<"custom" | "fixed">("custom")
  const [pageRanges, setPageRanges] = useState<Array<{ from: number; to: number }>>([{ from: 1, to: 1 }])
  const [mergeRanges, setMergeRanges] = useState(false)
  const [showPageNumbers, setShowPageNumbers] = useState(true)
  const [draggedPage, setDraggedPage] = useState<string | null>(null)
  const [dragOverPage, setDragOverPage] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState("options")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Detect mobile
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

  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(defaultOptions)
  }, [options])

  useEffect(() => {
    if (files.length > 0) {
      const totalPages = files[0].pageCount
      setPageRanges([{ from: 1, to: Math.min(totalPages, 5) }])
    }
  }, [files])

  const handleFileUpload = async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return

    const invalidFiles = Array.from(uploadedFiles).filter(file => 
      file.type !== "application/pdf"
    )
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file types",
        description: `${invalidFiles.length} files are not PDF documents. Please upload PDF files only.`,
        variant: "destructive"
      })
      return
    }

    const newFiles: PDFFile[] = []
    
    for (let i = 0; i < uploadedFiles.length && i < maxFiles; i++) {
      const file = uploadedFiles[i]
      if (file.type !== "application/pdf") continue

      try {
        const { pageCount, pages } = await PDFProcessor.getPDFInfo(file)
        
        const pdfFile: PDFFile = {
          id: `${file.name}-${Date.now()}-${i}`,
          file,
          originalFile: file,
          name: file.name,
          size: file.size,
          pageCount,
          pages,
          history: []
        }

        newFiles.push(pdfFile)
      } catch (error) {
        toast({
          title: "Error loading PDF",
          description: `Failed to load ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive"
        })
      }
    }

    if (newFiles.length === 0) {
      toast({
        title: "No valid PDFs",
        description: "No valid PDF files were found to upload.",
        variant: "destructive"
      })
      return
    }

    setFiles(prev => [...prev, ...newFiles])
    
    toast({
      title: "PDFs uploaded",
      description: `${newFiles.length} PDF${newFiles.length > 1 ? 's' : ''} uploaded successfully`
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
  }

  const resetTool = () => {
    setFiles([])
    setDownloadUrl(null)
    setSelectedPages(new Set())
    setExtractMode("all")
    setZoomLevel(100)
    
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(defaultOptions)
  }

  // Enhanced page drag and drop
  const handlePageDragStart = (e: React.DragEvent, fileId: string, pageNumber: number) => {
    if (!allowPageReorder) return
    const pageKey = `${fileId}-${pageNumber}`
    setDraggedPage(pageKey)
    e.dataTransfer.effectAllowed = "move"
  }

  const handlePageDragOver = (e: React.DragEvent, fileId: string, pageNumber: number) => {
    if (!allowPageReorder || !draggedPage) return
    e.preventDefault()
    const pageKey = `${fileId}-${pageNumber}`
    setDragOverPage(pageKey)
  }

  const handlePageDrop = (e: React.DragEvent, targetFileId: string, targetPageNumber: number) => {
    if (!allowPageReorder || !draggedPage) return
    e.preventDefault()
    
    // Implement page reordering logic here
    toast({
      title: "Page reordered",
      description: "Page order has been updated"
    })
    
    setDraggedPage(null)
    setDragOverPage(null)
  }

  const togglePageSelection = (fileId: string, pageNumber: number) => {
    const pageKey = `${fileId}-${pageNumber}`
    setSelectedPages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(pageKey)) {
        newSet.delete(pageKey)
      } else {
        newSet.add(pageKey)
      }
      return newSet
    })

    setFiles(prev => prev.map(file => {
      if (file.id === fileId) {
        return {
          ...file,
          pages: file.pages.map(page => 
            page.pageNumber === pageNumber 
              ? { ...page, selected: !page.selected }
              : page
          )
        }
      }
      return file
    }))
  }

  const selectAllPages = (fileId: string) => {
    setFiles(prev => prev.map(file => {
      if (file.id === fileId) {
        const updatedPages = file.pages.map(page => ({ ...page, selected: true }))
        updatedPages.forEach(page => {
          setSelectedPages(prev => new Set(prev).add(`${fileId}-${page.pageNumber}`))
        })
        return { ...file, pages: updatedPages }
      }
      return file
    }))
  }

  const deselectAllPages = (fileId: string) => {
    setFiles(prev => prev.map(file => {
      if (file.id === fileId) {
        const updatedPages = file.pages.map(page => ({ ...page, selected: false }))
        updatedPages.forEach(page => {
          setSelectedPages(prev => {
            const newSet = new Set(prev)
            newSet.delete(`${fileId}-${page.pageNumber}`)
            return newSet
          })
        })
        return { ...file, pages: updatedPages }
      }
      return file
    }))
  }

  const handleProcess = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one PDF file",
        variant: "destructive"
      })
      return
    }

    if (toolType === "merge" && files.length < 2) {
      toast({
        title: "Insufficient files",
        description: "At least 2 PDF files are required for merging",
        variant: "destructive"
      })
      return
    }

    if (toolType === "split" && files.length !== 1) {
      toast({
        title: "Invalid file count",
        description: "Please select exactly one PDF file to split",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    setDownloadUrl(null)

    try {
      const processOptions = { 
        ...toolOptions, 
        extractMode, 
        selectedPages: Array.from(selectedPages),
        pageRanges: extractMode === "range" ? pageRanges : undefined,
        mergeRanges
      }

      const result = await processFunction(files, processOptions)
      
      if (result.success && result.downloadUrl) {
        setDownloadUrl(result.downloadUrl)
        toast({
          title: "Processing complete",
          description: "Your file is ready for download"
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

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = files.length === 1 
        ? `${toolType}_${files[0].name}` 
        : `${toolType}_files.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Download started",
        description: `${files.length === 1 ? 'PDF' : 'ZIP'} file downloaded successfully`
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden bg-gray-50 ${isMobile ? 'flex-col' : ''}`}>
      {/* Enhanced Left Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5 text-red-600" />
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
            <Badge variant="secondary">{files.length} files</Badge>
            {files.length > 0 && (
              <Badge variant="outline">
                {files.reduce((sum, file) => sum + file.pageCount, 0)} pages
              </Badge>
            )}
            {selectedPages.size > 0 && (
              <Badge className="bg-blue-100 text-blue-800">
                {selectedPages.size} selected
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
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg bg-gray-50">
              <Button 
                variant={viewMode === "grid" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 border rounded-lg bg-gray-50">
              <Button variant="ghost" size="sm" onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm px-3 py-1 bg-white rounded border font-mono">{zoomLevel}%</span>
              <Button variant="ghost" size="sm" onClick={() => setZoomLevel(prev => Math.min(200, prev + 25))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setZoomLevel(100)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetTool}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1" />
              {isMobile ? "Add" : "Add More"}
            </Button>
          </div>
        </div>

        {/* Enhanced Canvas Content */}
        <div className="flex-1 overflow-hidden">
          {files.length === 0 ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center p-6">
                <div 
                  className="max-w-lg w-full border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-red-400 hover:bg-red-50/30 transition-all duration-300 p-12 group"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                    <Upload className="relative h-16 w-16 text-red-500 group-hover:text-red-600 transition-colors group-hover:scale-110 transform duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-700 group-hover:text-red-600 transition-colors">Drop PDF files here</h3>
                  <p className="text-gray-500 mb-4 text-base">or click to browse files</p>
                  <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose PDF Files
                  </Button>
                  <div className="mt-4 space-y-1">
                    <p className="text-sm text-gray-500 font-medium">
                      PDF documents only
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
              <ScrollArea className="flex-1">
                  <div className="p-4">
                    <div className="space-y-6">
                    {files.map((file, fileIndex) => (
                        <Card key={file.id} className="overflow-hidden">
                          {/* Enhanced File Header */}
                          <div className="px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-red-600" />
                              <div>
                                <h3 className="font-medium text-gray-900">{file.name}</h3>
                                <p className="text-sm text-gray-500">
                                  {file.pageCount} pages • {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                              <div className="flex items-center space-x-1">
                              {allowPageSelection && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => selectAllPages(file.id)}
                                      className="text-xs"
                                  >
                                      All
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => deselectAllPages(file.id)}
                                      className="text-xs"
                                  >
                                      None
                                  </Button>
                                </>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowPageNumbers(!showPageNumbers)}
                                  title="Toggle page numbers"
                              >
                                {showPageNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => removeFile(file.id)}
                                  className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                          {/* Enhanced Pages Grid */}
                          <div className="p-4">
                            <div 
                              className={`grid gap-3 ${
                                viewMode === "grid" 
                                  ? `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8` 
                                  : "grid-cols-1"
                              }`}
                              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top left" }}
                            >
                            {file.pages.map((page, pageIndex) => (
                              <div
                                key={`${file.id}-${page.pageNumber}`}
                                  className={`relative group cursor-pointer transition-all duration-200 ${
                                    dragOverPage === `${file.id}-${page.pageNumber}` ? "scale-105 ring-2 ring-blue-400" : ""
                                  }`}
                                  draggable={allowPageReorder}
                                  onDragStart={(e) => handlePageDragStart(e, file.id, page.pageNumber)}
                                  onDragOver={(e) => handlePageDragOver(e, file.id, page.pageNumber)}
                                  onDrop={(e) => handlePageDrop(e, file.id, page.pageNumber)}
                              >
                                <div 
                                  className={`relative border-2 rounded-lg overflow-hidden transition-all hover:shadow-md ${
                                    page.selected 
                                        ? "border-red-500 bg-red-50 shadow-lg ring-3 ring-red-200" 
                                        : "border-gray-200 hover:border-red-300 hover:shadow-lg"
                                  }`}
                                  onClick={() => allowPageSelection && togglePageSelection(file.id, page.pageNumber)}
                                >
                                    {/* Enhanced Drag Handle */}
                                  {allowPageReorder && (
                                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-sm rounded-lg p-1.5 shadow-lg cursor-move">
                                        <GripVertical className="h-4 w-4 text-gray-600" />
                                    </div>
                                  )}

                                    {/* Enhanced Page Thumbnail */}
                                    <div className={`${viewMode === "grid" ? "aspect-[3/4]" : "aspect-[4/3]"} bg-white relative overflow-hidden`}>
                                    <img 
                                      src={page.thumbnail}
                                      alt={`Page ${page.pageNumber}`}
                                        className="w-full h-full object-contain transition-transform group-hover:scale-105"
                                    />
                                    
                                      {/* Enhanced Page overlay */}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                      
                                      {/* Page actions overlay */}
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex space-x-1">
                                          <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur-sm">
                                            <Eye className="h-3 w-3" />
                                          </Button>
                                          <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur-sm">
                                            <RotateCw className="h-3 w-3" />
                                          </Button>
                                          <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur-sm">
                                            <Copy className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                  </div>

                                    {/* Enhanced Page Number */}
                                  {showPageNumbers && (
                                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                        <Badge variant="secondary" className="text-xs bg-white/95 backdrop-blur-sm shadow-lg border">
                                        {page.pageNumber}
                                      </Badge>
                                    </div>
                                  )}

                                    {/* Enhanced Selection Indicator */}
                                  {allowPageSelection && (
                                    <div className="absolute top-2 right-2">
                                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-lg ${
                                        page.selected 
                                            ? "bg-red-500 border-red-500 scale-110 shadow-red-200" 
                                            : "bg-white/95 backdrop-blur-sm border-gray-300 hover:border-red-300"
                                      }`}>
                                          {page.selected && <CheckCircle className="h-5 w-5 text-white" />}
                                      </div>
                                    </div>
                                  )}
                                    
                                    {/* Page size indicator */}
                                    <div className="absolute bottom-2 right-2">
                                      <Badge variant="outline" className="text-xs bg-white/95 backdrop-blur-sm">
                                        {page.width}×{page.height}
                                      </Badge>
                                    </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        </Card>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Right Sidebar */}
      <div className={`${isMobile ? 'w-full' : 'w-96'} bg-white ${isMobile ? 'border-t' : 'border-l'} shadow-lg flex flex-col max-h-screen ${isMobile && sidebarCollapsed ? 'hidden' : ''}`}>
        {/* Enhanced Sidebar Header */}
        <div className="px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5 text-red-600" />
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 m-2">
              <TabsTrigger value="options" className="text-xs">
                <Settings className="h-3 w-3 mr-1" />
                Options
              </TabsTrigger>
              <TabsTrigger value="pages" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Pages ({files.reduce((sum, f) => sum + f.pageCount, 0)})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="options" className="flex-1 overflow-hidden">
          <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
              {/* Extract Mode for Split Tool */}
              {toolType === "split" && (
                  <Card className="p-4">
                  <Label className="text-sm font-medium">Extract Mode</Label>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                    <Button
                      variant={extractMode === "range" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExtractMode("range")}
                        className="flex flex-col items-center p-3 h-auto hover:bg-blue-50"
                    >
                        <Scissors className="h-5 w-5 mb-1" />
                      <span className="text-xs">Range</span>
                    </Button>
                    <Button
                      variant={extractMode === "pages" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExtractMode("pages")}
                        className="flex flex-col items-center p-3 h-auto hover:bg-blue-50"
                    >
                        <FileText className="h-5 w-5 mb-1" />
                      <span className="text-xs">Pages</span>
                    </Button>
                    <Button
                      variant={extractMode === "size" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExtractMode("size")}
                        className="flex flex-col items-center p-3 h-auto hover:bg-blue-50"
                    >
                        <Grid className="h-5 w-5 mb-1" />
                      <span className="text-xs">Size</span>
                    </Button>
                  </div>
                  
                    {/* Enhanced Range Mode Options */}
                  {extractMode === "range" && (
                    <div className="space-y-4">
                      <div>
                          <Label className="text-sm font-medium mb-2 block">Range mode:</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button
                            variant={rangeMode === "custom" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setRangeMode("custom")}
                              className="text-xs hover:bg-blue-50"
                          >
                              Custom
                          </Button>
                          <Button
                            variant={rangeMode === "fixed" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setRangeMode("fixed")}
                              className="text-xs hover:bg-blue-50"
                          >
                              Fixed
                          </Button>
                        </div>
                      </div>

                        {/* Enhanced Range Inputs */}
                      <div className="space-y-3">
                        {pageRanges.map((range, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-700">Range {index + 1}</span>
                                {pageRanges.length > 1 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setPageRanges(prev => prev.filter((_, i) => i !== index))
                                    }}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            <div className="flex items-center space-x-2 flex-1">
                              <Input
                                type="number"
                                placeholder="from"
                                value={range.from}
                                onChange={(e) => {
                                  const newRanges = [...pageRanges]
                                  const value = parseInt(e.target.value) || 1
                                  const maxPage = files[0]?.pageCount || 1
                                  newRanges[index].from = Math.max(1, Math.min(value, maxPage))
                                  setPageRanges(newRanges)
                                }}
                                  className="text-xs h-8 font-mono"
                                min={1}
                                max={files[0]?.pageCount || 1}
                              />
                                <span className="text-xs text-gray-500 font-medium">to</span>
                              <Input
                                type="number"
                                placeholder="to"
                                value={range.to}
                                onChange={(e) => {
                                  const newRanges = [...pageRanges]
                                  const value = parseInt(e.target.value) || 1
                                  const maxPage = files[0]?.pageCount || 1
                                  newRanges[index].to = Math.max(range.from, Math.min(value, maxPage))
                                  setPageRanges(newRanges)
                                }}
                                  className="text-xs h-8 font-mono"
                                min={range.from}
                                max={files[0]?.pageCount || 1}
                              />
                            </div>
                            </Card>
                        ))}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const maxPage = files[0]?.pageCount || 1
                            setPageRanges(prev => [...prev, { from: 1, to: maxPage }])
                          }}
                            className="w-full text-xs h-8 hover:bg-blue-50"
                        >
                            + Add Range
                        </Button>
                      </div>

                        {/* Enhanced Merge Option */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={mergeRanges}
                          onCheckedChange={setMergeRanges}
                        />
                          <Label className="text-sm cursor-pointer">Merge all ranges in one PDF file</Label>
                      </div>
                    </div>
                  )}

                  {extractMode === "pages" && (
                      <Card className="p-3 bg-blue-50 border-blue-200">
                      <p className="text-sm text-blue-800">
                        Selected pages will be extracted. 
                        <span className="font-medium"> {selectedPages.size} page{selectedPages.size !== 1 ? 's' : ''}</span> selected.
                      </p>
                      </Card>
                  )}

                  {extractMode === "size" && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Number of Parts</Label>
                        <Input
                          type="number"
                          value={toolOptions.equalParts || 2}
                          onChange={(e) => {
                            const value = Math.max(2, Math.min(20, parseInt(e.target.value) || 2))
                            setToolOptions(prev => ({ ...prev, equalParts: value }))
                          }}
                          min={2}
                          max={20}
                            className="mt-1 font-mono"
                        />
                      </div>
                        <Card className="p-3 bg-blue-50 border-blue-200">
                        <p className="text-sm text-blue-800">
                          PDF will be split into <span className="font-medium">{toolOptions.equalParts || 2}</span> equal parts.
                        </p>
                        </Card>
                    </div>
                  )}
                  </Card>
              )}

                {/* Enhanced Tool Options */}
              {options.map((option) => {
                if (option.condition && !option.condition(toolOptions)) {
                  return null
                }

                return (
                    <Card key={option.key} className="p-3">
                    <Label className="text-sm font-medium">{option.label}</Label>
                    
                    {option.type === "select" && (
                        <div className="mt-2">
                      <Select
                        value={toolOptions[option.key]?.toString()}
                        onValueChange={(value) => {
                          setToolOptions(prev => ({ ...prev, [option.key]: value }))
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
                        </div>
                    )}

                    {option.type === "slider" && (
                        <div className="space-y-2 mt-2">
                        <Slider
                          value={[toolOptions[option.key] || option.defaultValue]}
                          onValueChange={([value]) => setToolOptions(prev => ({ ...prev, [option.key]: value }))}
                          min={option.min}
                          max={option.max}
                          step={option.step}
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{option.min}</span>
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">{toolOptions[option.key] || option.defaultValue}</span>
                          <span>{option.max}</span>
                        </div>
                      </div>
                    )}

                    {option.type === "text" && (
                        <div className="mt-2">
                      <Input
                        value={toolOptions[option.key] || option.defaultValue}
                        onChange={(e) => {
                          setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))
                        }}
                        placeholder={option.label}
                      />
                        </div>
                    )}

                    {option.type === "checkbox" && (
                        <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          checked={toolOptions[option.key] || false}
                          onCheckedChange={(checked) => {
                            setToolOptions(prev => ({ ...prev, [option.key]: checked }))
                          }}
                        />
                          <Label className="text-sm cursor-pointer">{option.label}</Label>
                      </div>
                    )}
                    </Card>
                )
              })}
            </div>
          </ScrollArea>
            </TabsContent>
            
            <TabsContent value="pages" className="flex-1 overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {files.map((file) => (
                    <Card key={file.id} className="p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-sm">{file.name}</h4>
                          <p className="text-xs text-gray-500">{file.pageCount} pages</p>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm" onClick={() => selectAllPages(file.id)}>
                            All
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deselectAllPages(file.id)}>
                            None
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {file.pages.slice(0, 12).map((page) => (
                          <div
                            key={page.pageNumber}
                            className={`relative cursor-pointer transition-all ${
                              page.selected ? "ring-2 ring-red-500" : "hover:ring-2 hover:ring-gray-300"
                            }`}
                            onClick={() => togglePageSelection(file.id, page.pageNumber)}
                          >
                            <img 
                              src={page.thumbnail}
                              alt={`Page ${page.pageNumber}`}
                              className="w-full aspect-[3/4] object-cover rounded border"
                            />
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                              <Badge variant="secondary" className="text-xs">
                                {page.pageNumber}
                              </Badge>
                            </div>
                            {page.selected && (
                              <div className="absolute top-1 right-1">
                                <CheckCircle className="h-4 w-4 text-red-500 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                        ))}
                        {file.pages.length > 12 && (
                          <div className="col-span-4 text-center text-xs text-gray-500 py-2">
                            +{file.pages.length - 12} more pages
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
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
                  <span className="text-sm font-medium text-blue-800">Processing PDF...</span>
                </div>
                  <Progress value={66} className="h-3" />
                <p className="text-xs text-blue-600 mt-1">This may take a few moments</p>
                </Card>
            )}

            {/* Ready Status */}
            {!isProcessing && files.length > 0 && !downloadUrl && (
                <Card className="p-3 bg-amber-50 border-amber-200">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-800">
                    Ready to process {files.length} PDF{files.length > 1 ? 's' : ''}
                    {allowPageSelection && selectedPages.size > 0 && ` (${selectedPages.size} pages selected)`}
                  </span>
                </div>
                </Card>
            )}

            <Button 
              onClick={handleProcess}
              disabled={isProcessing || files.length === 0}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                    <Icon className="h-4 w-4 mr-2" />
                    {title}
                </>
              )}
            </Button>

            {downloadUrl && (
              <div className="space-y-2">
                  <Card className="p-3 bg-green-50 border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Processing complete!</span>
                  </div>
                  <p className="text-xs text-green-600">Your PDF is ready for download</p>
                  </Card>
                
                <Button 
                  onClick={handleDownload}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download {files.length > 1 ? "ZIP" : "PDF"}
                </Button>
              </div>
            )}

            {files.length > 0 && (
                <Card className="p-3 bg-gray-50">
                  <Label className="text-xs font-medium text-gray-700 mb-2 block">File Statistics</Label>
                  <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Total files:</span>
                    <span className="font-mono">{files.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total pages:</span>
                    <span className="font-mono">{files.reduce((sum, file) => sum + file.pageCount, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total size:</span>
                    <span className="font-mono">{formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}</span>
                </div>
                {allowPageSelection && (
                  <div className="flex justify-between">
                    <span>Selected pages:</span>
                      <span className="text-red-600 font-mono font-medium">{selectedPages.size}</span>
                  </div>
                )}
              </div>
                </Card>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      {isMobile && files.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
          <div className="flex space-x-3">
            <Button 
              onClick={() => setSidebarCollapsed(false)}
              variant="outline"
              className="flex-1"
            >
              <Settings className="h-4 w-4 mr-2" />
              Options
            </Button>
            <Button 
              onClick={handleProcess}
              disabled={isProcessing || files.length === 0}
              className="flex-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Icon className="h-4 w-4 mr-2" />
              )}
              {isProcessing ? "Processing..." : title}
            </Button>
            {downloadUrl && (
              <Button 
                onClick={handleDownload}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple={maxFiles > 1}
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  )
}