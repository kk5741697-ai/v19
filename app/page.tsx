"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchDialog } from "@/components/search/search-dialog"
import { APP_CONFIG } from "@/lib/config"
import { 
  Maximize, Crop, FileImage, ArrowUpDown, Edit3, Zap, ImageIcon, Download, Palette, Upload, Archive,
  FileType, QrCode, Code, TrendingUp, Wrench, Globe, Scissors, Lock, RefreshCw, Search, Star,
  Shield, Users, Crown, CheckCircle
} from "lucide-react"
import Link from "next/link"

const featuredTools = [
  {
    title: "Compress Image",
    description: "Compress JPG, PNG, WebP, and GIFs while saving space and maintaining quality.",
    href: "/image-compressor",
    icon: Archive,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "Resize Image",
    description: "Define your dimensions by percent or pixel, and resize your images with presets.",
    href: "/image-resizer",
    icon: Maximize,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "Crop Image",
    description: "Crop images with precision using our visual editor and aspect ratio presets.",
    href: "/image-cropper",
    icon: Crop,
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  {
    title: "Merge PDF",
    description: "Combine multiple PDF files into one document with custom page ordering.",
    href: "/pdf-merger",
    icon: FileType,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  {
    title: "Convert Image",
    description: "Convert between JPG, PNG, WebP, and other formats with quality control.",
    href: "/image-converter",
    icon: RefreshCw,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    title: "QR Code Generator",
    description: "Create custom QR codes with logos, colors, and multiple data types.",
    href: "/qr-code-generator",
    icon: QrCode,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    isNew: true,
  },
  {
    title: "JSON Formatter",
    description: "Beautify, validate, and minify JSON data with syntax highlighting.",
    href: "/json-formatter",
    icon: Code,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  {
    title: "Split PDF",
    description: "Split large PDF files into smaller documents by page ranges or selections.",
    href: "/pdf-splitter",
    icon: Scissors,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  {
    title: "Password Generator",
    description: "Generate secure passwords with customizable length and character options.",
    href: "/password-generator",
    icon: Lock,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    title: "Remove background",
    description: "Remove image backgrounds automatically with AI-powered edge detection.",
    href: "/background-remover",
    icon: ImageIcon,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    isNew: true,
  },
  {
    title: "SEO Meta Generator",
    description: "Generate optimized meta tags, Open Graph, and Twitter Card tags for better SEO.",
    href: "/seo-meta-generator",
    icon: TrendingUp,
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  {
    title: "Image Watermark",
    description: "Add text or logo watermarks to your images with opacity and position controls.",
    href: "/image-watermark",
    icon: Edit3,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
]

const toolCategories = [
  { name: "All Tools", href: "/", active: true },
  { name: "PDF Tools", href: "/pdf-tools", active: false },
  { name: "Image Tools", href: "/image-tools", active: false },
  { name: "QR Tools", href: "/qr-tools", active: false },
  { name: "Text Tools", href: "/text-tools", active: false },
  { name: "SEO Tools", href: "/seo-tools", active: false },
  { name: "Utilities", href: "/utilities", active: false },
]

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Process files instantly with our optimized algorithms and client-side processing",
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    icon: Shield,
    title: "100% Secure",
    description: "Your files are processed locally in your browser. No uploads to our servers",
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  {
    icon: Globe,
    title: "Always Available",
    description: "Access 300+ professional tools anytime, anywhere, on any device",
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  }
]

const stats = [
  { label: "Tools Available", value: "300+", icon: Wrench },
  { label: "Files Processed", value: "10M+", icon: Upload },
  { label: "Happy Users", value: "500K+", icon: Users },
  { label: "Countries", value: "150+", icon: Globe },
]

export default function HomePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <Header />

        {/* Hero Section */}
        <section className="relative py-16 sm:py-20 lg:py-24 px-4 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500 rounded-full blur-2xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-green-500 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>
          
          <div className="max-w-7xl mx-auto text-center relative">
            {/* Badge */}
            <div className="mb-6 sm:mb-8">
              <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 border border-gray-200 shadow-lg mb-6">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <span className="text-xs sm:text-sm font-semibold text-gray-700">300+ Professional Tools</span>
              </div>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Every Tool You Could Want
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mt-2">
                To Edit Images in Bulk
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-12 lg:mb-16 max-w-4xl mx-auto leading-relaxed px-4">
              Your online photo editor is here and forever free! Compress, resize, crop, convert images and more with 300+ professional tools.
              <span className="block mt-2 font-semibold text-gray-800">Fast, secure, and completely free.</span>
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12 sm:mb-16 px-4">
              <div 
                className="relative cursor-pointer group"
                onClick={() => setIsSearchOpen(true)}
              >
                <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg px-4 sm:px-6 py-3 sm:py-4 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  <span className="text-gray-500 text-base sm:text-lg flex-1 text-left">Search 300+ tools...</span>
                  <kbd className="bg-gray-100 text-gray-600 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium">⌘K</kbd>
                </div>
              </div>
            </div>

            {/* Tool Categories */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-12 sm:mb-16 px-4">
              {toolCategories.map((category) => (
                <Link
                  key={category.name}
                  href={category.href}
                >
                  <Button
                    variant={category.active ? "default" : "outline"}
                    size="sm"
                    className={`px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-full transition-all duration-300 font-semibold text-sm sm:text-base ${
                      category.active
                        ? "bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700 shadow-xl scale-105"
                        : "bg-white/80 backdrop-blur-sm text-gray-700 border-gray-300 hover:bg-white hover:shadow-lg hover:scale-105 hover:border-gray-400"
                    }`}
                  >
                    {category.name}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Featured Tools Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 px-4">
              {featuredTools.map((tool) => {
                const Icon = tool.icon
                return (
                  <Link
                    key={tool.title}
                    href={tool.href}
                    className="block bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-4 sm:p-6 lg:p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group hover:border-gray-300"
                  >
                    {tool.isNew && (
                      <Badge className="mb-3 sm:mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 shadow-lg">
                        New!
                      </Badge>
                    )}
                    <div className={`inline-flex p-3 sm:p-4 rounded-2xl ${tool.iconBg} mb-4 sm:mb-6 group-hover:scale-125 transition-transform duration-300 shadow-lg group-hover:shadow-xl`}>
                      <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${tool.iconColor}`} />
                    </div>
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-gray-900 mb-2 sm:mb-3 text-left group-hover:text-blue-600 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 text-left leading-relaxed">
                      {tool.description}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 sm:py-16 px-4 bg-white/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="text-center">
                    <div className="bg-blue-100 p-3 sm:p-4 rounded-xl w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">{stat.value}</div>
                    <div className="text-sm sm:text-base text-gray-600">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mb-3 sm:mb-4">
                Why Choose PixoraTools?
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Professional-grade tools with enterprise features, available for free
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="text-center group">
                    <div className={`${feature.bgColor} p-3 sm:p-4 rounded-xl w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Tool Categories Section */}
        <section className="py-12 sm:py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mb-3 sm:mb-4">
                Explore Tool Categories
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Specialized domains for focused workflows
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Link href="/pdf-tools" className="group">
                <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="bg-red-100 p-2 sm:p-3 rounded-xl w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <FileType className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                    PDF Tools
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                    34 tools for PDF manipulation
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    pixorapdf.com
                  </Badge>
                </div>
              </Link>
              
              <Link href="/image-tools" className="group">
                <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="bg-blue-100 p-2 sm:p-3 rounded-xl w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    Image Tools
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                    41 tools for image editing
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    pixoraimg.com
                  </Badge>
                </div>
              </Link>
              
              <Link href="/qr-tools" className="group">
                <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="bg-green-100 p-2 sm:p-3 rounded-xl w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <QrCode className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                    QR & Barcode
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                    23 tools for QR generation
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    pixoraqrcode.com
                  </Badge>
                </div>
              </Link>
              
              <Link href="/text-tools" className="group">
                <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="bg-yellow-100 p-2 sm:p-3 rounded-xl w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <Code className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors">
                    Code Tools
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                    52 tools for developers
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    pixoracode.com
                  </Badge>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-3 sm:mb-4">
              Ready to boost your productivity?
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8">
              Join millions of users who trust PixoraTools for their daily tasks
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg font-semibold">
                <CheckCircle className="h-5 w-5 mr-2" />
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg font-semibold">
                View All Tools
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>

      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  )
}