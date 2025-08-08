'use client'

import { useState, useRef } from 'react'

interface DocumentSummarizationProps {
  onAnalysis: (type: string, input: any, output: any) => void
}

export default function DocumentSummarization({ onAnalysis }: DocumentSummarizationProps) {
  const [inputType, setInputType] = useState<'file' | 'url'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleSummarize = async () => {
    if (inputType === 'file' && !file) return
    if (inputType === 'url' && !url) return

    setLoading(true)
    setResult(null)
    
    // Set progress messages based on file type
    if (inputType === 'file' && file?.name.toLowerCase().endsWith('.pdf')) {
      setProgress('Converting PDF pages to images...')
    } else {
      setProgress('Processing document...')
    }
    
    try {
      const formData = new FormData()
      
      if (inputType === 'file' && file) {
        formData.append('document', file)
        formData.append('type', 'file')
        
        // Update progress for PDFs
        if (file.name.toLowerCase().endsWith('.pdf')) {
          setTimeout(() => setProgress('Analyzing page content and visuals...'), 2000)
          setTimeout(() => setProgress('Generating comprehensive summary...'), 5000)
        }
      } else if (inputType === 'url') {
        formData.append('url', url)
        formData.append('type', 'url')
        setProgress('Fetching and analyzing content...')
      }

      const response = await fetch('/api/analyze/document', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Summarization failed')
      }

      const data = await response.json()
      setResult(data.summary)
      onAnalysis('Document Summarization', inputType === 'file' ? file!.name : url, data.summary)
    } catch (error: any) {
      console.error('Error summarizing document:', error)
      alert(error.message || 'Failed to summarize document. Please try again.')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Document/URL Summarization</h2>
        <p className="text-gray-600">Upload a document (PDF, DOC) or provide a URL to get a summary.</p>
        <p className="text-sm text-gray-500 mt-1">PDFs are converted to images for complete visual analysis including graphs and tables.</p>
      </div>

      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setInputType('file')}
          className={`px-4 py-2 rounded-md transition-colors ${
            inputType === 'file'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setInputType('url')}
          className={`px-4 py-2 rounded-md transition-colors ${
            inputType === 'url'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Enter URL
        </button>
      </div>

      {inputType === 'file' ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
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
              {file ? file.name : 'Click to upload PDF, DOC, or TXT file'}
            </p>
            {file && file.name.toLowerCase().endsWith('.pdf') && (
              <p className="mt-1 text-xs text-indigo-600">
                PDF will be converted to images for complete visual analysis
              </p>
            )}
          </button>
        </div>
      ) : (
        <div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to summarize"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      )}

      {((inputType === 'file' && file) || (inputType === 'url' && url)) && (
        <button
          onClick={handleSummarize}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {progress || 'Processing...'}
            </div>
          ) : 'Summarize'}
        </button>
      )}

      {result && (
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
          <div className="text-gray-700 whitespace-pre-wrap prose prose-sm max-w-none">
            {result.split('\n').map((line, index) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                return <h4 key={index} className="font-bold mt-3 mb-1">{line.replace(/\*\*/g, '')}</h4>
              }
              if (line.startsWith('---')) {
                return <hr key={index} className="my-3" />
              }
              return <p key={index} className="mb-2">{line}</p>
            })}
          </div>
        </div>
      )}
    </div>
  )
}