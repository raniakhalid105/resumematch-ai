import { NextRequest, NextResponse } from 'next/server'
import { analyzeResume } from '@/lib/groq'
import { formatResumeForAnalysis, ParsedResume } from '@/lib/resumeParser'

/**
 * API route handler for resume analysis
 * 
 * Integration Flow:
 * 1. Accepts parsed resume data (from /api/parse-resume) and job description
 * 2. Formats structured resume data for analysis
 * 3. Sends formatted resume and job description to Groq API for matching
 * 4. Returns analysis results (match percentage, skills, suggestions)
 * 
 * This route works with structured resume data from the parsing API,
 * ensuring better accuracy in skill matching and analysis.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsedResume = body.parsedResume as ParsedResume | undefined
    const jobDescription = body.jobDescription as string | undefined

    // Validate inputs
    if (!parsedResume) {
      return NextResponse.json(
        { error: 'Parsed resume data is required. Please parse the resume first.' },
        { status: 400 }
      )
    }

    if (!jobDescription || jobDescription.trim().length === 0) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      )
    }

    // Validate parsed resume has required structure
    if (
      !parsedResume.skills ||
      !parsedResume.experience ||
      !parsedResume.education ||
      !parsedResume.contact
    ) {
      return NextResponse.json(
        { error: 'Invalid parsed resume structure' },
        { status: 400 }
      )
    }

    // Format structured resume data for analysis
    // This converts the structured data into a text format that the AI can analyze
    const formattedResume = formatResumeForAnalysis(parsedResume)

    // Analyze resume against job description
    const analysis = await analyzeResume(formattedResume, jobDescription)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
