"use client"

import { TextToolLayout } from "@/components/text-tool-layout"
import { Braces } from "lucide-react"
import { TextProcessor } from "@/lib/processors/text-processor"

const jsonExamples = [
  {
    name: "Simple Object",
    content: `{"name":"John Doe","age":30,"city":"New York","active":true}`,
  },
  {
    name: "Nested Structure",
    content: `{"user":{"id":123,"profile":{"name":"Jane Smith","email":"jane@example.com","preferences":{"theme":"dark","notifications":true}},"posts":[{"id":1,"title":"Hello World","published":true},{"id":2,"title":"Getting Started","published":false}]}}`,
  },
  {
    name: "Array Data",
    content: `[{"id":1,"product":"Laptop","price":999.99,"inStock":true,"tags":["electronics","computers"]},{"id":2,"product":"Mouse","price":29.99,"inStock":false,"tags":["electronics","accessories"]}]`,
  },
]

const jsonOptions = [
  {
    key: "indent",
    label: "Indentation",
    type: "select" as const,
    defaultValue: 2,
    selectOptions: [
      { value: 2, label: "2 Spaces" },
      { value: 4, label: "4 Spaces" },
      { value: "tab", label: "Tabs" },
    ],
  },
  {
    key: "minify",
    label: "Minify JSON",
    type: "checkbox" as const,
    defaultValue: false,
  },
  {
    key: "sortKeys",
    label: "Sort Keys",
    type: "checkbox" as const,
    defaultValue: false,
  },
  {
    key: "validateOnly",
    label: "Validate Only",
    type: "checkbox" as const,
    defaultValue: false,
  },
]

function processJSON(input: string, options: any = {}) {
  return TextProcessor.processJSON(input, options)
}

function validateJSON(input: string) {
  if (!input.trim()) {
    return { isValid: false, error: "Input cannot be empty" }
  }
  
  try {
    JSON.parse(input)
    return { isValid: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Invalid JSON format"
    // Extract line number from error if available
    const lineMatch = errorMessage.match(/line (\d+)/i)
    const positionMatch = errorMessage.match(/position (\d+)/i)
    
    let enhancedError = errorMessage
    if (lineMatch) {
      enhancedError = `Line ${lineMatch[1]}: ${errorMessage}`
    } else if (positionMatch) {
      enhancedError = `Position ${positionMatch[1]}: ${errorMessage}`
    }
    
    return { 
      isValid: false, 
      error: enhancedError
    }
  }
}

export default function JSONFormatterPage() {
  return (
    <TextToolLayout
      title="JSON Formatter"
      description="Beautify, validate, and minify JSON data with syntax highlighting and error detection."
      icon={Braces}
      placeholder="Paste your JSON here..."
      outputPlaceholder="Formatted JSON will appear here..."
      processFunction={processJSON}
      validateFunction={validateJSON}
      options={jsonOptions}
      examples={jsonExamples}
      fileExtensions={[".json"]}
    />
  )
}