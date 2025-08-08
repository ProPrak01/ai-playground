import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Validate image file
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validImageTypes.includes(imageFile.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload an image (JPG, PNG, GIF, or WebP)' 
      }, { status: 400 })
    }

    // Check file size (max 20MB for OpenAI)
    if (imageFile.size > 20 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Image too large. Please upload an image smaller than 20MB' 
      }, { status: 400 })
    }

    const imageBuffer = await imageFile.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    
    try {
      if (process.env.OPENAI_API_KEY && 
          process.env.OPENAI_API_KEY !== 'your-openai-api-key-here' &&
          process.env.OPENAI_API_KEY !== 'dummy-key') {
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please provide a detailed description of this image. Include:\n1. What you see in the image\n2. Any text visible in the image\n3. Colors and composition\n4. The overall context or purpose of the image\n5. Any notable details or interesting elements"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${imageFile.type};base64,${base64Image}`,
                    detail: "high"
                  }
                }
              ]
            }
          ],
          max_tokens: 500
        })
        
        const description = response.choices[0]?.message?.content || 'Unable to analyze image'
        return NextResponse.json({ description })
      } else {
        // Fallback when API key is not configured
        const description = `Image Analysis (Demo Mode):

This is a ${imageFile.type} image with a file size of ${(imageFile.size / 1024).toFixed(2)} KB.

With a valid OpenAI API key configured, this service would provide:
• Detailed visual description of objects, people, and scenes
• Text extraction from any visible text in the image
• Color analysis and composition details
• Context and purpose identification
• Notable elements and interesting features

To enable full image analysis:
1. Add your OpenAI API key to the .env.local file
2. Ensure you have access to GPT-4 Vision API
3. Restart the application

The image has been successfully uploaded and is ready for analysis once the API is configured.`
        
        return NextResponse.json({ description })
      }
    } catch (apiError: any) {
      console.error('OpenAI API error:', apiError)
      
      if (apiError?.status === 401) {
        return NextResponse.json({ 
          error: 'Invalid OpenAI API key. Please check your configuration.' 
        }, { status: 500 })
      }
      
      if (apiError?.status === 429) {
        return NextResponse.json({ 
          error: 'API rate limit exceeded. Please try again later.' 
        }, { status: 429 })
      }
      
      if (apiError?.code === 'model_not_found') {
        // Try with GPT-3.5 as fallback (won't have vision but can provide placeholder)
        const fallbackDescription = `Image uploaded successfully: ${imageFile.name}

Image Details:
• Type: ${imageFile.type}
• Size: ${(imageFile.size / 1024).toFixed(2)} KB
• Dimensions: [Would be analyzed with vision model]

Note: GPT-4 Vision model is not available with your current API key. Please ensure you have access to vision models (gpt-4o-mini or gpt-4-vision-preview) for full image analysis capabilities.`
        
        return NextResponse.json({ description: fallbackDescription })
      }
      
      // Generic fallback
      const fallbackDescription = `Image received: ${imageFile.name}

Technical Details:
• File Type: ${imageFile.type}
• File Size: ${(imageFile.size / 1024).toFixed(2)} KB

The image analysis service is temporarily unavailable. Please try again later or check your API configuration.`
      
      return NextResponse.json({ description: fallbackDescription })
    }
  } catch (error) {
    console.error('Error processing image:', error)
    return NextResponse.json({ 
      error: 'Failed to process image. Please try again.' 
    }, { status: 500 })
  }
}