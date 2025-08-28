import { NextResponse } from 'next/server'

export async function GET() {
  const robotsTxt = `
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://pixoratools.com'}/sitemap.xml

# AdSense crawler
User-agent: Mediapartners-Google
Allow: /

# Disallow admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /static/

# Allow important pages
Allow: /pdf-tools/
Allow: /image-tools/
Allow: /qr-tools/
Allow: /text-tools/
Allow: /seo-tools/
Allow: /utilities/
`.trim()

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}