"use client"

import { useState, useEffect, useRef } from "react"
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
  CheckCircle, AlertCircle, FileText, ArrowLeft, ArrowRight,
  Grid, List, ZoomIn, ZoomOut, Move, RotateCw, Copy,
  GripVertical, X, Plus, Minus, ArrowUp, ArrowDown
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { PDFProcessor, type PDFPageInfo } from "@/lib/processors/pdf-processor"
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

interface PDFToolsLayoutProps {
  title: string
  description: string
  icon: any
  toolType: "merge" | "split" | "compress" | "convert" | "protect"
  processFunction: (files: any[], options: any) => Promise<{ success: boolean; downloadUrl?: string; error?: string }>
  options?: ToolOption[]
  maxFiles?: number
  allowPageReorder?: boolean
  allowPageSelection?: boolean
}

export function PDFToolsLayout({
  title,
  description,
  icon: Icon,
  toolType,
  processFunction,
  options = [],
  maxFiles = 10,
  allowPageReorder = false,
  allowPageSelection = false
}: PDFToolsLayoutProps) {
  const [files, setFiles] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [toolOptions, setToolOptions] = useState<Record<string, any>>({})
  const [pdfPages, setPdfPages] = useState<PDFPageInfo[]>([])
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [zoomLevel, setZoomLevel] = useState(100)
  const [extractMode, setExtractMode] = useState("all")
  const [pageRanges, setPageRanges] = useState("")
  const [isDragActive, setIsDragActive] = useState(false)
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null)
  const isMobile = useIsMobile()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize options
  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(defaultOptions)
  }, [options])

  // Load PDF pages when files change
  useEffect(() => {
    if (files.length > 0 && (allowPageSelection || allowPageReorder)) {
      loadPDFPages()
    }
  }, [files])

  const loadPDFPages = async () => {
    if (files.length === 0) return

    try {
      const file = files[0]
      const pdfInfo = await PDFProcessor.getPDFInfo(file.originalFile || file.file)
      setPdfPages(pdfInfo.pages)
    } catch (error) {
      console.error("Failed to load PDF pages:", error)
      toast({
        title: "PDF Load Error",
        description: "Failed to load PDF pages for preview",
        variant: "destructive"
      })
    }
  }

  const handleFileUpload = async (uploadedFiles: FileList) => {
    const newFiles = Array.from(uploadedFiles).slice(0, maxFiles).map((file, index) => ({
      id: `${file.name}-${Date.now()}-${index}`,
      file,
      originalFile: file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "ready",
      preview: null
    }))

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles))
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    if (files.length <= 1) {
      setPdfPages([])
      setSelectedPages(new Set())
    }
  }

  const togglePageSelection = (pageKey: string) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(pageKey)) {
        newSet.delete(pageKey)
      } else {
        newSet.add(pageKey)
      }
      return newSet
    })
  }

  const selectAllPages = () => {
    const allPageKeys = pdfPages.map(page => `page-${page.pageNumber}`)
    setSelectedPages(new Set(allPageKeys))
  }

  const clearSelection = () => {
    setSelectedPages(new Set())
  }

  // Enhanced page reordering with drag and drop
  const handlePageDragStart = (e: React.DragEvent, pageIndex: number) => {
    setDraggedPageIndex(pageIndex)
    e.dataTransfer.effectAllowed = "move"
  }

  const handlePageDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handlePageDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    
    if (draggedPageIndex === null || draggedPageIndex === targetIndex) return
    
    const newPages = [...pdfPages]
    const draggedPage = newPages[draggedPageIndex]
    
    // Remove from old position
    newPages.splice(draggedPageIndex, 1)
    
    // Insert at new position
    const insertIndex = draggedPageIndex < targetIndex ? targetIndex - 1 : targetIndex
    newPages.splice(insertIndex, 0, draggedPage)
    
    // Update page numbers
    newPages.forEach((page, index) => {
      page.pageNumber = index + 1
    })
    
    setPdfPages(newPages)
    setDraggedPageIndex(null)
    
    toast({
      title: "Page reordered",
      description: `Moved page to position ${insertIndex + 1}`
    })
  }

  const movePageUp = (pageIndex: number) => {
    if (pageIndex === 0) return
    
    const newPages = [...pdfPages]
    const temp = newPages[pageIndex]
    newPages[pageIndex] = newPages[pageIndex - 1]
    newPages[pageIndex - 1] = temp
    
    // Update page numbers
    newPages.forEach((page, index) => {
      page.pageNumber = index + 1
    })
    
    setPdfPages(newPages)
  }

  const movePageDown = (pageIndex: number) => {
    if (pageIndex === pdfPages.length - 1) return
    
    const newPages = [...pdfPages]
    const temp = newPages[pageIndex]
    newPages[pageIndex] = newPages[pageIndex + 1]
    newPages[pageIndex + 1] = temp
    
    // Update page numbers
    newPages.forEach((page, index) => {
      page.pageNumber = index + 1
    })
    
    setPdfPages(newPages)
  }

  const processFiles = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one PDF file",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      // Prepare options with page selection data
      const processOptions = {
        ...toolOptions,
        selectedPages: Array.from(selectedPages),
        extractMode,
        pageRanges: pageRanges ? parsePageRanges(pageRanges) : undefined,
        pageOrder: pdfPages.map(page => page.pageNumber)
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await processFunction(files, processOptions)

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success && result.downloadUrl) {
        // Auto-download
        const link = document.createElement("a")
        link.href = result.downloadUrl
        link.download = `${toolType}_${Date.now()}.${toolType === "convert" ? "zip" : "pdf"}`
        link.click()

        toast({
          title: "Processing complete",
          description: "Your file has been processed and downloaded"
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

  const parsePageRanges = (ranges: string) => {
    return ranges.split(',').map(range => {
      const [from, to] = range.trim().split('-').map(n => parseInt(n.trim()))
      return { from: from || 1, to: to || from || 1 }
    }).filter(range => !isNaN(range.from) && !isNaN(range.to))
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/pdf-tools">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to PDF Tools
            </Button>
          </Link>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 rounded-lg bg-red-100">
              <Icon className="h-6 w-6 text-red-600" />
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
                  <CardTitle className="text-lg">Split</CardTitle>
                  <div className="flex items-center space-x-2">
                    {pdfPages.length > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                        >
                          {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                        </Button>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                          >
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-gray-500 min-w-[3rem] text-center">
                            {zoomLevel}%
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                        </div>
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
                        ? "border-red-500 bg-red-50 scale-105" 
                        : "border-gray-300 hover:border-red-400 hover:bg-red-50/30"
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
                      isDragActive ? "text-red-500" : "text-gray-400"
                    }`} />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {isDragActive ? "Drop PDF files here" : "Select PDF files"}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Drag and drop or click to browse your files
                    </p>
                    <Button size="lg" className="bg-red-600 hover:bg-red-700">
                      <Upload className="h-5 w-5 mr-2" />
                      Select PDF Files
                    </Button>
                    <div className="mt-4 text-sm text-gray-500">
                      <p>Maximum {maxFiles} files • Up to 100MB each</p>
                      <p>Supports PDF format only</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* File List */}
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div key={file.id} className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
                          <FileText className="h-8 w-8 text-red-600" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Enhanced PDF Pages Preview with Drag & Drop */}
                    {pdfPages.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">PDF Pages ({pdfPages.length})</h3>
                          <div className="flex space-x-2">
                            {allowPageSelection && (
                              <>
                                <Button variant="outline" size="sm" onClick={selectAllPages}>
                                  Select All
                                </Button>
                                <Button variant="outline" size="sm" onClick={clearSelection}>
                                  Clear
                                </Button>
                              </>
                            )}
                            {allowPageReorder && (
                              <Badge variant="secondary" className="text-xs">
                                Drag to reorder
                              </Badge>
                            )}
                          </div>
                        </div>

                        <ScrollArea className="h-96">
                          <div className={`grid gap-4 ${
                            viewMode === "grid" 
                              ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
                              : "grid-cols-1"
                          }`}>
                            {pdfPages.map((page, index) => {
                              const pageKey = `page-${page.pageNumber}`
                              const isSelected = selectedPages.has(pageKey)
                              
                              return (
                                <div
                                  key={pageKey}
                                  className={`relative border-2 rounded-lg p-1 transition-all ${
                                    isSelected 
                                      ? "border-blue-500 bg-blue-50" 
                                      : "border-gray-200 hover:border-gray-300"
                                  } ${allowPageReorder ? "cursor-move" : "cursor-pointer"}`}
                                  style={{ transform: `scale(${zoomLevel / 100})` }}
                                  onClick={() => allowPageSelection && togglePageSelection(pageKey)}
                                  draggable={allowPageReorder}
                                  onDragStart={(e) => allowPageReorder && handlePageDragStart(e, index)}
                                  onDragOver={allowPageReorder ? handlePageDragOver : undefined}
                                  onDrop={(e) => allowPageReorder && handlePageDrop(e, index)}
                                >
                                  {/* Green checkmark for selected pages */}
                                  {isSelected && (
                                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center z-10">
                                      <CheckCircle className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                  
                                  <img
                                    src={page.thumbnail}
                                    alt={`Page ${page.pageNumber}`}
                                    className="w-full h-auto rounded border"
                                  />
                                  
                                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                                    <Badge variant="secondary" className="text-xs">
                                      {page.pageNumber}
                                    </Badge>
                                  </div>
                                  
                                  {allowPageReorder && (
                                    <div className="absolute bottom-1 right-1 flex flex-col space-y-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          movePageUp(index)
                                        }}
                                        disabled={index === 0}
                                      >
                                        <ArrowUp className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          movePageDown(index)
                                        }}
                                        disabled={index === pdfPages.length - 1}
                                      >
                                        <ArrowDown className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple={maxFiles > 1}
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Fixed Position */}
          <div className="lg:col-span-1">
            <div className="lg:fixed lg:top-24 lg:right-4 lg:w-80 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto space-y-4">
              {/* Page Selection for Split Tool */}
              {toolType === "split" && pdfPages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Split Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Extract Mode</Label>
                      <Select value={extractMode} onValueChange={setExtractMode}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Extract all pages</SelectItem>
                          <SelectItem value="pages">Select pages</SelectItem>
                          <SelectItem value="range">Page ranges</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {extractMode === "range" && (
                      <div>
                        <Label>Page Ranges</Label>
                        <Input
                          value={pageRanges}
                          onChange={(e) => setPageRanges(e.target.value)}
                          placeholder="1-3, 5, 7-9"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Example: 1-3, 5, 7-9
                        </p>
                      </div>
                    )}

                    {extractMode === "pages" && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          Selected pages will be converted into separate PDF files. 
                          {selectedPages.size} PDF{selectedPages.size !== 1 ? 's' : ''} will be created.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tool Options - Simplified */}
              {Object.keys(groupedOptions).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Show only essential options */}
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 border-2 border-gray-300 rounded flex items-center justify-center">
                              <div className="w-3 h-4 border border-gray-400"></div>
                            </div>
                            <span className="text-sm font-medium">Range</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 border-2 border-blue-500 rounded flex items-center justify-center bg-blue-50">
                              <div className="grid grid-cols-2 gap-0.5">
                                <div className="w-1 h-1 bg-blue-500"></div>
                                <div className="w-1 h-1 bg-blue-500"></div>
                                <div className="w-1 h-1 bg-blue-500"></div>
                                <div className="w-1 h-1 bg-blue-500"></div>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-blue-600">Pages</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 border-2 border-gray-300 rounded flex items-center justify-center">
                              <div className="grid grid-cols-2 gap-0.5">
                                <div className="w-1 h-1 bg-gray-400"></div>
                                <div className="w-1 h-1 bg-gray-400"></div>
                                <div className="w-1 h-1 bg-gray-400"></div>
                                <div className="w-1 h-1 bg-gray-400"></div>
                              </div>
                            </div>
                            <span className="text-sm font-medium">Size</span>
                          </div>
                        </div>
                        <div key={section} className="space-y-3">
                          {sectionOptions.slice(0, 3).map((option) => (
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
                      Processing your PDF files...
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
                    className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-semibold"
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
                        Split PDF ⚡
                      </>
                    )}
                  </Button>
                  
                  {files.length > 0 && !isProcessing && (
                    <p className="text-xs text-center text-gray-500 mt-2">
                      {files.length} file{files.length > 1 ? 's' : ''} ready to process
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* File Info */}
              {files.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">File Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total Files:</span>
                        <span className="ml-2 font-medium">{files.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Size:</span>
                        <span className="ml-2 font-medium">
                          {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
                        </span>
                      </div>
                      {pdfPages.length > 0 && (
                        <>
                          <div>
                            <span className="text-gray-500">Total Pages:</span>
                            <span className="ml-2 font-medium">{pdfPages.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Selected:</span>
                            <span className="ml-2 font-medium">{selectedPages.size}</span>
                          </div>
                        </>
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