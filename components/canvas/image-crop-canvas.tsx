"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ZoomIn, ZoomOut, RotateCw, FlipHorizontal, FlipVertical,
  Move, Square, Circle, Maximize, Grid, RotateCcw
} from "lucide-react"

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface ImageCropCanvasProps {
  imageFile: File
  imagePreview: string
  cropArea: CropArea
  onCropChange: (cropArea: CropArea) => void
  aspectRatio?: string
  className?: string
}

export function ImageCropCanvas({
  imageFile,
  imagePreview,
  cropArea,
  onCropChange,
  aspectRatio = "free",
  className = ""
}: ImageCropCanvasProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragHandle, setDragHandle] = useState<string>("")
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [zoomLevel, setZoomLevel] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
      }
    }
  }, [imagePreview])

  const handleMouseDown = useCallback((e: React.MouseEvent, handle?: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (handle) {
      setIsResizing(true)
      setDragHandle(handle)
    } else {
      setIsDragging(true)
    }
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top
    
    const deltaX = ((currentX - dragStart.x) / rect.width) * 100
    const deltaY = ((currentY - dragStart.y) / rect.height) * 100

    if (isDragging) {
      // Move crop area
      const newX = Math.max(0, Math.min(100 - cropArea.width, cropArea.x + deltaX))
      const newY = Math.max(0, Math.min(100 - cropArea.height, cropArea.y + deltaY))
      
      onCropChange({ ...cropArea, x: newX, y: newY })
      setDragStart({ x: currentX, y: currentY })
    } else if (isResizing && dragHandle) {
      // Resize crop area
      let newCropArea = { ...cropArea }
      
      switch (dragHandle) {
        case "nw":
          newCropArea.x = Math.max(0, cropArea.x + deltaX)
          newCropArea.y = Math.max(0, cropArea.y + deltaY)
          newCropArea.width = Math.max(5, cropArea.width - deltaX)
          newCropArea.height = Math.max(5, cropArea.height - deltaY)
          break
        case "ne":
          newCropArea.y = Math.max(0, cropArea.y + deltaY)
          newCropArea.width = Math.max(5, cropArea.width + deltaX)
          newCropArea.height = Math.max(5, cropArea.height - deltaY)
          break
        case "sw":
          newCropArea.x = Math.max(0, cropArea.x + deltaX)
          newCropArea.width = Math.max(5, cropArea.width - deltaX)
          newCropArea.height = Math.max(5, cropArea.height + deltaY)
          break
        case "se":
          newCropArea.width = Math.max(5, cropArea.width + deltaX)
          newCropArea.height = Math.max(5, cropArea.height + deltaY)
          break
        case "n":
          newCropArea.y = Math.max(0, cropArea.y + deltaY)
          newCropArea.height = Math.max(5, cropArea.height - deltaY)
          break
        case "s":
          newCropArea.height = Math.max(5, cropArea.height + deltaY)
          break
        case "w":
          newCropArea.x = Math.max(0, cropArea.x + deltaX)
          newCropArea.width = Math.max(5, cropArea.width - deltaX)
          break
        case "e":
          newCropArea.width = Math.max(5, cropArea.width + deltaX)
          break
      }

      // Apply aspect ratio constraint
      if (aspectRatio !== "free") {
        const [ratioW, ratioH] = aspectRatio.split(':').map(Number)
        if (ratioW && ratioH) {
          const targetRatio = ratioW / ratioH
          const currentRatio = newCropArea.width / newCropArea.height
          
          if (currentRatio > targetRatio) {
            newCropArea.width = newCropArea.height * targetRatio
          } else {
            newCropArea.height = newCropArea.width / targetRatio
          }
        }
      }

      // Ensure crop area stays within bounds
      newCropArea.x = Math.max(0, Math.min(100 - newCropArea.width, newCropArea.x))
      newCropArea.y = Math.max(0, Math.min(100 - newCropArea.height, newCropArea.y))
      newCropArea.width = Math.min(100 - newCropArea.x, newCropArea.width)
      newCropArea.height = Math.min(100 - newCropArea.y, newCropArea.height)

      onCropChange(newCropArea)
      setDragStart({ x: currentX, y: currentY })
    }
  }, [isDragging, isResizing, dragHandle, cropArea, dragStart, onCropChange, aspectRatio])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setDragHandle("")
  }, [])

  const resetCrop = () => {
    onCropChange({ x: 10, y: 10, width: 80, height: 80 })
  }

  const centerCrop = () => {
    onCropChange({ 
      x: (100 - cropArea.width) / 2, 
      y: (100 - cropArea.height) / 2, 
      width: cropArea.width, 
      height: cropArea.height 
    })
  }

  const applyAspectRatio = (ratio: string) => {
    if (ratio === "free") return
    
    const [ratioW, ratioH] = ratio.split(':').map(Number)
    if (ratioW && ratioH) {
      const targetRatio = ratioW / ratioH
      const newHeight = cropArea.width / targetRatio
      
      if (cropArea.y + newHeight <= 100) {
        onCropChange({ ...cropArea, height: newHeight })
      } else {
        const newWidth = cropArea.height * targetRatio
        onCropChange({ ...cropArea, width: newWidth })
      }
    }
  }

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Canvas Container */}
      <div
        ref={canvasRef}
        className="relative w-full h-96 overflow-hidden cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background Image */}
        <img
          ref={imageRef}
          src={imagePreview}
          alt="Crop preview"
          className="w-full h-full object-contain select-none"
          style={{
            transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg) ${flipH ? 'scaleX(-1)' : ''} ${flipV ? 'scaleY(-1)' : ''}`,
            filter: "brightness(0.7)"
          }}
          draggable={false}
        />

        {/* Grid Overlay */}
        {showGrid && (
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
        )}

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

        {/* Crop Info Overlay */}
        <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs rounded px-2 py-1 font-mono">
          {Math.round(cropArea.x)}, {Math.round(cropArea.y)} • {Math.round(cropArea.width)}×{Math.round(cropArea.height)}%
        </div>

        {/* Aspect Ratio Info */}
        {aspectRatio !== "free" && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-blue-500 text-white">
              {aspectRatio}
            </Badge>
          </div>
        )}
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

        <div className="flex items-center space-x-1 bg-black/80 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRotation((rotation + 90) % 360)}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFlipH(!flipH)}
            className={`text-white hover:bg-white/20 h-8 w-8 p-0 ${flipH ? 'bg-white/20' : ''}`}
          >
            <FlipHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFlipV(!flipV)}
            className={`text-white hover:bg-white/20 h-8 w-8 p-0 ${flipV ? 'bg-white/20' : ''}`}
          >
            <FlipVertical className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-1 bg-black/80 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
            className={`text-white hover:bg-white/20 h-8 w-8 p-0 ${showGrid ? 'bg-white/20' : ''}`}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={centerCrop}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetCrop}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Aspect Ratio Presets */}
      <div className="absolute bottom-4 right-4 flex space-x-1">
        {["1:1", "4:3", "16:9", "3:2", "free"].map((ratio) => (
          <Button
            key={ratio}
            variant={aspectRatio === ratio ? "default" : "outline"}
            size="sm"
            onClick={() => applyAspectRatio(ratio)}
            className="text-xs h-7"
          >
            {ratio === "free" ? "Free" : ratio}
          </Button>
        ))}
      </div>

      {/* Pixel Dimensions */}
      {imageDimensions.width > 0 && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs rounded px-2 py-1">
          <div>Original: {imageDimensions.width}×{imageDimensions.height}px</div>
          <div>
            Crop: {Math.round((cropArea.width / 100) * imageDimensions.width)}×{Math.round((cropArea.height / 100) * imageDimensions.height)}px
          </div>
        </div>
      )}
    </div>
  )
}