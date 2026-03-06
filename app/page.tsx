'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()
  const [text, setText] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const generateAudio = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const data = await res.json()
      if (data.audio_url) {
        setAudioUrl(data.audio_url)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  if (session) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">MiniMax TTS</h1>
            <div className="flex items-center gap-4">
              <span>{session.user?.email}</span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                退出
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入要转换的文字..."
              className="w-full h-32 p-4 border rounded-lg"
            />
            
            <button
              onClick={generateAudio}
              disabled={loading || !text.trim()}
              className="w-full py-3 bg-blue-600 text-white rounded-lg disabled:opacity50"
            >
              {loading ? '生成中...' : '生成音频'}
            </button>

            {audioUrl && (
              <div className="mt-4">
                <audio controls src={audioUrl} className="w-full" />
                <a href={audioUrl} download className="block mt-2 text-blue-600 text-center">
                  下载音频
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">MiniMax TTS</h1>
        <p className="mb-8 text-gray-600">极速调用你的MiniMax音频</p>
        <button
          onClick={() => signIn()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          登录后使用
        </button>
      </div>
    </main>
  )
}
