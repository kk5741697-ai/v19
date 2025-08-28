"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, FileText, ImageIcon, QrCode, Code, TrendingUp, Wrench } from "lucide-react"
import Link from "next/link"

interface SearchResult {
  title: string
  description: string
  href: string
  category: string
  icon: any
}

const allTools: SearchResult[] = [
  // PDF Tools
  { title: "PDF Merger", description: "Combine multiple PDF files", href: "/pdf-merger", category: "PDF", icon: FileText },
  { title: "PDF Splitter", description: "Split PDF into separate files", href: "/pdf-splitter", category: "PDF", icon: FileText },
  { title: "PDF Compressor", description: "Reduce PDF file size", href: "/pdf-compressor", category: "PDF", icon: FileText },
  { title: "PDF to Image", description: "Convert PDF to images", href: "/pdf-to-image", category: "PDF", icon: FileText },
  { title: "PDF to Word", description: "Convert PDF to Word document", href: "/pdf-to-word", category: "PDF", icon: FileText },
  { title: "PDF Password Protector", description: "Add password protection", href: "/pdf-password-protector", category: "PDF", icon: FileText },
  { title: "PDF Unlock", description: "Remove password protection", href: "/pdf-unlock", category: "PDF", icon: FileText },
  { title: "PDF Watermark", description: "Add watermarks to PDF", href: "/pdf-watermark", category: "PDF", icon: FileText },
  { title: "PDF Organizer", description: "Reorder and organize pages", href: "/pdf-organizer", category: "PDF", icon: FileText },
  { title: "Image to PDF", description: "Convert images to PDF", href: "/image-to-pdf", category: "PDF", icon: FileText },

  // Image Tools
  { title: "Image Resizer", description: "Resize images with presets", href: "/image-resizer", category: "Image", icon: ImageIcon },
  { title: "Image Compressor", description: "Compress images efficiently", href: "/image-compressor", category: "Image", icon: ImageIcon },
  { title: "Image Converter", description: "Convert between formats", href: "/image-converter", category: "Image", icon: ImageIcon },
  { title: "Image Cropper", description: "Crop images precisely", href: "/image-cropper", category: "Image", icon: ImageIcon },
  { title: "Image Rotator", description: "Rotate and flip images", href: "/image-rotator", category: "Image", icon: ImageIcon },
  { title: "Background Remover", description: "Remove image backgrounds", href: "/background-remover", category: "Image", icon: ImageIcon },
  { title: "Image Flipper", description: "Flip images horizontally/vertically", href: "/image-flipper", category: "Image", icon: ImageIcon },
  { title: "Image Filters", description: "Apply filters and effects", href: "/image-filters", category: "Image", icon: ImageIcon },
  { title: "Image Upscaler", description: "Enlarge images with AI", href: "/image-upscaler", category: "Image", icon: ImageIcon },
  { title: "Image Watermark", description: "Add watermarks to images", href: "/image-watermark", category: "Image", icon: ImageIcon },

  // QR Tools
  { title: "QR Code Generator", description: "Create custom QR codes", href: "/qr-code-generator", category: "QR", icon: QrCode },
  { title: "QR Scanner", description: "Scan QR codes from images", href: "/qr-scanner", category: "QR", icon: QrCode },
  { title: "Barcode Generator", description: "Generate various barcodes", href: "/barcode-generator", category: "QR", icon: QrCode },
  { title: "Bulk QR Generator", description: "Generate multiple QR codes", href: "/bulk-qr-generator", category: "QR", icon: QrCode },
  { title: "WiFi QR Generator", description: "Create WiFi QR codes", href: "/wifi-qr-generator", category: "QR", icon: QrCode },
  { title: "vCard QR Generator", description: "Generate contact QR codes", href: "/vcard-qr-generator", category: "QR", icon: QrCode },

  // Text Tools
  { title: "JSON Formatter", description: "Format and validate JSON", href: "/json-formatter", category: "Text", icon: Code },
  { title: "Base64 Encoder", description: "Encode/decode Base64", href: "/base64-encoder", category: "Text", icon: Code },
  { title: "URL Encoder", description: "Encode/decode URLs", href: "/url-encoder", category: "Text", icon: Code },
  { title: "Text Case Converter", description: "Convert text case", href: "/text-case-converter", category: "Text", icon: Code },
  { title: "Hash Generator", description: "Generate MD5, SHA hashes", href: "/hash-generator", category: "Text", icon: Code },
  { title: "XML Formatter", description: "Format XML documents", href: "/xml-formatter", category: "Text", icon: Code },
  { title: "HTML Formatter", description: "Format HTML code", href: "/html-formatter", category: "Text", icon: Code },
  { title: "CSS Minifier", description: "Minify CSS code", href: "/css-minifier", category: "Text", icon: Code },
  { title: "JavaScript Minifier", description: "Minify JavaScript", href: "/js-minifier", category: "Text", icon: Code },

  // SEO Tools
  { title: "SEO Meta Generator", description: "Generate meta tags", href: "/seo-meta-generator", category: "SEO", icon: TrendingUp },
  { title: "Sitemap Generator", description: "Generate XML sitemaps", href: "/sitemap-generator", category: "SEO", icon: TrendingUp },

  // Utilities
  { title: "Password Generator", description: "Generate secure passwords", href: "/password-generator", category: "Utilities", icon: Wrench },
  { title: "Lorem Ipsum Generator", description: "Generate placeholder text", href: "/lorem-ipsum-generator", category: "Utilities", icon: Wrench },
  { title: "UUID Generator", description: "Generate unique identifiers", href: "/uuid-generator", category: "Utilities", icon: Wrench },
  { title: "Random Number Generator", description: "Generate random numbers", href: "/random-number-generator", category: "Utilities", icon: Wrench },
  { title: "Text Diff Checker", description: "Compare text differences", href: "/text-diff-checker", category: "Utilities", icon: Wrench },
  { title: "Word Counter", description: "Count words and characters", href: "/word-counter", category: "Utilities", icon: Wrench },
  { title: "Unit Converter", description: "Convert units of measurement", href: "/unit-converter", category: "Utilities", icon: Wrench },
  { title: "Currency Converter", description: "Convert currencies", href: "/currency-converter", category: "Utilities", icon: Wrench },
  { title: "Color Converter", description: "Convert color formats", href: "/color-converter", category: "Utilities", icon: Wrench },
]

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const filtered = allTools.filter(tool =>
      tool.title.toLowerCase().includes(query.toLowerCase()) ||
      tool.description.toLowerCase().includes(query.toLowerCase()) ||
      tool.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10)

    setResults(filtered)
  }, [query])

  const handleSelect = (href: string) => {
    onOpenChange(false)
    setQuery("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Tools</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for tools..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {results.length > 0 && (
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {results.map((result) => {
                  const Icon = result.icon
                  return (
                    <Link
                      key={result.href}
                      href={result.href}
                      onClick={() => handleSelect(result.href)}
                      className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{result.title}</h3>
                          <p className="text-sm text-gray-600">{result.description}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {result.category}
                        </Badge>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </ScrollArea>
          )}

          {query && results.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tools found for "{query}"</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}