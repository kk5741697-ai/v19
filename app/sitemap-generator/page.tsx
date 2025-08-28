"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Map, Copy, Download, Plus, Trash2, Globe } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface SitemapUrl {
  id: string
  url: string
  priority: number
  changefreq: string
  lastmod: string
}

export default function SitemapGeneratorPage() {
  const [siteUrl, setSiteUrl] = useState("")
  const [urls, setUrls] = useState<SitemapUrl[]>([])
  const [bulkUrls, setBulkUrls] = useState("")
  const [generatedSitemap, setGeneratedSitemap] = useState("")

  const changefreqOptions = [
    { value: "always", label: "Always" },
    { value: "hourly", label: "Hourly" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
    { value: "never", label: "Never" },
  ]

  const addUrl = () => {
    const newUrl: SitemapUrl = {
      id: Date.now().toString(),
      url: "",
      priority: 0.5,
      changefreq: "weekly",
      lastmod: new Date().toISOString().split('T')[0]
    }
    setUrls(prev => [...prev, newUrl])
  }

  const updateUrl = (id: string, field: keyof SitemapUrl, value: any) => {
    setUrls(prev => prev.map(url => 
      url.id === id ? { ...url, [field]: value } : url
    ))
  }

  const removeUrl = (id: string) => {
    setUrls(prev => prev.filter(url => url.id !== id))
  }

  const processBulkUrls = () => {
    const lines = bulkUrls.split('\n').filter(line => line.trim())
    const newUrls: SitemapUrl[] = []

    lines.forEach(line => {
      const parts = line.split(',').map(p => p.trim())
      const url = parts[0]
      const priority = parseFloat(parts[1]) || 0.5
      const changefreq = parts[2] || "weekly"

      if (url && (url.startsWith('http') || url.startsWith('/'))) {
        newUrls.push({
          id: Date.now().toString() + Math.random(),
          url: url.startsWith('/') ? `${siteUrl}${url}` : url,
          priority: Math.max(0, Math.min(1, priority)),
          changefreq,
          lastmod: new Date().toISOString().split('T')[0]
        })
      }
    })

    setUrls(prev => [...prev, ...newUrls])
    setBulkUrls("")
    
    toast({
      title: "URLs added",
      description: `${newUrls.length} URLs added to sitemap`
    })
  }

  const generateSitemap = () => {
    if (!siteUrl.trim()) {
      toast({
        title: "Site URL required",
        description: "Please enter your website URL",
        variant: "destructive"
      })
      return
    }

    if (urls.length === 0) {
      toast({
        title: "No URLs added",
        description: "Please add at least one URL to generate sitemap",
        variant: "destructive"
      })
      return
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.url}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority.toFixed(1)}</priority>
  </url>`).join('\n')}
</urlset>`

    setGeneratedSitemap(sitemap)
    
    toast({
      title: "Sitemap generated",
      description: `XML sitemap with ${urls.length} URLs created`
    })
  }

  const copySitemap = () => {
    navigator.clipboard.writeText(generatedSitemap)
    toast({
      title: "Copied to clipboard",
      description: "Sitemap XML copied successfully"
    })
  }

  const downloadSitemap = () => {
    const blob = new Blob([generatedSitemap], { type: "application/xml" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "sitemap.xml"
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Download started",
      description: "Sitemap XML file downloaded"
    })
  }

  const loadExample = () => {
    setSiteUrl("https://example.com")
    setUrls([
      {
        id: "1",
        url: "https://example.com/",
        priority: 1.0,
        changefreq: "daily",
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        id: "2", 
        url: "https://example.com/about",
        priority: 0.8,
        changefreq: "monthly",
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        id: "3",
        url: "https://example.com/contact",
        priority: 0.6,
        changefreq: "yearly",
        lastmod: new Date().toISOString().split('T')[0]
      }
    ])
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <Map className="h-8 w-8 text-accent" />
            <h1 className="text-3xl font-heading font-bold text-foreground">Sitemap Generator</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate XML sitemaps for better search engine indexing and crawling. Add URLs with custom priority and update frequency.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Configuration */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Website Configuration</CardTitle>
                <CardDescription>Enter your website details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="site-url">Website URL *</Label>
                  <Input
                    id="site-url"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={addUrl} className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Add URL
                  </Button>
                  <Button variant="outline" onClick={loadExample}>
                    Load Example
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bulk URL Import</CardTitle>
                <CardDescription>Add multiple URLs at once</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bulk-urls">URLs (one per line)</Label>
                  <Textarea
                    id="bulk-urls"
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    placeholder="/page1&#10;/page2, 0.8, monthly&#10;https://example.com/page3, 0.6, yearly"
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: URL, priority (0-1), changefreq
                  </p>
                </div>

                <Button onClick={processBulkUrls} disabled={!bulkUrls.trim()}>
                  Import URLs
                </Button>
              </CardContent>
            </Card>

            {/* URL List */}
            {urls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>URLs ({urls.length})</CardTitle>
                  <CardDescription>Configure individual URL settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {urls.map((url) => (
                      <div key={url.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{url.id}</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeUrl(url.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        <div>
                          <Label className="text-xs">URL</Label>
                          <Input
                            value={url.url}
                            onChange={(e) => updateUrl(url.id, "url", e.target.value)}
                            placeholder="/page-path or full URL"
                            className="text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Priority</Label>
                            <Input
                              type="number"
                              value={url.priority}
                              onChange={(e) => updateUrl(url.id, "priority", parseFloat(e.target.value) || 0.5)}
                              min={0}
                              max={1}
                              step={0.1}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Change Freq</Label>
                            <Select
                              value={url.changefreq}
                              onValueChange={(value) => updateUrl(url.id, "changefreq", value)}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {changefreqOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Last Modified</Label>
                            <Input
                              type="date"
                              value={url.lastmod}
                              onChange={(e) => updateUrl(url.id, "lastmod", e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Generated Sitemap */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generated Sitemap</CardTitle>
                <CardDescription>XML sitemap ready for search engines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={generateSitemap}
                  disabled={!siteUrl.trim() || urls.length === 0}
                  className="w-full"
                  size="lg"
                >
                  <Map className="h-4 w-4 mr-2" />
                  Generate Sitemap
                </Button>

                {generatedSitemap && (
                  <>
                    <Textarea
                      value={generatedSitemap}
                      readOnly
                      className="min-h-[400px] font-mono text-xs"
                    />

                    <div className="flex space-x-2">
                      <Button onClick={copySitemap} variant="outline">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy XML
                      </Button>
                      <Button onClick={downloadSitemap} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
                      <ol className="text-sm text-blue-800 space-y-1">
                        <li>1. Upload sitemap.xml to your website root</li>
                        <li>2. Submit to Google Search Console</li>
                        <li>3. Add to robots.txt: Sitemap: {siteUrl}/sitemap.xml</li>
                        <li>4. Update regularly when adding new pages</li>
                      </ol>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Sitemap Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Sitemap Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Priority Values</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• 1.0: Homepage, most important pages</li>
                      <li>• 0.8: Main category pages</li>
                      <li>• 0.6: Sub-category pages</li>
                      <li>• 0.4: Individual content pages</li>
                      <li>• 0.2: Archive, tag pages</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Change Frequency</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Always: Live data feeds</li>
                      <li>• Hourly: News sites</li>
                      <li>• Daily: Blogs, forums</li>
                      <li>• Weekly: Product pages</li>
                      <li>• Monthly: Company info</li>
                      <li>• Yearly: Contact, legal pages</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}