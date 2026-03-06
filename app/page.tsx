'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

const VOICES = [
  { id: 'chuan_ge', name: '川哥' },
]

const EMOTIONS = [
  { id: '', name: '标准' },
  { id: 'happy', name: '开心' },
  { id: 'sad', name: '悲伤' },
  { id: 'angry', name: '愤怒' },
  { id: 'neutral', name: '中性' },
]

const SPEEDS = [
  { id: 0.8, name: '0.8x 慢速' },
  { id: 1, name: '1.0x 标准' },
  { id: 1.2, name: '1.2x 快速' },
  { id: 1.5, name: '1.5x 极速' },
]

interface AudioItem {
  id: string
  text: string
  url: string
  time: string
  saved?: boolean
}

export default function Home() {
  const { data: session } = useSession()
  const [text, setText] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<AudioItem[]>([])
  const [savedList, setSavedList] = useState<AudioItem[]>([])
  const [showSaved, setShowSaved] = useState(false)
  const [emotion, setEmotion] = useState('')
  const [voice, setVoice] = useState('chuan_ge')
  const [speed, setSpeed] = useState(1)
  const [darkMode, setDarkMode] = useState(true)
  const [credits, setCredits] = useState(0)

  const charCount = text.length
  const costCredits = Math.ceil(charCount / 100)

  useEffect(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) setDarkMode(saved === 'true')
    
    const savedAudios = localStorage.getItem('savedAudios')
    if (savedAudios) {
      const parsed = JSON.parse(savedAudios) as AudioItem[]
      const now = Date.now()
      const filtered = parsed.filter(item => now - new Date(item.time).getTime() < 24 * 60 * 60 * 1000)
      setSavedList(filtered)
      localStorage.setItem('savedAudios', JSON.stringify(filtered))
    }

    if (session?.user?.email) {
      const users = JSON.parse(localStorage.getItem('tts_users') || '[]')
      const user = users.find((u: any) => u.email === session.user?.email)
      if (user) setCredits(user.credits || 0)
    }
  }, [session])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
  }

  const deductCredits = (amount: number) => {
    if (!session?.user?.email) return false
    const users = JSON.parse(localStorage.getItem('tts_users') || '[]')
    const userIndex = users.findIndex((u: any) => u.email === session.user?.email)
    if (userIndex >= 0) {
      if (users[userIndex].credits >= amount) {
        users[userIndex].credits -= amount
        setCredits(users[userIndex].credits)
        localStorage.setItem('tts_users', JSON.stringify(users))
        return true
      }
    }
    return false
  }

  const generateAudio = async () => {
    if (!text.trim()) return
    if (costCredits > credits && session?.user?.email !== 'test@example.com') {
      alert('积分不足！请联系管理员充值')
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, emotion, speed })
      })
      const data = await res.json()
      if (data.audio_url) {
        if (session?.user?.email !== 'test@example.com') deductCredits(costCredits)
        
        const newItem: AudioItem = {
          id: Date.now().toString(),
          text,
          url: data.audio_url,
          time: new Date().toISOString(),
          saved: false
        }
        setAudioUrl(data.audio_url)
        setHistory([newItem, ...history])
      } else {
        alert(data.error || '生成失败')
      }
    } catch (e) {
      alert('生成失败')
    }
    setLoading(false)
  }

  const saveAudio = (item: AudioItem) => {
    const exists = savedList.find(s => s.id === item.id)
    if (!exists) {
      const newSaved = [...savedList, { ...item, saved: true }]
      setSavedList(newSaved)
      localStorage.setItem('savedAudios', JSON.stringify(newSaved))
    }
    setHistory(history.map(h => h.id === item.id ? { ...h, saved: true } : h))
  }

  const deleteSaved = (id: string) => {
    const newSaved = savedList.filter(s => s.id !== id)
    setSavedList(newSaved)
    localStorage.setItem('savedAudios', JSON.stringify(newSaved))
  }

  // 科技风主题
  const theme = {
    bg: 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900',
    card: 'bg-slate-800/60 backdrop-blur-xl border border-blue-500/20',
    text: 'text-white',
    textSecondary: 'text-blue-300',
    input: 'bg-slate-900/80 border border-blue-500/30 text-white placeholder-blue-400/50 focus:border-blue-500',
    button: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500',
    buttonDisabled: 'bg-slate-700 text-slate-500',
  }

  const displayList = showSaved ? savedList : history
  const isTestUser = session?.user?.email === 'test@example.com'

  if (session) {
    return (
      <div className={`min-h-screen ${theme.bg} text-white`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHY0YzAgOS45NDEgOC4wNTkgMTggMTggMTggOS45NDEgMCAxOC04LjA1OSAxOEgxNnYtNGMwLTkuOTQxLTguMDU5LTE4LTE4LTE4em0tMjAgMEgxNnYtNGMwLTkuOTQxLTguMDU5LTE4LTE4LTE4djRjMCA5Ljk0MSA4LjA1OSAxOCAxOCAxOHoiIGZpbGw9IiMyMDc0cHEiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        
        <header className="relative border-b border-blue-500/20 bg-slate-900/80 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">大师兄的AI配音坊</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30">
                <span className="text-sm font-medium text-blue-300">💰 {isTestUser ? '无限' : credits} 积分</span>
              </div>
              <button onClick={() => setShowSaved(!showSaved)} className={`px-4 py-1.5 rounded-full text-sm ${showSaved ? theme.button : 'bg-slate-700'}`}>
                {showSaved ? '📋 历史' : `⭐ ${savedList.length}`}
              </button>
              <button onClick={toggleDarkMode} className="p-2 rounded-full bg-slate-700 hover:bg-slate-600">
                {darkMode ? '☀️' : '🌙'}
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-medium">
                {session.user?.email?.charAt(0).toUpperCase()}
              </div>
              <button onClick={() => signOut()} className="px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-sm">
                退出
              </button>
            </div>
          </div>
        </header>

        <main className="relative max-w-4xl mx-auto px-6 py-8">
          <div className={`${theme.card} rounded-2xl p-6 mb-6`}>
            <h2 className="text-sm font-medium text-blue-300 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              声音设置
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-blue-400 mb-2">音色</label>
                <select value={voice} onChange={(e) => setVoice(e.target.value)} className={`w-full p-3 ${theme.input} rounded-xl text-sm`}>
                  <option value="chuan_ge">川哥</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-blue-400 mb-2">情感</label>
                <select value={emotion} onChange={(e) => setEmotion(e.target.value)} className={`w-full p-3 ${theme.input} rounded-xl text-sm`}>
                  {EMOTIONS.map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-blue-400 mb-2">语速</label>
                <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className={`w-full p-3 ${theme.input} rounded-xl text-sm`}>
                  {SPEEDS.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
            </div>
          </div>

          <div className={`${theme.card} rounded-2xl p-6 mb-6`}>
            <h2 className="text-sm font-medium text-blue-300 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              {showSaved ? '已保存的音频' : '生成语音'}
            </h2>
            {!showSaved && (
              <>
                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="输入要转换的文字..." className={`w-full h-40 p-4 ${theme.input} rounded-xl text-sm resize-none`} />
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-blue-400">{charCount} 字符</span>
                    {charCount > 0 && (
                      <span className="text-sm text-cyan-400">💰 {costCredits} 积分 (100积分=10000字符)</span>
                    )}
                  </div>
                  <button onClick={generateAudio} disabled={loading || !text.trim()} className={`px-8 py-3 ${loading || !text.trim() ? theme.buttonDisabled : theme.button} rounded-xl text-sm font-medium disabled:opacity-50 transition-all hover:scale-105`}>
                    {loading ? '生成中...' : '✨ 生成音频'}
                  </button>
                </div>
              </>
            )}
            {audioUrl && !showSaved && (
              <div className="mt-6 p-4 bg-slate-900/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-blue-300">最新生成</span>
                  <div className="flex gap-3">
                    <button onClick={() => saveAudio({id: Date.now().toString(), text, url: audioUrl, time: new Date().toISOString()})} className="text-sm text-cyan-400 hover:text-cyan-300">⭐ 保存</button>
                    <a href={audioUrl} download="audio.mp3" className="text-sm text-cyan-400 hover:text-cyan-300">📥 下载</a>
                  </div>
                </div>
                <audio controls src={audioUrl} className="w-full h-10" />
              </div>
            )}
          </div>

          {displayList.length > 0 && (
            <div className={`${theme.card} rounded-2xl p-6`}>
              <h3 className="text-sm font-medium text-blue-300 mb-4">{showSaved ? '已保存' : '历史记录'}</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {displayList.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-900/30 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.text}</p>
                      <p className="text-xs text-blue-500">{new Date(item.time).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      {showSaved && (
                        <button onClick={() => deleteSaved(item.id)} className="p-2 text-blue-500 hover:text-blue-400">🗑️</button>
                      )}
                      {!item.saved && !showSaved && (
                        <button onClick={() => saveAudio(item)} className="p-2 text-cyan-400">⭐</button>
                      )}
                      <audio controls src={item.url} className="h-8 w-36" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-6`}>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHY0YzAgOS45NDEgOC4wNTkgMTggMTggMTggOS45NDEgMCAxOC04LjA1OSAxOEgxNnYtNGMwLTkuOTQxLTguMDU5LTE4LTE4LTE4em0tMjAgMEgxNnYtNGMwLTkuOTQxLTguMDU5LTE4LTE4LTE4djRjMCA5Ljk0MSA4LjA1OSAxOCAxOCAxOHoiIGZpbGw9IiMyMDc0cHEiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
      <div className="relative max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">大师兄的AI配音坊</h1>
          <p className="text-blue-300">极速调用你的克隆声音</p>
        </div>
        <div className={`${theme.card} rounded-2xl p-8 shadow-2xl`}>
          <button onClick={() => signIn()} className={`w-full py-4 ${theme.button} rounded-xl font-medium transition-all hover:scale-[1.02]`}>
            立即体验
          </button>
          <div className="mt-6 pt-6 border-t border-blue-500/20">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><div className="text-2xl mb-1">🎙️</div><p className="text-blue-400 text-xs">川哥音色</p></div>
              <div><div className="text-2xl mb-1">⚡</div><p className="text-blue-400 text-xs">极速生成</p></div>
              <div><div className="text-2xl mb-1">💎</div><p className="text-blue-400 text-xs">100积分=1万字</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
