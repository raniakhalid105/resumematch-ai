import ResumeAnalyzer from '@/components/ResumeAnalyzer'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            ResumeMatch AI
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Analyze your resume against job descriptions and receive detailed insights
            on skills matching, gaps, and actionable improvement suggestions.
          </p>
        </div>
        <ResumeAnalyzer />
      </div>
    </main>
  )
}
