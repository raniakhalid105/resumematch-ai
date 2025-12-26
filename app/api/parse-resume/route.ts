import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDF } from '@/lib/pdfParser'
import { parseResumeFromText } from '@/lib/resumeParser'

/**
 * API route handler for resume parsing
 * 
 * Integration Flow:
 * 1. Accepts PDF file upload via FormData
 * 2. Extracts raw text from PDF using pdf-parse-new library
 * 3. Sends extracted text to Groq API for structured parsing
 * 4. Returns structured JSON with skills, experience, education, contact
 * 
 * Error Handling:
 * - Invalid file type: Returns 400 with clear error message
 * - Empty PDF: Returns 400 with guidance
 * - API failures: Returns 500 with error details
 * - Parsing errors: Returns 500 with specific error message
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const resumeFile = formData.get('resumeFile') as File | null

    // Validate inputs
    if (!resumeFile) {
      return NextResponse.json(
        { error: 'Resume file is required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (resumeFile.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      )
    }

    // Validate file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (resumeFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit. Please upload a smaller file.' },
        { status: 400 }
      )
    }

    // Convert file to buffer for PDF parsing
    const arrayBuffer = await resumeFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Step 1: Extract raw text from PDF
    let resumeText: string
    try {
      resumeText = await extractTextFromPDF(buffer)
    } catch (pdfError) {
      console.error('PDF extraction error:', pdfError)
      return NextResponse.json(
        {
          error:
            pdfError instanceof Error
              ? pdfError.message
              : 'Failed to extract text from PDF. The PDF may be corrupted or image-based.',
        },
        { status: 400 }
      )
    }

    // Validate extracted text is not empty
    if (!resumeText || resumeText.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            'Could not extract text from PDF. The PDF may be image-based (scanned) or contain no readable text. Please ensure the PDF contains selectable text.',
        },
        { status: 400 }
      )
    }

    // Step 2: Parse resume text into structured data using Groq API
    let parsedResume
    try {
      parsedResume = await parseResumeFromText(resumeText)
    } catch (parseError) {
      console.error('Resume parsing error:', parseError)
      return NextResponse.json(
        {
          error:
            parseError instanceof Error
              ? parseError.message
              : 'Failed to parse resume data. Please try again.',
        },
        { status: 500 }
      )
    }

    // Step 3: Validate parsed data has at least some content
    if (
      parsedResume.skills.length === 0 &&
      parsedResume.experience.length === 0 &&
      parsedResume.education.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'Could not extract meaningful data from resume. Please ensure the resume contains skills, experience, or education information.',
        },
        { status: 400 }
      )
    }

    // Return structured resume data
    return NextResponse.json(parsedResume)
  } catch (error) {
    console.error('Resume parsing route error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

