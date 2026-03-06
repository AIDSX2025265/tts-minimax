'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

const VOICES = [
  { id: 'yansangdage002', name: '烟嗓大哥' },
  { id: 'keainvsheng001', name: '可爱女声' },
  { id: 'nengliangnvzhu006', name: '能量女主' },
  { id: 'achuan_voice_003', name: '中性男声' },
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
  const [voice, setVoice] = useState('achuan_voice_003')
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
        body: JSON.stringify({ text, voice, emotion, speed })
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

  // 墨绿色主题
  const theme = darkMode ? {
    bg: 'from-slate-900 via-green-900 to-slate-800',
    card: 'bg-black/30 border-green-800/30',
    text: 'text-white',
    textSecondary: 'text-green-300',
    input: 'bg-black/30 border-green-700/30 text-white placeholder-green-600/50',
    button: 'from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600',
  } : {
    bg: 'from-green-50 via-emerald-50 to-green-100',
    card: 'bg-white/80 border-green-200',
    text: 'text-gray-800',
    textSecondary: 'text-green-700',
    input: 'bg-white border-green-300 text-gray-800 placeholder-green-500',
    button: 'from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500',
  }

  const displayList = showSaved ? savedList : history
  const isTestUser = session?.user?.email === 'test@example.com'

  if (session) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.bg}`}>
        <header className={`border-b ${darkMode ? 'border-green-800/50 bg-black/40' : 'border-green-200 bg-white/80'} backdrop-blur-md`}>
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-r ${theme.button} rounded-xl flex items-center justify-center shadow-lg`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className={`text-xl font-bold ${theme.text}`}>大师兄的AI配音坊</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-4 py-1.5 rounded-full ${darkMode ? 'bg-green-900/50' : 'bg-green-100'} border ${darkMode ? 'border-green-700/50' : 'border-green-300'}`}>
                <span className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-700'}`}>💰 {isTestUser ? '无限' : credits} 积分</span>
              </div>
              <button onClick={() => setShowSaved(!showSaved)} className={`px-4 py-1.5 rounded-full text-sm ${showSaved ? `text-white bg-gradient-to-r ${theme.button}` : (darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700')}`}>
                {showSaved ? '📋 历史' : `⭐ ${savedList.length}`}
              </button>
              <button onClick={toggleDarkMode} className={`p-2 rounded-full ${darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'}`}>
                {darkMode ? '☀️' : '🌙'}
              </button>
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm`}>
                {session.user?.email?.charAt(0).toUpperCase()}
              </div>
              <button onClick={() => signIn()} className={`px-3 py-1.5 rounded-full text-sm ${darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'}`}>
                切换
              </button>
              <button onClick={() => signOut()} className={`px-3 py-1.5 rounded-full text-sm ${darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'}`}>
                退出
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className={`${theme.card} backdrop-blur-sm border rounded-2xl p-6 mb-6`}>
            <h2 className={`text-sm font-medium ${theme.textSecondary} mb-4`}>声音设置</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={`block text-xs ${theme.textSecondary} mb-2`}>音色</label>
                <select value={voice} onChange={(e) => setVoice(e.target.value)} className={`w-full p-3 ${theme.input} rounded-xl text-sm`}>
                  <option value="achuan_voice_003">中性男声</option>
                  <option value="yansangdage002">烟嗓大哥</option>
                  <option value="keainvsheng001">可爱女声</option>
                  <option value="nengliangnvzhu006">能量女主</option>
                </select>
              </div>
              <div>
                <label className={`block text-xs ${theme.textSecondary} mb-2`}>情感</label>
                <select value={emotion} onChange={(e) => setEmotion(e.target.value)} className={`w-full p-3 ${theme.input} rounded-xl text-sm`}>
                  {EMOTIONS.map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}
                </select>
              </div>
              <div>
                <label className={`block text-xs ${theme.textSecondary} mb-2`}>语速</label>
                <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className={`w-full p-3 ${theme.input} rounded-xl text-sm`}>
                  {SPEEDS.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
            </div>
          </div>

          <div className={`${theme.card} backdrop-blur-sm border rounded-2xl p-6 mb-6`}>
            <h2 className={`text-sm font-medium ${theme.textSecondary} mb-4 flex items-center gap-2`}>
              <span className={`w-2 h-2 ${darkMode ? 'bg-green-500' : 'bg-green-600'} rounded-full animate-pulse`}></span>
              {showSaved ? '已保存的音频' : '生成语音'}
            </h2>
            {!showSaved && (
              <>
                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="输入要转换的文字..." className={`w-full h-40 p-4 ${theme.input} rounded-xl text-sm resize-none`} />
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-4">
                    <span className={`text-sm ${darkMode ? 'text-green-500' : 'text-green-600'}`}>{charCount} 字符</span>
                    {charCount > 0 && (
                      <span className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>💰 {costCredits} 积分 (100积分=10000字符)</span>
                    )}
                  </div>
                  <button onClick={generateAudio} disabled={loading || !text.trim()} className={`px-8 py-3 bg-gradient-to-r ${theme.button} text-white rounded-xl text-sm font-medium disabled:opacity-50`}>
                    {loading ? '生成中...' : '✨ 生成音频'}
                  </button>
                </div>
              </>
            )}
            {audioUrl && !showSaved && (
              <div className={`mt-6 p-4 ${darkMode ? 'bg-black/20' : 'bg-green-50'} rounded-xl`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm ${theme.textSecondary}`}>最新生成</span>
                  <div className="flex gap-3">
                    <button onClick={() => saveAudio({id: Date.now().toString(), text, url: audioUrl, time: new Date().toISOString()})} className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>⭐ 保存</button>
                    <a href={audioUrl} download="audio.mp3" className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>📥 下载</a>
                  </div>
                </div>
                <audio controls src={audioUrl} className="w-full h-10" />
              </div>
            )}
          </div>

          {displayList.length > 0 && (
            <div className={`${theme.card} backdrop-blur-sm border rounded-2xl p-6`}>
              <h3 className={`text-sm font-medium ${theme.textSecondary} mb-4`}>{showSaved ? '已保存' : '历史记录'}</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {displayList.map((item) => (
                  <div key={item.id} className={`flex items-center gap-4 p-4 rounded-xl ${darkMode ? 'bg-black/20' : 'bg-green-50'}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${theme.text} truncate`}>{item.text}</p>
                      <p className={`text-xs ${darkMode ? 'text-green-600' : 'text-green-500'}`}>{new Date(item.time).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      {showSaved && (
                        <button onClick={() => deleteSaved(item.id)} className={`p-2 ${darkMode ? 'text-green-600' : 'text-green-500'}`}>🗑️</button>
                      )}
                      {!item.saved && !showSaved && (
                        <button onClick={() => saveAudio(item)} className={`p-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>⭐</button>
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
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} flex items-center justify-center p-6`}>
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 bg-gradient-to-r ${theme.button} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl`}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>大师兄的AI配音坊</h1>
          <p className={theme.textSecondary}>极速调用你的克隆声音</p>
        </div>
        <div className={`${theme.card} backdrop-blur-sm border rounded-2xl p-8 shadow-xl`}>
          <button onClick={() => signIn()} className={`w-full py-4 bg-gradient-to-r ${theme.button} text-white rounded-xl font-medium`}>
            立即体验
          </button>
          <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-green-800/30' : 'border-green-200'}`}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><div className="text-2xl mb-1">🎤</div><p className={`${theme.textSecondary} text-xs`}>真人音色</p></div>
              <div><div className="text-2xl mb-1">⚡</div><p className={`${theme.textSecondary} text-xs`}>极速生成</p></div>
              <div><div className="text-2xl mb-1">💎</div><p className={`${theme.textSecondary} text-xs`}>100积分=1万字</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
