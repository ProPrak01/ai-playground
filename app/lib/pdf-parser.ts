// Wrapper for pdf-parse to handle the test file issue
export async function parsePDF(buffer: Buffer): Promise<{ text: string; numpages: number; info: any }> {
  // Temporarily change working directory to avoid test file issue
  const originalCwd = process.cwd()
  
  try {
    // Create a mock test directory structure to prevent the error
    const fs = require('fs')
    const path = require('path')
    const testDir = path.join(process.cwd(), 'test', 'data')
    
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }
    
    // Create a dummy PDF file to prevent the error
    const dummyPdfPath = path.join(testDir, '05-versions-space.pdf')
    if (!fs.existsSync(dummyPdfPath)) {
      // Create a minimal valid PDF
      const minimalPDF = Buffer.from([
        0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, // %PDF-1.4
        0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a, // Binary marker
        0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46, 0x0a // %%EOF
      ])
      fs.writeFileSync(dummyPdfPath, minimalPDF)
    }
    
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    
    return data
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw error
  } finally {
    // Restore original working directory
    process.chdir(originalCwd)
  }
}