import pdfParse from 'pdf-parse-new'

/**
 * Extracts text content from a PDF file buffer
 * Uses pdf-parse-new - a modern, cross-platform PDF parser
 * @param fileBuffer - The PDF file as a Buffer
 * @returns A promise that resolves to the extracted text string
 */
export async function extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
  // Validate buffer
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('Invalid PDF file: File buffer is empty or undefined')
  }

  // Validate PDF header (PDF files start with %PDF)
  const pdfHeader = fileBuffer.slice(0, 4).toString('ascii')
  if (pdfHeader !== '%PDF') {
    throw new Error('Invalid PDF file: File does not appear to be a valid PDF')
  }

  try {
    // Parse PDF using pdf-parse-new (drop-in replacement with better compatibility)
    const data = await pdfParse(fileBuffer)

    // Validate parsed data structure
    if (!data || typeof data !== 'object') {
      throw new Error('PDF parsing returned invalid data structure')
    }

    // Safely extract text with fallback
    const text = (data && typeof data.text === 'string') ? data.text : ''
    
    // Check if text was extracted
    if (!text || text.trim().length === 0) {
      throw new Error(
        'Could not extract text from PDF. The PDF may be image-based (scanned) or contain no readable text. Please ensure the PDF contains selectable text.'
      )
    }

    return text.trim()
  } catch (error) {
    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      const errorMessage = error.message || ''
      
      // Handle specific PDF parsing errors
      if (
        errorMessage.includes('Cannot read properties of undefined') ||
        errorMessage.includes('reading \'0\'') ||
        errorMessage.includes('Cannot read property')
      ) {
        throw new Error(
          'PDF parsing failed: The PDF format may not be fully supported. This can happen with scanned PDFs, PDFs with complex layouts, or corrupted files. Please try a different PDF file or ensure the PDF contains selectable text (not just images).'
        )
      }
      
      // Handle other known errors
      if (errorMessage.includes('Invalid PDF') || errorMessage.includes('invalid PDF')) {
        throw new Error('Invalid PDF file format. Please ensure the file is a valid PDF document.')
      }
      
      if (errorMessage.includes('Password required') || errorMessage.includes('password')) {
        throw new Error('This PDF is password-protected. Please remove the password and try again.')
      }
      
      // Return the original error message for other cases
      throw new Error(`Failed to parse PDF: ${errorMessage}`)
    }
    
    // Fallback for unknown errors
    throw new Error('Failed to parse PDF: Unknown error occurred. Please try a different PDF file.')
  }
}
