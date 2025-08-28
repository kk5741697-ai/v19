"use client"

import { PDFToolsLayout } from "@/components/pdf-tools-layout"
import { Scissors } from "lucide-react"
import { PDFProcessor } from "@/lib/processors/pdf-processor"

const splitOptions = [
  {
    key: "splitMode",
    label: "Split Mode",
    type: "select" as const,
    defaultValue: "range",
    selectOptions: [
      { value: "range", label: "Page Ranges" },
      { value: "pages", label: "Extract Selected Pages" },
      { value: "size", label: "Equal Parts" },
    ],
    section: "Split Settings",
  },
  {
    key: "rangeMode",
    label: "Range Mode",
    type: "select" as const,
    defaultValue: "custom",
    selectOptions: [
      { value: "custom", label: "Custom Ranges" },
      { value: "fixed", label: "Fixed Intervals" },
    ],
    section: "Split Settings",
    condition: (options) => options.splitMode === "range",
  },
  {
    key: "mergeRanges",
    label: "Merge all ranges in one PDF file",
    type: "checkbox" as const,
    defaultValue: false,
    section: "Split Settings",
    condition: (options) => options.splitMode === "range",
  },
  {
    key: "equalParts",
    label: "Number of Parts",
    type: "input" as const,
    defaultValue: 2,
    min: 2,
    max: 20,
    section: "Split Settings",
    condition: (options) => options.splitMode === "size",
  },
  {
    key: "preserveMetadata",
    label: "Preserve Metadata",
    type: "checkbox" as const,
    defaultValue: true,
    section: "Options",
  },
]
async function splitPDF(files: any[], options: any) {
  try {
    if (files.length !== 1) {
      return {
        success: false,
        error: "Please select exactly one PDF file to split",
      }
    }

    const file = files[0]
    
    // Prepare page ranges based on split mode
    let pageRanges: Array<{ from: number; to: number }> = []
    
    if (options.splitMode === "range" && options.pageRanges) {
      pageRanges = options.pageRanges
    } else if (options.splitMode === "size" && options.equalParts) {
      // This will be handled in the processor
      pageRanges = []
    }
    
    const splitResults = await PDFProcessor.splitPDF(file.originalFile || file.file, pageRanges, options)

    if (options.mergeRanges && splitResults.length > 1) {
      // Merge all ranges into one PDF
      const tempFiles = splitResults.map((bytes, index) => {
        return new File([bytes], `temp-${index}.pdf`, { type: "application/pdf" })
      })
      
      const mergedBytes = await PDFProcessor.mergePDFs(tempFiles, {
        addBookmarks: false,
        preserveMetadata: options.preserveMetadata
      })
      
      const mergedBlob = new Blob([mergedBytes], { type: "application/pdf" })
      const downloadUrl = URL.createObjectURL(mergedBlob)
      
      return {
        success: true,
        downloadUrl,
      }
    } else {
      // Create ZIP with split PDFs
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      
      if (options.extractMode === "pages" && options.selectedPages) {
        splitResults.forEach((pdfBytes, index) => {
          const pageNum = options.selectedPages[index]?.split('-').pop()
          const filename = `${file.name.replace(".pdf", "")}_page_${pageNum || index + 1}.pdf`
          zip.file(filename, pdfBytes)
        })
      } else {
        splitResults.forEach((pdfBytes, index) => {
          const filename = `${file.name.replace(".pdf", "")}_part_${index + 1}.pdf`
          zip.file(filename, pdfBytes)
        })
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const downloadUrl = URL.createObjectURL(zipBlob)

      return {
        success: true,
        downloadUrl,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to split PDF",
    }
  }
}

export default function PDFSplitterPage() {
  return (
    <PDFToolsLayout
      title="Split PDF"
      description="Split large PDF files into smaller documents by page ranges, file size, bookmarks, or equal parts. Extract specific pages or sections easily."
      icon={Scissors}
      toolType="split"
      processFunction={splitPDF}
      options={splitOptions}
      maxFiles={1}
      allowPageSelection={true}
    />
  )
}