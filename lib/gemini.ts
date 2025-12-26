import { GoogleGenerativeAI } from '@google/generative-ai'
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
 * Analyzes a resume against a job description using Google Gemini
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
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Get a free API key at https://makersuite.google.com/app/apikey')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  
  // Try different model names - availability varies by region/account
  // Common model names: gemini-pro (most compatible), gemini-1.5-pro, gemini-1.5-flash
  const modelName = 'gemini-1.5-flash' // Most widely available model name
  
  const model = genAI.getGenerativeModel({ 
    model: modelName,
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
    // Combine system and user prompt for Gemini (it doesn't have separate system messages)
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`

    const result = await model.generateContent(fullPrompt, {
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent, structured output
        responseMimeType: 'application/json', // Request JSON response
      },
    })

    const response = result.response
    const content = response.text()

    if (!content) {
      throw new Error('No response content from Gemini')
    }

    // Parse and validate the JSON response
    let parsed: unknown
    try {
      // Gemini might wrap JSON in markdown code blocks, so try to extract it
      let jsonContent = content.trim()
      
      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '')
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '')
      }
      
      parsed = JSON.parse(jsonContent)
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
    
    // Handle Gemini API errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as { message?: string }).message || ''
      
      // Handle model not found errors (404)
      if (
        errorMessage.includes('404') ||
        errorMessage.toLowerCase().includes('not found') ||
        errorMessage.toLowerCase().includes('is not found for api version') ||
        errorMessage.toLowerCase().includes('is not found')
      ) {
        throw new Error(
          `Gemini model "${modelName}" is not available for your account/region. ` +
          'Available models vary by region. Try changing the model name in lib/gemini.ts to: "gemini-pro" or "gemini-1.5-flash". ' +
          'Check available models: https://ai.google.dev/models'
        )
      }
      
      // Handle quota/billing errors
      if (
        errorMessage.includes('429') ||
        errorMessage.toLowerCase().includes('quota') ||
        errorMessage.toLowerCase().includes('resource exhausted') ||
        errorMessage.toLowerCase().includes('rate limit')
      ) {
        throw new Error(
          'Gemini API quota exceeded. You have reached the free tier limit. ' +
          'Please wait a moment and try again, or upgrade at https://ai.google.dev/pricing'
        )
      }
      
      // Handle authentication errors
      if (
        errorMessage.includes('401') ||
        errorMessage.toLowerCase().includes('api key') ||
        errorMessage.toLowerCase().includes('authentication')
      ) {
        throw new Error(
          'Gemini API authentication failed. Please check that your API key is valid. ' +
          'Get a free API key at https://makersuite.google.com/app/apikey'
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
        errorMsg.toLowerCase().includes('resource exhausted') ||
        errorMsg.toLowerCase().includes('rate limit')
      ) {
        throw new Error(
          'Gemini API quota exceeded. You have reached the free tier limit. ' +
          'Please wait a moment and try again, or upgrade at https://ai.google.dev/pricing'
        )
      }
      
      throw error
    }
    
    throw new Error('Unknown error occurred during AI analysis')
  }
}

