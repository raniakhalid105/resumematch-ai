'use client'

import { useState, FormEvent } from 'react'
import { AnalysisResult } from '@/lib/groq'
import { ParsedResume } from '@/lib/resumeParser'
import AnalysisResults from './AnalysisResults'
import FileUpload from './FileUpload'

export default function ResumeAnalyzer() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handle form submission with two-step process:
   * 1. Parse resume PDF to structured data
   * 2. Analyze parsed resume against job description
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setAnalysis(null)

    if (!resumeFile) {
      setError('Please upload a resume file')
      return
    }

    if (!jobDescription.trim()) {
      setError('Please provide a job description')
      return
    }

    setLoading(true)

    try {
      // Step 1: Parse resume PDF to structured data
      const parseFormData = new FormData()
      parseFormData.append('resumeFile', resumeFile)

      const parseResponse = await fetch('/api/parse-resume', {
        method: 'POST',
        body: parseFormData,
      })

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json()
        throw new Error(errorData.error || 'Resume parsing failed')
      }

      const parsedResume: ParsedResume = await parseResponse.json()

      // Step 2: Analyze parsed resume against job description
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parsedResume,
          jobDescription,
        }),
      })

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const analysisData = await analyzeResponse.json()
      setAnalysis(analysisData)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An error occurred during analysis'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResumeFile(null)
    setJobDescription('')
    setAnalysis(null)
    setError(null)
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="resumeFile"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Upload Resume (PDF)
            </label>
            <FileUpload
              file={resumeFile}
              onFileChange={setResumeFile}
              accept="application/pdf"
            />
          </div>

          <div>
            <label
              htmlFor="jobDescription"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Job Description
            </label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              placeholder="Paste the job description here..."
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <div className="font-semibold mb-1">Error</div>
              <div className="text-sm">{error}</div>
              {error.includes('quota') || error.includes('billing') ? (
                <div className="mt-2 text-xs text-red-600">
                  <a
                    href="https://platform.openai.com/account/billing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-red-800"
                  >
                    Check your OpenAI billing settings →
                  </a>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !resumeFile || !jobDescription.trim()}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Analyzing...' : 'Analyze Resume'}
            </button>
            {analysis && (
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {analysis && <AnalysisResults analysis={analysis} />}
    </div>
  )
}
