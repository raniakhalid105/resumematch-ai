import Groq from 'groq-sdk'
import { z } from 'zod'

/**
 * Structured resume data extracted from PDF
 * This schema defines the expected structure of parsed resume data
 */
export const ParsedResumeSchema = z.object({
  skills: z.array(z.string()),
  experience: z.array(z.string()),
  education: z.array(z.string()),
  contact: z.string(),
})

export type ParsedResume = z.infer<typeof ParsedResumeSchema>

/**
 * Extracts structured resume data from raw PDF text using Groq API
 * 
 * Integration Steps:
 * 1. Accept raw text extracted from PDF
 * 2. Send to Groq API with a structured prompt to extract resume components
 * 3. Parse and validate the JSON response
 * 4. Return structured data ready for skill matching
 * 
 * API Request Structure:
 * - Uses Groq chat completions API
 * - System prompt instructs AI to extract structured data
 * - User prompt contains the raw resume text
 * - Response format: JSON object with skills, experience, education, contact
 * 
 * JSON Mapping to Skill Matching:
 * - skills[] → Used directly for matching against job description skills
 * - experience[] → Provides context for skill matching and suggestions
 * - education[] → Used for educational requirements matching
 * - contact → Stored but not used in matching (for future features)
 */
export async function parseResumeFromText(
  resumeText: string
): Promise<ParsedResume> {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured. Get a free API key at https://console.groq.com/keys')
  }

  const groq = new Groq({
    apiKey: apiKey,
  })

  // System prompt: Instructs AI to extract structured resume data
  const systemPrompt = `You are an expert resume parser. Extract structured data from resume text and return ONLY valid JSON.

Extract the following information:
1. skills: An array of technical and soft skills mentioned in the resume (e.g., ["JavaScript", "React", "Team Leadership", "Project Management"])
2. experience: An array of work experience entries, each as a string describing the role, company, and key responsibilities (e.g., ["Software Engineer at Google (2020-2023): Developed web applications using React and Node.js"])
3. education: An array of educational qualifications (e.g., ["BS in Computer Science from MIT (2016-2020)"])
4. contact: A single string with contact information (email, phone, or location if available, otherwise "Not provided")

Return ONLY valid JSON in this exact format:
{
  "skills": string[],
  "experience": string[],
  "education": string[],
  "contact": string
}

Do not include any markdown formatting, code blocks, or explanatory text. Return only the JSON object.`

  // User prompt: Contains the raw resume text to be parsed
  const userPrompt = `Extract structured data from the following resume text:

${resumeText}

Provide the JSON response with skills, experience, education, and contact information.`

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile', // Updated from deprecated llama-3.1-70b-versatile
      temperature: 0.2, // Lower temperature for more consistent, accurate extraction
      response_format: { type: 'json_object' }, // Enforce JSON output format
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response content from resume parser')
    }

    // Parse and validate the JSON response
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch (parseError) {
      throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }

    // Validate the structure matches our schema
    const validated = ParsedResumeSchema.parse(parsed)

    // Ensure arrays are not empty (at minimum, return empty arrays)
    return {
      skills: validated.skills || [],
      experience: validated.experience || [],
      education: validated.education || [],
      contact: validated.contact || 'Not provided',
    }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid resume structure from parser: ${error.message}`)
    }

    // Handle Groq API errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as { message?: string }).message || ''

      // Handle quota/billing errors
      if (
        errorMessage.includes('429') ||
        errorMessage.toLowerCase().includes('quota') ||
        errorMessage.toLowerCase().includes('rate limit') ||
        errorMessage.toLowerCase().includes('too many requests')
      ) {
        throw new Error(
          'Resume parser API rate limit exceeded. Please wait a moment and try again.'
        )
      }

      // Handle authentication errors
      if (
        errorMessage.includes('401') ||
        errorMessage.toLowerCase().includes('api key') ||
        errorMessage.toLowerCase().includes('authentication') ||
        errorMessage.toLowerCase().includes('unauthorized')
      ) {
        throw new Error(
          'Resume parser API authentication failed. Please check that your GROQ_API_KEY is valid.'
        )
      }
    }

    // Handle generic errors
    if (error instanceof Error) {
      throw error
    }

    throw new Error('Unknown error occurred during resume parsing')
  }
}

/**
 * Converts structured resume data to a formatted text string
 * This is used to prepare the data for the skill matching analysis
 * 
 * The formatted text includes:
 * - Skills list
 * - Experience summaries
 * - Education details
 * 
 * This formatted text is then passed to the analyzeResume function
 * for matching against job descriptions.
 */
export function formatResumeForAnalysis(parsedResume: ParsedResume): string {
  const sections: string[] = []

  if (parsedResume.skills.length > 0) {
    sections.push(`Skills: ${parsedResume.skills.join(', ')}`)
  }

  if (parsedResume.experience.length > 0) {
    sections.push(`Experience:\n${parsedResume.experience.join('\n')}`)
  }

  if (parsedResume.education.length > 0) {
    sections.push(`Education:\n${parsedResume.education.join('\n')}`)
  }

  return sections.join('\n\n')
}

