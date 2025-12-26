import OpenAI from 'openai'
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
 * Analyzes a resume against a job description using OpenAI
 * Uses a strong system prompt to enforce structured JSON output
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
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const openai = new OpenAI({
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
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent, structured output
      response_format: { type: 'json_object' }, // Enforce JSON output format
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response content from OpenAI')
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
    
    // Handle OpenAI API errors
    // OpenAI SDK v4 throws errors with status and message properties
    // Check if error has status property (APIError structure)
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status?: number; message?: string }
      
      // Handle quota/billing errors (429)
      if (apiError.status === 429) {
        const errorMsg = (apiError.message || '').toLowerCase()
        if (errorMsg.includes('quota') || errorMsg.includes('billing') || errorMsg.includes('exceeded')) {
          throw new Error(
            'OpenAI API quota exceeded. Please check your OpenAI account billing and usage limits. ' +
            'Visit https://platform.openai.com/account/billing to add credits or upgrade your plan.'
          )
        }
        throw new Error(
          'OpenAI API rate limit exceeded. Please wait a moment and try again, or upgrade your plan for higher rate limits.'
        )
      }
      
      // Handle authentication errors (401)
      if (apiError.status === 401) {
        throw new Error(
          'OpenAI API authentication failed. Please check that your API key is valid and correctly configured in your .env.local file.'
        )
      }
      
      // Handle other API errors with status codes
      throw new Error(
        `OpenAI API error (${apiError.status}): ${apiError.message || 'Unknown error'}`
      )
    }
    
    // Handle generic errors (fallback for cases where error structure might be different)
    if (error instanceof Error) {
      const errorMsg = error.message || ''
      
      // Check if it's a quota/billing error in the message
      if (
        errorMsg.includes('429') || 
        errorMsg.toLowerCase().includes('quota') || 
        errorMsg.toLowerCase().includes('billing') ||
        errorMsg.toLowerCase().includes('exceeded your current quota')
      ) {
        throw new Error(
          'OpenAI API quota exceeded. Please check your OpenAI account billing and usage limits. ' +
          'Visit https://platform.openai.com/account/billing to add credits or upgrade your plan.'
        )
      }
      
      // Check for rate limit errors
      if (errorMsg.toLowerCase().includes('rate limit')) {
        throw new Error(
          'OpenAI API rate limit exceeded. Please wait a moment and try again.'
        )
      }
      
      throw error
    }
    
    throw new Error('Unknown error occurred during AI analysis')
  }
}
