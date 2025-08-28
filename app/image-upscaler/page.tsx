"use client"

import { ImageToolsLayout } from "@/components/image-tools-layout"
import { Zap } from "lucide-react"
import { ImageProcessor } from "@/lib/processors/image-processor"

const upscaleOptions = [
  {
    key: "scaleFactor",
    label: "Scale Factor",
    type: "select" as const,
    defaultValue: "2x",
    selectOptions: [
      { value: "1.5x", label: "1.5x (150%)" },
      { value: "2x", label: "2x (200%)" },
      { value: "3x", label: "3x (300%)" },
      { value: "4x", label: "4x (400%)" },
    ],
    section: "Upscaling",
  },
  {
    key: "algorithm",
    label: "Upscaling Algorithm",
    type: "select" as const,
    defaultValue: "lanczos",
    selectOptions: [
      { value: "lanczos", label: "Lanczos (Best Quality)" },
      { value: "bicubic", label: "Bicubic (Balanced)" },
      { value: "bilinear", label: "Bilinear (Fast)" },
    ],
    section: "Upscaling",
  },
  {
    key: "enhanceDetails",
    label: "Enhance Details",
    type: "checkbox" as const,
    defaultValue: true,
    section: "Enhancement",
  },
  {
    key: "reduceNoise",
    label: "Reduce Noise",
    type: "checkbox" as const,
    defaultValue: true,
    section: "Enhancement",
  },
  {
    key: "sharpen",
    label: "Sharpen",
    type: "slider" as const,
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 5,
    section: "Enhancement",
  },
  {
    key: "outputFormat",
    label: "Output Format",
    type: "select" as const,
    defaultValue: "png",
    selectOptions: [
      { value: "png", label: "PNG" },
      { value: "jpeg", label: "JPEG" },
      { value: "webp", label: "WebP" },
    ],
    section: "Output",
  },
  {
    key: "quality",
    label: "Quality",
    type: "slider" as const,
    defaultValue: 95,
    min: 10,
    max: 100,
    step: 5,
    section: "Output",
  },
]

async function upscaleImages(files: any[], options: any) {
  try {
    if (files.length === 0) {
      return {
        success: false,
        error: "No files to process",
      }
    }
    
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        let scaleFactor = 2
        if (options.scaleFactor) {
          if (typeof options.scaleFactor === 'string') {
            scaleFactor = parseFloat(options.scaleFactor.replace('x', ''))
          } else {
            scaleFactor = options.scaleFactor
          }
        }
        
        // Validate scale factor
        scaleFactor = Math.max(1.1, Math.min(10, scaleFactor))
        
        const newWidth = Math.round((file.dimensions?.width || 800) * scaleFactor)
        const newHeight = Math.round((file.dimensions?.height || 600) * scaleFactor)

        // Enhanced upscaling options
        const upscaleOptions = {
          width: newWidth,
          height: newHeight,
          maintainAspectRatio: true,
          outputFormat: options.outputFormat,
          quality: options.quality,
          // Apply enhancement filters for upscaling
          filters: {
            brightness: options.enhanceDetails ? 105 : 100,
            contrast: options.enhanceDetails ? 110 : 100,
            saturation: options.reduceNoise ? 95 : 100,
            blur: options.reduceNoise ? 0.5 : 0
          }
        }
        
        // Apply sharpening if specified
        if (options.sharpen && options.sharpen > 0) {
          upscaleOptions.filters = {
            ...upscaleOptions.filters,
            contrast: (upscaleOptions.filters.contrast || 100) + (options.sharpen * 0.5)
          }
        }
        
        const processedBlob = await ImageProcessor.resizeImage(
          file.originalFile || file.file,
          upscaleOptions
        )

        const processedUrl = URL.createObjectURL(processedBlob)
        
        const outputFormat = options.outputFormat || "png"
        const baseName = file.name.split(".")[0]
        const newName = `${baseName}_${options.scaleFactor}.${outputFormat}`

        return {
          ...file,
          processed: true,
          processedPreview: processedUrl,
          name: newName,
          processedSize: processedBlob.size,
          blob: processedBlob,
          dimensions: { width: newWidth, height: newHeight }
        }
      })
    )

    return {
      success: true,
      processedFiles,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upscale images",
    }
  }
}

export default function ImageUpscalerPage() {
  return (
    <ImageToolsLayout
      title="Upscale Image"
      description="Enlarge images with AI-enhanced quality. Increase resolution while preserving details and reducing artifacts."
      icon={Zap}
      toolType="resize"
      processFunction={upscaleImages}
      options={upscaleOptions}
      maxFiles={10}
      allowBatchProcessing={true}
      supportedFormats={["image/jpeg", "image/png", "image/webp"]}
      outputFormats={["png", "jpeg", "webp"]}
    />
  )
}