import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import axios from 'axios'
import * as cheerio from 'cheerio'
import sharp from 'sharp'
import { parsePDF } from '@/app/lib/pdf-parser'
import { rateLimiters } from '@/app/lib/rate-limiter'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
})

// Error response helper
function errorResponse(message: string, status: number = 400, details?: any) {
  console.error(`Error: ${message}`, details)
  return NextResponse.json(
    { 
      error: message,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    },
    { status }
  )
}

async function extractTextFromUrl(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000,
      maxContentLength: 5000000 // 5MB max
    })
    const $ = cheerio.load(response.data)
    
    $('script').remove()
    $('style').remove()
    $('nav').remove()
    $('header').remove()
    $('footer').remove()
    
    const text = $('body').text()
    return text.replace(/\s+/g, ' ').trim().slice(0, 4000)
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to the URL')
    }
    if (error.response?.status === 404) {
      throw new Error('URL not found')
    }
    throw new Error('Failed to fetch URL content')
  }
}

async function extractTextFromDoc(buffer: ArrayBuffer): Promise<string> {
  try {
    const mammoth = require('mammoth')
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
    return result.value.slice(0, 4000)
  } catch (error) {
    console.error('Error parsing DOC:', error)
    throw new Error('Failed to parse Word document')
  }
}

async function convertPDFToImages(buffer: ArrayBuffer): Promise<{ images: string[]; pageCount: number }> {
  try {
    const pdf2pic = require('pdf2pic')
    const path = require('path')
    const fs = require('fs')
    const os = require('os')
    
    // Create temp directory for processing
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-'))
    const pdfPath = path.join(tempDir, 'input.pdf')
    
    // Write PDF to temp file
    fs.writeFileSync(pdfPath, Buffer.from(buffer))
    
    // Configure pdf2pic
    const converter = new pdf2pic.fromPath(pdfPath, {
      density: 150,           // DPI
      savename: 'page',
      savedir: tempDir,
      format: 'png',
      width: 1200,            // Max width
      height: 1600            // Max height
    })
    
    // Get page count
    const pdfData = await parsePDF(Buffer.from(buffer))
    const pageCount = pdfData.numpages || 1
    
    // Convert pages to images (limit to first 5 pages for performance)
    const maxPages = Math.min(pageCount, 5)
    const images: string[] = []
    
    for (let i = 1; i <= maxPages; i++) {
      try {
        const result = await converter(i)
        if (result?.path) {
          // Read image and convert to base64
          const imageBuffer = fs.readFileSync(result.path)
          const base64 = imageBuffer.toString('base64')
          images.push(base64)
          
          // Clean up temp image file
          fs.unlinkSync(result.path)
        }
      } catch (pageError) {
        console.error(`Error converting page ${i}:`, pageError)
      }
    }
    
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true })
    
    return { images, pageCount }
  } catch (error) {
    console.error('Error converting PDF to images:', error)
    throw error
  }
}

async function analyzePDFImages(images: string[], fileName: string, pageCount: number): Promise<string> {
  try {
    const summaries: string[] = []
    
    // Analyze each page image
    for (let i = 0; i < images.length; i++) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `This is page ${i + 1} of a PDF document "${fileName}". Please analyze this page and describe:
1. The content and layout (text, tables, graphs, images)
2. Key information or data presented
3. Any important details, dates, or numbers
4. If it's a calendar, list important dates
5. If it contains graphs or charts, describe the data trends`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${images[i]}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 300
      })
      
      const pageAnalysis = response.choices[0]?.message?.content || `Unable to analyze page ${i + 1}`
      summaries.push(`**Page ${i + 1}:**\n${pageAnalysis}`)
    }
    
    // Combine all page analyses
    const combinedAnalysis = summaries.join('\n\n')
    
    // Generate overall summary
    const finalResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert document analyst. Create a comprehensive summary based on the page-by-page analysis provided."
        },
        {
          role: "user",
          content: `Based on the following page-by-page analysis of the PDF document "${fileName}" (${pageCount} total pages, analyzed first ${images.length} pages), provide an overall summary:

${combinedAnalysis}

Please provide:
1. Overall document summary
2. Key takeaways and important information
3. Any critical dates, numbers, or data points
4. Document purpose and main conclusions`
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    })
    
    const overallSummary = finalResponse.choices[0]?.message?.content || 'Unable to generate overall summary'
    
    return `**Document:** ${fileName} (${pageCount} pages total, analyzed ${images.length} pages)\n\n${overallSummary}\n\n---\n\n**Detailed Page Analysis:**\n\n${combinedAnalysis}`
  } catch (error: any) {
    if (error?.status === 429) {
      throw new Error('API rate limit exceeded. Please wait a moment and try again.')
    }
    console.error('Error analyzing PDF images:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.heavy(request)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
          }
        }
      )
    }
    
    const formData = await request.formData()
    const type = formData.get('type') as string
    
    if (!type || !['file', 'url'].includes(type)) {
      return errorResponse('Invalid request type. Must be "file" or "url".')
    }
    
    let textContent = ''
    let fileName = ''
    let isPDF = false
    let pdfBuffer: ArrayBuffer | null = null
    
    if (type === 'url') {
      const url = formData.get('url') as string
      if (!url) {
        return errorResponse('No URL provided')
      }
      
      // Validate URL
      try {
        const urlObj = new URL(url)
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          return errorResponse('Invalid URL protocol. Only HTTP and HTTPS are supported.')
        }
      } catch {
        return errorResponse('Invalid URL format')
      }
      
      try {
        textContent = await extractTextFromUrl(url)
        fileName = url
      } catch (error: any) {
        return errorResponse(`Failed to fetch URL: ${error.message}`)
      }
    } else if (type === 'file') {
      const file = formData.get('document') as File
      if (!file) {
        return errorResponse('No file provided')
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return errorResponse('File too large. Maximum size is 10MB.')
      }
      
      fileName = file.name
      const buffer = await file.arrayBuffer()
      
      try {
        if (file.name.toLowerCase().endsWith('.pdf')) {
          isPDF = true
          pdfBuffer = buffer
        } else if (file.name.toLowerCase().match(/\.(doc|docx)$/)) {
          textContent = await extractTextFromDoc(buffer)
        } else if (file.name.toLowerCase().match(/\.(txt|md|csv|log)$/)) {
          textContent = new TextDecoder().decode(buffer).slice(0, 4000)
        } else if (file.type.startsWith('text/')) {
          textContent = new TextDecoder().decode(buffer).slice(0, 4000)
        } else {
          return errorResponse('Unsupported file type. Supported: PDF, DOC, DOCX, TXT, MD, CSV, LOG')
        }
      } catch (parseError: any) {
        return errorResponse(`Failed to parse file: ${parseError.message}`)
      }
    }
    
    // Check API key
    if (!process.env.OPENAI_API_KEY || 
        process.env.OPENAI_API_KEY === 'your-openai-api-key-here' ||
        process.env.OPENAI_API_KEY === 'dummy-key') {
      return errorResponse(
        'OpenAI API key not configured. Please add your API key to the environment variables.',
        500
      )
    }
    
    // Process the content
    try {
      let summary = ''
      
      // For PDFs, convert to images and analyze
      if (isPDF && pdfBuffer) {
        try {
          console.log('Converting PDF to images for visual analysis...')
          
          // First try to convert PDF to images
          const { images, pageCount } = await convertPDFToImages(pdfBuffer)
          
          if (images.length > 0) {
            console.log(`Successfully converted ${images.length} pages to images`)
            summary = await analyzePDFImages(images, fileName, pageCount)
          } else {
            // Fallback to text extraction
            console.log('No images generated, falling back to text extraction')
            const pdfData = await parsePDF(Buffer.from(pdfBuffer))
            textContent = pdfData.text.slice(0, 8000)
            
            if (textContent && textContent.length > 50) {
              const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                  {
                    role: "system",
                    content: "You are an expert document analyst. Create comprehensive summaries that capture all key information."
                  },
                  {
                    role: "user",
                    content: `Please provide a detailed summary of this PDF document "${fileName}":\n\n${textContent}`
                  }
                ],
                max_tokens: 500,
                temperature: 0.3
              })
              
              summary = response.choices[0]?.message?.content || 'Unable to generate summary'
              summary = `Note: This summary is based on extracted text only.\n\n${summary}`
            } else {
              summary = `Unable to process PDF "${fileName}". The document may be image-based or corrupted.`
            }
          }
        } catch (pdfError: any) {
          console.error('PDF processing error:', pdfError)
          
          // Last resort: try text extraction
          try {
            const pdfData = await parsePDF(Buffer.from(pdfBuffer))
            textContent = pdfData.text.slice(0, 8000)
            
            if (textContent && textContent.length > 50) {
              const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                  {
                    role: "user",
                    content: `Summarize this document "${fileName}":\n\n${textContent}`
                  }
                ],
                max_tokens: 500
              })
              
              summary = response.choices[0]?.message?.content || 'Unable to generate summary'
            } else {
              return errorResponse(`PDF processing failed: ${pdfError.message}`)
            }
          } catch (textError) {
            return errorResponse('Unable to process this PDF. It may contain only images or be corrupted.')
          }
        }
      } else {
        // For non-PDF files, use standard text summarization
        if (!textContent || textContent.trim().length < 10) {
          return errorResponse('No meaningful content found to summarize')
        }
        
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that creates concise, informative summaries."
            },
            {
              role: "user",
              content: `Please provide a comprehensive summary of the following content from "${fileName}":\n\n${textContent}`
            }
          ],
          max_tokens: 500,
          temperature: 0.5
        })
        
        summary = response.choices[0]?.message?.content || 'Unable to generate summary'
      }
      
      return NextResponse.json({ 
        summary,
        metadata: {
          fileName,
          processedAt: new Date().toISOString(),
          remainingRequests: rateLimitResult.remaining
        }
      })
    } catch (apiError: any) {
      console.error('OpenAI API error:', apiError)
      
      if (apiError?.status === 401) {
        return errorResponse('Invalid OpenAI API key. Please check your configuration.', 401)
      }
      
      if (apiError?.status === 429) {
        return errorResponse(
          'OpenAI API rate limit exceeded. Please wait a moment and try again.',
          429,
          { retryAfter: 60 }
        )
      }
      
      if (apiError?.status === 503) {
        return errorResponse('OpenAI service is temporarily unavailable. Please try again later.', 503)
      }
      
      return errorResponse(
        `API Error: ${apiError.message || 'Unknown error occurred'}`,
        500
      )
    }
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return errorResponse(
      'An unexpected error occurred. Please try again.',
      500,
      process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
    )
  }
}