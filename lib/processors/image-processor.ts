// Real image processing utilities using Canvas API for client-side processing
export interface ImageProcessingOptions {
  quality?: number
  width?: number
  height?: number
  maintainAspectRatio?: boolean
  outputFormat?: "jpeg" | "png" | "webp" | "gif"
  backgroundColor?: string
  watermarkText?: string
  watermarkOpacity?: number
  rotation?: number
  flipHorizontal?: boolean
  flipVertical?: boolean
  cropArea?: { x: number; y: number; width: number; height: number }
  compressionLevel?: "low" | "medium" | "high" | "maximum"
  removeBackground?: boolean
  position?: string
  textColor?: string
  shadowEnabled?: boolean
  filters?: {
    brightness?: number
    contrast?: number
    saturation?: number
    blur?: number
    sepia?: boolean
    grayscale?: boolean
  }
}

export class ImageProcessor {
  static async resizeImage(file: File, options: ImageProcessingOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      const img = new Image()
      img.onload = () => {
        try {
          let { width: targetWidth, height: targetHeight } = options
          const { naturalWidth: originalWidth, naturalHeight: originalHeight } = img

          // Calculate dimensions based on resize mode
          if (options.maintainAspectRatio && targetWidth && targetHeight) {
            const aspectRatio = originalWidth / originalHeight
            if (targetWidth / targetHeight > aspectRatio) {
              targetWidth = targetHeight * aspectRatio
            } else {
              targetHeight = targetWidth / aspectRatio
            }
          } else if (targetWidth && !targetHeight) {
            targetHeight = (targetWidth / originalWidth) * originalHeight
          } else if (targetHeight && !targetWidth) {
            targetWidth = (targetHeight / originalHeight) * originalWidth
          }

          canvas.width = targetWidth || originalWidth
          canvas.height = targetHeight || originalHeight

          // Apply background color if needed
          if (options.backgroundColor && options.outputFormat !== "png") {
            ctx.fillStyle = options.backgroundColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          }

          // Apply transformations
          ctx.save()
          
          // Handle flipping
          let scaleX = 1, scaleY = 1
          if (options.flipHorizontal) scaleX = -1
          if (options.flipVertical) scaleY = -1
          
          if (scaleX !== 1 || scaleY !== 1) {
            ctx.translate(canvas.width / 2, canvas.height / 2)
            ctx.scale(scaleX, scaleY)
            ctx.translate(-canvas.width / 2, -canvas.height / 2)
          }

          // Handle rotation
          if (options.rotation) {
            const angle = (options.rotation * Math.PI) / 180
            ctx.translate(canvas.width / 2, canvas.height / 2)
            ctx.rotate(angle)
            ctx.translate(-canvas.width / 2, -canvas.height / 2)
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          ctx.restore()

          const quality = Math.max(0.1, Math.min(1.0, (options.quality || 90) / 100))
          const mimeType = `image/${options.outputFormat || "png"}`

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error("Failed to create blob"))
              }
            },
            mimeType,
            quality,
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  static async compressImage(file: File, options: ImageProcessingOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      const img = new Image()
      img.onload = () => {
        try {
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight

          // Apply compression level adjustments
          let quality = options.quality || 80
          switch (options.compressionLevel) {
            case "low":
              quality = Math.max(quality, 85)
              break
            case "medium":
              quality = Math.min(Math.max(quality, 60), 85)
              break
            case "high":
              quality = Math.min(Math.max(quality, 40), 70)
              break
            case "maximum":
              quality = Math.min(quality, 50)
              break
          }

          ctx.drawImage(img, 0, 0)

          const mimeType = `image/${options.outputFormat || "jpeg"}`
          const normalizedQuality = Math.max(0.1, Math.min(1.0, quality / 100))

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error("Failed to create blob"))
              }
            },
            mimeType,
            normalizedQuality,
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  static async cropImage(file: File, cropArea: any, options: ImageProcessingOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      const img = new Image()
      img.onload = () => {
        try {
          // Ensure cropArea has valid values
          const validCropArea = {
            x: Math.max(0, Math.min(100, cropArea?.x || 10)),
            y: Math.max(0, Math.min(100, cropArea?.y || 10)),
            width: Math.max(1, Math.min(100, cropArea?.width || 80)),
            height: Math.max(1, Math.min(100, cropArea?.height || 80))
          }

          const cropX = (validCropArea.x / 100) * img.naturalWidth
          const cropY = (validCropArea.y / 100) * img.naturalHeight
          const cropWidth = (validCropArea.width / 100) * img.naturalWidth
          const cropHeight = (validCropArea.height / 100) * img.naturalHeight

          // Ensure crop dimensions are valid
          const finalCropWidth = Math.min(cropWidth, img.naturalWidth - cropX)
          const finalCropHeight = Math.min(cropHeight, img.naturalHeight - cropY)

          if (finalCropWidth <= 0 || finalCropHeight <= 0) {
            reject(new Error("Invalid crop area"))
            return
          }

          canvas.width = finalCropWidth
          canvas.height = finalCropHeight

          if (options.backgroundColor) {
            ctx.fillStyle = options.backgroundColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          }

          ctx.drawImage(
            img, 
            cropX, cropY, finalCropWidth, finalCropHeight,
            0, 0, finalCropWidth, finalCropHeight
          )

          const quality = Math.max(0.1, Math.min(1.0, (options.quality || 95) / 100))
          const mimeType = `image/${options.outputFormat || "png"}`

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error("Failed to create blob"))
              }
            },
            mimeType,
            quality,
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  static async rotateImage(file: File, options: ImageProcessingOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      const img = new Image()
      img.onload = () => {
        try {
          const angle = ((options.rotation || 0) * Math.PI) / 180
          const { naturalWidth: width, naturalHeight: height } = img

          // Calculate new canvas dimensions after rotation
          const cos = Math.abs(Math.cos(angle))
          const sin = Math.abs(Math.sin(angle))
          const newWidth = width * cos + height * sin
          const newHeight = width * sin + height * cos

          canvas.width = newWidth
          canvas.height = newHeight

          // Fill background if specified
          if (options.backgroundColor) {
            ctx.fillStyle = options.backgroundColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          }

          // Move to center and rotate
          ctx.translate(newWidth / 2, newHeight / 2)
          ctx.rotate(angle)
          ctx.drawImage(img, -width / 2, -height / 2)

          const quality = Math.max(0.1, Math.min(1.0, (options.quality || 95) / 100))
          const mimeType = `image/${options.outputFormat || "png"}`

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error("Failed to create blob"))
              }
            },
            mimeType,
            quality,
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  static async addWatermark(file: File, watermarkText: string, options: ImageProcessingOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx || !watermarkText) {
        reject(new Error("Canvas not supported or watermark text not specified"))
        return
      }

      const img = new Image()
      img.onload = () => {
        try {
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight

          ctx.drawImage(img, 0, 0)

          // Calculate font size based on image dimensions
          const fontSize = Math.min(canvas.width, canvas.height) * 0.05
          ctx.font = `bold ${fontSize}px Arial`
          ctx.fillStyle = options.textColor || "#ffffff"
          ctx.globalAlpha = Math.max(0.1, Math.min(1.0, options.watermarkOpacity || 0.5))

          // Position watermark
          let x = canvas.width / 2
          let y = canvas.height / 2

          switch (options.position) {
            case "top-left":
              x = fontSize
              y = fontSize * 2
              ctx.textAlign = "left"
              break
            case "top-right":
              x = canvas.width - fontSize
              y = fontSize * 2
              ctx.textAlign = "right"
              break
            case "bottom-left":
              x = fontSize
              y = canvas.height - fontSize
              ctx.textAlign = "left"
              break
            case "bottom-right":
              x = canvas.width - fontSize
              y = canvas.height - fontSize
              ctx.textAlign = "right"
              break
            case "diagonal":
              ctx.translate(canvas.width / 2, canvas.height / 2)
              ctx.rotate(-Math.PI / 4)
              x = 0
              y = 0
              ctx.textAlign = "center"
              break
            default: // center
              ctx.textAlign = "center"
              break
          }

          ctx.textBaseline = "middle"

          // Add text shadow if enabled
          if (options.shadowEnabled) {
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
            ctx.shadowBlur = 4
            ctx.shadowOffsetX = 2
            ctx.shadowOffsetY = 2
          }

          ctx.fillText(watermarkText, x, y)

          const quality = Math.max(0.1, Math.min(1.0, (options.quality || 90) / 100))
          const mimeType = `image/${options.outputFormat || "png"}`

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error("Failed to create blob"))
              }
            },
            mimeType,
            quality,
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  static async removeBackground(file: File, options: ImageProcessingOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      const img = new Image()
      img.onload = () => {
        try {
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight

          ctx.drawImage(img, 0, 0)

          // Enhanced background removal with edge detection
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data

          // Sample corner pixels to determine background color
          const corners = [
            [0, 0], // top-left
            [canvas.width - 1, 0], // top-right
            [0, canvas.height - 1], // bottom-left
            [canvas.width - 1, canvas.height - 1], // bottom-right
          ]

          const bgColors = corners.map(([x, y]) => {
            const index = (y * canvas.width + x) * 4
            return [data[index], data[index + 1], data[index + 2]]
          })

          // Use most common corner color as background
          const bgColor = bgColors[0]

          // Enhanced edge detection and background removal
          const sensitivity = Math.max(0.1, Math.min(1.0, (options.quality || 30) / 100))
          const threshold = 50 * sensitivity

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]

            const colorDistance = Math.sqrt(
              Math.pow(r - bgColor[0], 2) + Math.pow(g - bgColor[1], 2) + Math.pow(b - bgColor[2], 2),
            )

            if (colorDistance < threshold) {
              data[i + 3] = 0 // Make transparent
            } else {
              // Apply edge smoothing for better results
              const alpha = Math.min(255, Math.max(0, (colorDistance - threshold) * 5))
              data[i + 3] = alpha
            }
          }

          ctx.putImageData(imageData, 0, 0)

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Failed to create blob"))
            }
          }, "image/png") // Always use PNG for transparency
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  static async convertFormat(file: File, outputFormat: "jpeg" | "png" | "webp", options: ImageProcessingOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      const img = new Image()
      img.onload = () => {
        try {
          let { width: targetWidth, height: targetHeight } = options
          const { naturalWidth: originalWidth, naturalHeight: originalHeight } = img

          // Handle resizing during conversion
          if (targetWidth && targetHeight) {
            if (options.maintainAspectRatio) {
              const aspectRatio = originalWidth / originalHeight
              if (targetWidth / targetHeight > aspectRatio) {
                targetWidth = targetHeight * aspectRatio
              } else {
                targetHeight = targetWidth / aspectRatio
              }
            }
          } else {
            targetWidth = originalWidth
            targetHeight = originalHeight
          }

          canvas.width = targetWidth
          canvas.height = targetHeight

          // Add background color for formats that don't support transparency
          if (options.backgroundColor && outputFormat !== "png") {
            ctx.fillStyle = options.backgroundColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          }

          // Apply transformations
          ctx.save()
          
          // Handle flipping
          let scaleX = 1, scaleY = 1
          if (options.flipHorizontal) scaleX = -1
          if (options.flipVertical) scaleY = -1
          
          if (scaleX !== 1 || scaleY !== 1) {
            ctx.translate(canvas.width / 2, canvas.height / 2)
            ctx.scale(scaleX, scaleY)
            ctx.translate(-canvas.width / 2, -canvas.height / 2)
          }

          // Handle rotation
          if (options.rotation) {
            const angle = (options.rotation * Math.PI) / 180
            ctx.translate(canvas.width / 2, canvas.height / 2)
            ctx.rotate(angle)
            ctx.translate(-canvas.width / 2, -canvas.height / 2)
          }

          // Apply filters if specified
          if (options.filters) {
            const filters = []
            const { brightness, contrast, saturation, blur, sepia, grayscale } = options.filters

            if (brightness !== undefined && brightness !== 100) filters.push(`brightness(${brightness}%)`)
            if (contrast !== undefined && contrast !== 100) filters.push(`contrast(${contrast}%)`)
            if (saturation !== undefined && saturation !== 100) filters.push(`saturate(${saturation}%)`)
            if (blur !== undefined && blur > 0) filters.push(`blur(${blur}px)`)
            if (sepia) filters.push("sepia(100%)")
            if (grayscale) filters.push("grayscale(100%)")

            if (filters.length > 0) {
              ctx.filter = filters.join(" ")
            }
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          ctx.restore()

          const quality = Math.max(0.1, Math.min(1.0, (options.quality || 90) / 100))
          const mimeType = `image/${outputFormat}`

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error("Failed to create blob"))
              }
            },
            mimeType,
            quality,
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  static async applyFilters(file: File, options: ImageProcessingOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx || !options.filters) {
        reject(new Error("Canvas not supported or no filters specified"))
        return
      }

      const img = new Image()
      img.onload = () => {
        try {
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight

          // Apply CSS filters
          const filters = []
          const { brightness, contrast, saturation, blur, sepia, grayscale } = options.filters

          if (brightness !== undefined && brightness !== 100) filters.push(`brightness(${brightness}%)`)
          if (contrast !== undefined && contrast !== 100) filters.push(`contrast(${contrast}%)`)
          if (saturation !== undefined && saturation !== 100) filters.push(`saturate(${saturation}%)`)
          if (blur !== undefined && blur > 0) filters.push(`blur(${blur}px)`)
          if (sepia) filters.push("sepia(100%)")
          if (grayscale) filters.push("grayscale(100%)")

          if (filters.length > 0) {
            ctx.filter = filters.join(" ")
          }

          ctx.drawImage(img, 0, 0)

          const quality = Math.max(0.1, Math.min(1.0, (options.quality || 90) / 100))
          const mimeType = `image/${options.outputFormat || "png"}`

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error("Failed to create blob"))
              }
            },
            mimeType,
            quality,
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }
}