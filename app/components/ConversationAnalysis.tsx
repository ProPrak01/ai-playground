'use client'

import { useState, useRef } from 'react'

interface ConversationAnalysisProps {
  onAnalysis: (type: string, input: any, output: any) => void
}

export default function ConversationAnalysis({ onAnalysis }: ConversationAnalysisProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    transcript: string
    diarization: Array<{ speaker: string; text: string }>
    summary?: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleAnalyze = async () => {
    if (!file) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('audio', file)

      const response = await fetch('/api/analyze/conversation', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Analysis failed')

      const data = await response.json()
      setResult(data)
      onAnalysis('Conversation Analysis', file.name, data)
    } catch (error) {
      console.error('Error analyzing audio:', error)
      alert('Failed to analyze audio. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Conversation Analysis</h2>
        <p className="text-gray-600">Upload an audio file to transcribe, diarize (2 speakers max), and summarize.</p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full text-center"
        >
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            {file ? file.name : 'Click to upload audio file'}
          </p>
        </button>
      </div>

      {file && (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Analyze Audio'}
        </button>
      )}

      {result && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Transcript</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{result.transcript}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Diarization</h3>
            <div className="space-y-2">
              {result.diarization.map((segment, index) => (
                <div key={index} className="flex gap-2">
                  <span className="font-medium text-indigo-600">{segment.speaker}:</span>
                  <span className="text-gray-700">{segment.text}</span>
                </div>
              ))}
            </div>
          </div>

          {result.summary && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
              <p className="text-gray-700">{result.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}