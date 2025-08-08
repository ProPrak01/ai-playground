'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ConversationAnalysis from './components/ConversationAnalysis'
import ImageAnalysis from './components/ImageAnalysis'
import DocumentSummarization from './components/DocumentSummarization'

type SkillType = 'conversation' | 'image' | 'document'

const skills = [
  { 
    id: 'conversation' as SkillType, 
    name: 'Conversation Analysis', 
    description: 'Transcribe, diarize, and summarize audio',
    icon: '🎙️'
  },
  { 
    id: 'image' as SkillType, 
    name: 'Image Analysis', 
    description: 'Generate detailed image descriptions',
    icon: '🖼️'
  },
  { 
    id: 'document' as SkillType, 
    name: 'Document Summarization', 
    description: 'Summarize PDFs, documents, and URLs',
    icon: '📄'
  }
]

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedSkill, setSelectedSkill] = useState<SkillType>('conversation')
  const [history, setHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  const addToHistory = (type: string, input: any, output: any) => {
    const newEntry = {
      id: Date.now(),
      type,
      input,
      output,
      timestamp: new Date().toISOString()
    }
    setHistory(prev => [newEntry, ...prev].slice(0, 10))
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <svg className="animate-spin h-8 w-8 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Playground</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{session.user?.email}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Skill Selector */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex space-x-2 overflow-x-auto">
            {skills.map((skill) => (
              <button
                key={skill.id}
                onClick={() => setSelectedSkill(skill.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                  selectedSkill === skill.id
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                <span className="text-lg">{skill.icon}</span>
                <div className="text-left">
                  <div className="font-medium text-sm">{skill.name}</div>
                  <div className={`text-xs ${selectedSkill === skill.id ? 'text-gray-300' : 'text-gray-500'}`}>
                    {skill.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Main Panel */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-8">
                <div className="animate-fade-in">
                  {selectedSkill === 'conversation' && (
                    <ConversationAnalysis onAnalysis={addToHistory} />
                  )}
                  {selectedSkill === 'image' && (
                    <ImageAnalysis onAnalysis={addToHistory} />
                  )}
                  {selectedSkill === 'document' && (
                    <DocumentSummarization onAnalysis={addToHistory} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* History Sidebar */}
          <div className={`transition-all duration-300 ${showHistory ? 'w-80' : 'w-12'}`}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                {showHistory && (
                  <h2 className="font-semibold text-gray-900">Recent History</h2>
                )}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showHistory ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  )}
                </button>
              </div>
              
              {showHistory && (
                <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                  {history.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No history yet</p>
                  ) : (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div 
                          key={item.id} 
                          className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-900">{item.type}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {typeof item.input === 'string' ? item.input : 'File uploaded'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}