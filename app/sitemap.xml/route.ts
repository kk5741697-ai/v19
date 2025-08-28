import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixoratools.com'
  
  const staticPages = [
    '',
    '/pdf-tools',
    '/image-tools', 
    '/qr-tools',
    '/text-tools',
    '/seo-tools',
    '/utilities',
    '/converters',
    '/pricing',
    '/about',
    '/contact',
    '/privacy',
    '/terms'
  ]

  const toolPages = [
    '/pdf-merger',
    '/pdf-splitter', 
    '/pdf-compressor',
    '/pdf-to-image',
    '/pdf-to-word',
    '/pdf-password-protector',
    '/pdf-unlock',
    '/pdf-watermark',
    '/pdf-organizer',
    '/image-to-pdf',
    '/image-resizer',
    '/image-compressor',
    '/image-converter',
    '/image-cropper',
    '/image-rotator',
    '/background-remover',
    '/image-flipper',
    '/image-filters',
    '/image-upscaler',
    '/image-watermark',
    '/qr-code-generator',
    '/qr-scanner',
    '/barcode-generator',
    '/bulk-qr-generator',
    '/wifi-qr-generator',
    '/vcard-qr-generator',
    '/json-formatter',
    '/base64-encoder',
    '/url-encoder',
    '/text-case-converter',
    '/hash-generator',
    '/xml-formatter',
    '/html-formatter',
    '/css-minifier',
    '/js-minifier',
    '/seo-meta-generator',
    '/sitemap-generator',
    '/password-generator',
    '/lorem-ipsum-generator',
    '/uuid-generator',
    '/random-number-generator',
    '/text-diff-checker',
    '/word-counter',
    '/unit-converter',
    '/currency-converter',
    '/color-converter'
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
${toolPages.map(page => `  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}