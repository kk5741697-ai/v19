"use client"

import { ImageToolsLayout } from "@/components/image-tools-layout"
import { Crop } from "lucide-react"
import { ImageProcessor } from "@/lib/processors/image-processor"

const cropOptions = [
  {
    key: "aspectRatio",
    label: "Aspect Ratio",
    type: "select" as const,
    defaultValue: "free",
    selectOptions: [
      { value: "free", label: "Free" },
      { value: "1:1", label: "Square (1:1)" },
      { value: "4:3", label: "Standard (4:3)" },
      { value: "16:9", label: "Widescreen (16:9)" },
      { value: "3:2", label: "Photo (3:2)" },
      { value: "9:16", label: "Mobile (9:16)" },
      { value: "3:1", label: "Twitter Header (3:1)" },
      { value: "4:1", label: "LinkedIn Banner (4:1)" },
      { value: "2:3", label: "Pinterest Pin (2:3)" },
      { value: "5:4", label: "Instagram Portrait (5:4)" },
      { value: "1.91:1", label: "Facebook Cover (1.91:1)" },
    ],
    section: "Crop Settings",
  },
  {
    key: "cropPreset",
    label: "Social Media Presets",
    type: "select" as const,
    defaultValue: "custom",
    selectOptions: [
      { value: "custom", label: "Custom Size" },
      { value: "instagram-post", label: "Instagram Post (1080x1080)" },
      { value: "instagram-story", label: "Instagram Story (1080x1920)" },
      { value: "facebook-post", label: "Facebook Post (1200x630)" },
      { value: "twitter-post", label: "Twitter Post (1200x675)" },
      { value: "youtube-thumbnail", label: "YouTube Thumbnail (1280x720)" },
      { value: "linkedin-post", label: "LinkedIn Post (1200x627)" },
    ],
    section: "Crop Settings",
  },
  {
    key: "cropWidth",
    label: "Width (px)",
    type: "input" as const,
    defaultValue: 800,
    min: 1,
    max: 10000,
    section: "Dimensions",
  },
  {
    key: "cropHeight", 
    label: "Height (px)",
    type: "input" as const,
    defaultValue: 600,
    min: 1,
    max: 10000,
    section: "Dimensions",
  },
  {
    key: "positionX",
    label: "Position X (px)",
    type: "input" as const,
    defaultValue: 0,
    min: 0,
    section: "Position",
  },
  {
    key: "positionY",
    label: "Position Y (px)", 
    type: "input" as const,
    defaultValue: 0,
    min: 0,
    section: "Position",
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
  {
    key: "borderRadius",
    label: "Border Radius (px)",
    type: "slider" as const,
    defaultValue: 0,
    min: 0,
    max: 50,
    step: 1,
    section: "Style",
  },
  {
    key: "shadowBlur",
    label: "Shadow Blur",
    type: "slider" as const,
    defaultValue: 0,
    min: 0,
    max: 20,
    step: 1,
    section: "Style",
  },
]

const cropPresets = [
  { name: "Instagram Post", values: { aspectRatio: "1:1" } },
  { name: "YouTube Thumbnail", values: { aspectRatio: "16:9" } },
  { name: "Facebook Cover", values: { aspectRatio: "16:9" } },
  { name: "Twitter Header", values: { aspectRatio: "3:1" } },
  { name: "LinkedIn Banner", values: { aspectRatio: "4:1" } },
  { name: "Pinterest Pin", values: { aspectRatio: "2:3" } },
]

async function cropImages(files: any[], options: any) {
  try {
    if (files.length === 0) {
      return {
        success: false,
        error: "No files to process",
      }
    }
    
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        // Use the crop area from the file or from options
        let cropArea = file.cropArea || {
          x: Math.max(0, options.positionX || 0),
          y: Math.max(0, options.positionY || 0), 
          width: Math.max(10, options.cropWidth || 80),
          height: Math.max(10, options.cropHeight || 80)
        }
        
        // Convert pixel values to percentages if needed
        if (options.cropWidth && options.cropHeight && file.dimensions) {
          cropArea = {
            x: (options.positionX / file.dimensions.width) * 100,
            y: (options.positionY / file.dimensions.height) * 100,
            width: (options.cropWidth / file.dimensions.width) * 100,
            height: (options.cropHeight / file.dimensions.height) * 100
          }
        }
        
        // Apply aspect ratio constraints if specified
        if (options.aspectRatio && options.aspectRatio !== "free") {
          const [ratioW, ratioH] = options.aspectRatio.split(':').map(Number)
          if (ratioW && ratioH) {
            const targetRatio = ratioW / ratioH
            const currentRatio = cropArea.width / cropArea.height
            
            if (currentRatio > targetRatio) {
              cropArea.width = cropArea.height * targetRatio
            } else {
              cropArea.height = cropArea.width / targetRatio
            }
          }
        }
        
        // Handle social media presets
        if (options.cropPreset && options.cropPreset !== "custom") {
          const presetDimensions = getPresetDimensions(options.cropPreset)
          if (presetDimensions) {
            const { width: presetWidth, height: presetHeight } = presetDimensions
            const imageAspectRatio = (file.dimensions?.width || 800) / (file.dimensions?.height || 600)
            const presetAspectRatio = presetWidth / presetHeight
            
            if (imageAspectRatio > presetAspectRatio) {
              const newWidth = (presetAspectRatio * (file.dimensions?.height || 600) / (file.dimensions?.width || 800)) * 100
              cropArea = {
                x: (100 - newWidth) / 2,
                y: 0,
                width: newWidth,
                height: 100
              }
            } else {
              const newHeight = ((file.dimensions?.width || 800) / presetAspectRatio / (file.dimensions?.height || 600)) * 100
              cropArea = {
                x: 0,
                y: (100 - newHeight) / 2,
                width: 100,
                height: newHeight
              }
            }
          }
        }
        
        const processedBlob = await ImageProcessor.cropImage(
          file.originalFile || file.file,
          cropArea,
          { 
            outputFormat: options.outputFormat || "png", 
            quality: options.quality || 95,
            borderRadius: options.borderRadius || 0,
            shadowBlur: options.shadowBlur || 0
          }
        )

        const processedUrl = URL.createObjectURL(processedBlob)
        
        const outputFormat = options.outputFormat || "png"
        const baseName = file.name.split(".")[0]
        const newName = `${baseName}_cropped.${outputFormat}`

        return {
          ...file,
          processed: true,
          processedPreview: processedUrl,
          name: newName,
          processedSize: processedBlob.size,
          blob: processedBlob
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
      error: error instanceof Error ? error.message : "Failed to crop images",
    }
  }
}

// Helper function for preset dimensions
function getPresetDimensions(preset: string) {
  const presets: Record<string, { width: number; height: number }> = {
    "instagram-post": { width: 1080, height: 1080 },
    "instagram-story": { width: 1080, height: 1920 },
    "facebook-post": { width: 1200, height: 630 },
    "twitter-post": { width: 1200, height: 675 },
    "youtube-thumbnail": { width: 1280, height: 720 },
    "linkedin-post": { width: 1200, height: 627 }
  }
  return presets[preset]
}

export default function ImageCropperPage() {
  return (
    <ImageToolsLayout
      title="Crop Image"
      description="Crop images with precision using our visual editor and aspect ratio presets."
      icon={Crop}
      toolType="crop"
      processFunction={cropImages}
      options={cropOptions}
      singleFileOnly={true}
      presets={cropPresets}
      supportedFormats={["image/jpeg", "image/png", "image/webp", "image/gif"]}
      outputFormats={["png", "jpeg", "webp"]}
    />
  )
}