"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TextToolLayout } from "@/components/text-tool-layout"
import { FileText } from "lucide-react"
import { TextProcessor } from "@/lib/processors/text-processor"

const jsonExamples = [
  {
    name: "Simple Object",
    content: '{"name":"John","age":30,"city":"New York"}',
  },
  {
    name: "Array of Objects",
    content: '[{"id":1,"name":"Item 1"},{"id":2,"name":"Item 2"}]',
  },
  {
    name: "Nested Object",
    content: '{"user":{"profile":{"name":"John","settings":{"theme":"dark","notifications":true}}}}',
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
    key: "sortKeys",
    label: "Sort Keys",
    type: "checkbox" as const,
    defaultValue: false,
  },
  {
    key: "minify",
    label: "Minify JSON",
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
    return { isValid: false, error: "Invalid JSON format" }
  }
}

export default function JSONFormatterPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <TextToolLayout
          title="JSON Formatter"
          description="Beautify, validate, and minify JSON data with syntax highlighting and error detection."
          icon={FileText}
          placeholder="Paste your JSON here..."
          outputPlaceholder="Formatted JSON will appear here..."
          processFunction={processJSON}
          validateFunction={validateJSON}
          options={jsonOptions}
          examples={jsonExamples}
          fileExtensions={[".json"]}
        />
      </div>
      <Footer />
    </div>
  )
}

  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-2xl font-bold text-gray-900">Code</span>
            <Heart className="h-6 w-6 text-teal-500 fill-teal-500" />
            <span className="text-2xl font-bold text-gray-900">Beautify</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">JSON to TOML Converter</h1>
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Button variant="ghost" className="text-blue-600">
              <Heart className="h-4 w-4 mr-2" />
              Add to Fav
            </Button>
            <Button className="bg-teal-500 hover:bg-teal-600 text-white">
              New
            </Button>
            <Button variant="outline">
              Save & Share
            </Button>
          </div>
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Input Panel */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(input)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadFile(input, "input.json")}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setInput("")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-500">Sample</div>
              </div>
              
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">
                    <FileText className="h-4 w-4 mr-2" />
                    File
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <Link className="h-4 w-4 mr-2" />
                    URL
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste or type your data here..."
                className="min-h-[400px] font-mono text-sm resize-none border-0 focus:ring-0"
              />
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>Ln: {input.split('\n').length} Col: {input.length}</span>
                <div className="flex space-x-4">
                  <span>JSON</span>
                  <span>UTF-8</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Output Panel */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(output)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadFile(output, "output.toml")}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm font-medium bg-gray-800 text-white px-2 py-1 rounded">
                  Output
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-update"
                  checked={autoUpdate}
                  onCheckedChange={setAutoUpdate}
                />
                <label htmlFor="auto-update" className="text-sm">Auto Update</label>
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="min-h-[400px] flex items-center justify-center text-red-500 bg-red-50 rounded border">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>{error}</p>
                  </div>
                </div>
              ) : (
                <Textarea
                  value={output}
                  readOnly
                  placeholder="Converted output will appear here..."
                  className="min-h-[400px] font-mono text-sm resize-none border-0 focus:ring-0"
                />
              )}
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>Ln: {output.split('\n').length} Col: {output.length}</span>
                <div className="flex space-x-4">
                  <span>TOML</span>
                  <span>UTF-8</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Button 
            onClick={processJSON}
            className="bg-teal-500 hover:bg-teal-600 text-white px-8"
            size="lg"
          >
            JSON to TOML
          </Button>
          
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline"
              onClick={() => downloadFile(output, "converted.toml")}
              disabled={!output}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" className="text-blue-600">
              JSON Sorter
            </Button>
          </div>
        </div>

        {/* Examples */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Convert JSON to TOML</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {examples.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => loadExample(example)}
                className="h-auto p-4 text-left justify-start"
              >
                <div>
                  <div className="font-medium">Example {index + 1}</div>
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {example.substring(0, 50)}...
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}