"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Settings, Download, Upload, Eye, Share2 } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

interface MobileBottomSheetProps {
  title: string
  icon: any
  onProcess: () => void
  onDownload?: () => void
  isProcessing: boolean
  canProcess: boolean
  children: React.ReactNode
  className?: string
}

export function MobileBottomSheet({
  title,
  icon: Icon,
  onProcess,
  onDownload,
  isProcessing,
  canProcess,
  children,
  className = ""
}: MobileBottomSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()

  if (!isMobile) {
    return null
  }

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 left-4 right-4 z-50 flex items-center justify-between">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-200"
            >
              <Settings className="h-5 w-5 mr-2" />
              Options
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle className="flex items-center">
                <Icon className="h-5 w-5 mr-2" />
                {title} Settings
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 overflow-y-auto">
              {children}
            </div>
          </SheetContent>
        </Sheet>

        <Button
          onClick={onProcess}
          disabled={!canProcess || isProcessing}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex-1 ml-4"
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
      </div>

      {/* Backdrop */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="font-medium">Processing your files...</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}