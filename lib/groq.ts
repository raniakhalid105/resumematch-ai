import Groq from 'groq-sdk'
import { z } from 'zod'

// Schema for validating the AI response structure
const AnalysisResultSchema = z.object({
  matchPercentage: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  suggestions: z.array(z.string()),
})

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>

/**
 * Analyzes a resume against a job description using Groq API
 * Groq offers free tier with generous limits and fast inference
 * 
 * Prompt design reasoning:
 * - Explicit JSON format requirement ensures parseable output
 * - Detailed instructions for each field ensure consistency
 * - Match percentage calculation guidelines ensure realistic scoring
 * - Skill extraction focuses on technical and soft skills mentioned
 */
export async function analyzeResume(
  resumeText: string,
  jobDescription: string
): Promise<AnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured. Get a free API key at https://console.groq.com/keys')
  }

  const groq = new Groq({
    apiKey: apiKey,
  })

  const systemPrompt = `You are an expert resume analyst. Your task is to analyze a resume against a job description and return a structured JSON response.

Analyze the resume text and job description, then provide:
1. matchPercentage: A realistic percentage (0-100) indicating how well the resume matches the job requirements. Be conservative and accurate.
2. matchedSkills: An array of skills that appear in both the resume and job description. Include technical skills, programming languages, tools, frameworks, and relevant soft skills.
3. missingSkills: An array of important skills mentioned in the job description that are not present in the resume.
4. suggestions: An array of actionable, specific improvement suggestions (2-5 suggestions) to help the candidate improve their resume match.

Return ONLY valid JSON in this exact format:
{
  "matchPercentage": number,
  "matchedSkills": string[],
  "missingSkills": string[],
  "suggestions": string[]
}

Do not include any markdown formatting, code blocks, or explanatory text. Return only the JSON object.`

  const userPrompt = `Resume Text:
${resumeText}

Job Description:
${jobDescription}

Analyze the resume against the job description and provide the JSON response as specified.`

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile', // Current model - fast and free tier friendly
      temperature: 0.3, // Lower temperature for more consistent, structured output
      response_format: { type: 'json_object' }, // Enforce JSON output format
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response content from Groq')
    }

    // Parse and validate the JSON response
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch (parseError) {
      throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }

    // Validate the structure matches our schema
    const validated = AnalysisResultSchema.parse(parsed)

    return validated
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid response structure from AI: ${error.message}`)
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
          'Groq API rate limit exceeded. Free tier allows 14,400 requests per day. ' +
          'Please wait a moment and try again, or check your usage at https://console.groq.com'
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
          'Groq API authentication failed. Please check that your API key is valid. ' +
          'Get a free API key at https://console.groq.com/keys'
        )
      }
    }
    
    // Handle generic errors
    if (error instanceof Error) {
      const errorMsg = error.message || ''
      
      // Check if it's a quota error in the message
      if (
        errorMsg.includes('429') ||
        errorMsg.toLowerCase().includes('quota') ||
        errorMsg.toLowerCase().includes('rate limit') ||
        errorMsg.toLowerCase().includes('too many requests')
      ) {
        throw new Error(
          'Groq API rate limit exceeded. Free tier allows 14,400 requests per day. ' +
          'Please wait a moment and try again.'
        )
      }
      
      throw error
    }
    
    throw new Error('Unknown error occurred during AI analysis')
  }
}

