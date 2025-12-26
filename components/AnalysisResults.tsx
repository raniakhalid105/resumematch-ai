'use client'

import { AnalysisResult } from '@/lib/groq'

interface AnalysisResultsProps {
  analysis: AnalysisResult
}

export default function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const getMatchColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getMatchLabel = (percentage: number) => {
    if (percentage >= 70) return 'Strong Match'
    if (percentage >= 50) return 'Moderate Match'
    return 'Weak Match'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Analysis Results
        </h2>

        {/* Match Percentage Card */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Match Percentage
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getMatchColor(
                analysis.matchPercentage
              )}`}
            >
              {getMatchLabel(analysis.matchPercentage)}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-bold text-gray-900">
              {analysis.matchPercentage.toFixed(1)}
            </span>
            <span className="text-2xl text-gray-600">%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full ${getMatchColor(
                analysis.matchPercentage
              )} transition-all duration-500 ease-out`}
              style={{ width: `${analysis.matchPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Matched Skills */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Matched Skills
            </h3>
            {analysis.matchedSkills.length > 0 ? (
              <ul className="space-y-2">
                {analysis.matchedSkills.map((skill, index) => (
                  <li
                    key={index}
                    className="flex items-center text-sm text-gray-700"
                  >
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3" />
                    {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No matching skills found
              </p>
            )}
          </div>

          {/* Missing Skills */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Missing Skills
            </h3>
            {analysis.missingSkills.length > 0 ? (
              <ul className="space-y-2">
                {analysis.missingSkills.map((skill, index) => (
                  <li
                    key={index}
                    className="flex items-center text-sm text-gray-700"
                  >
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3" />
                    {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No missing skills identified
              </p>
            )}
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Improvement Suggestions
          </h3>
          {analysis.suggestions.length > 0 ? (
            <ul className="space-y-3">
              {analysis.suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex items-start text-sm text-gray-700"
                >
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3 mt-0.5 text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">
              No suggestions available
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
