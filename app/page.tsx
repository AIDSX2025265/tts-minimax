'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

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

const PRICE_PER_1K = 0.01 // 1000字符 = $0.01
const CNY_RATE = 7
const CHARS_PER_CREDIT = 1000 // 1积分 = 1000字符

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
  const [speed, setSpeed] = useState(1)
  const [darkMode, setDarkMode] = useState(false)
  const [credits, setCredits] = useState(0)
  const [showRecharge, setShowRecharge] = useState(false)

  const charCount = text.length
  const costCredits = Math.ceil(charCount / CHARS_PER_CREDIT)
  const costCNY = (charCount / 1000) * PRICE_PER_1K * CNY_RATE

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

    // 加载用户积分
    if (session?.user?.email) {
      const users = JSON.parse(localStorage.getItem('tts_users') || '[]')
      const user = users.find((u: any) => u.email === session.user?.email)
      if (user) {
        setCredits(user.credits || 0)
      }
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
      alert('积分不足！请先充值积分')
      setShowRecharge(true)
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
        // 扣除积分
        if (session?.user?.email !== 'test@example.com') {
          deductCredits(costCredits)
        }
        
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

  const recharge = () => {
    // 模拟充值：充1000积分
    if (!session?.user?.email) return
    const users = JSON.parse(localStorage.getItem('tts_users') || '[]')
    const userIndex = users.findIndex((u: any) => u.email === session.user?.email)
    if (userIndex >= 0) {
      users[userIndex].credits = (users[userIndex].credits || 0) + 1000
      setCredits(users[userIndex].credits)
      localStorage.setItem('tts_users', JSON.stringify(users))
      alert('充值成功！+1000积分')
    }
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

  const theme = darkMode ? {
    bg: 'from-gray-900 via-gray-800 to-gray-900',
    card: 'bg-gray-800/50 border-gray-700',
    text: 'text-white',
    textMuted: 'text-gray-300',
    textMuted2: 'text-gray-400',
    input: 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-500',
    select: 'bg-gray-900/50 border-gray-600 text-white',
    selectOption: 'bg-gray-800',
    header: 'border-gray-700 bg-gray-900/80',
    icon: 'text-gray-400',
    accent: 'text-gray-300',
    avatar: 'bg-gray-600',
    buttonBg: 'from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600',
    dot: 'bg-gray-400',
  } : {
    bg: 'from-slate-900 via-green-900 to-slate-800',
    card: 'bg-black/30 border-green-800/30',
    text: 'text-white',
    textMuted: 'text-green-300',
    textMuted2: 'text-green-400',
    input: 'bg-black/30 border-green-700/30 text-white placeholder-green-600/50',
    select: 'bg-black/30 border-green-700/30 text-white',
    selectOption: 'bg-slate-900',
    header: 'border-green-800/50 bg-black/40',
    icon: 'text-green-400',
    accent: 'text-green-400',
    avatar: 'bg-green-600',
    buttonBg: 'from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600',
    dot: 'bg-green-500',
  }

  const IconBg = darkMode ? 'from-gray-600 to-gray-700' : 'from-green-600 to-emerald-700'
  const displayList = showSaved ? savedList : history
  const isTestUser = session?.user?.email === 'test@example.com'

  if (session) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.bg}`}>
        <header className={`border-b ${theme.header} backdrop-blur-md`}>
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-r ${IconBg} rounded-xl flex items-center justify-center shadow-lg`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className={`text-xl font-bold ${theme.text}`}>MiniMax TTS</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-green-900/50'} border ${darkMode ? 'border-gray-600' : 'border-green-700/50'}`}>
                <span className={`${theme.textMuted2} text-sm`}>💰 积分: {isTestUser ? '无限' : credits}</span>
              </div>
              {!isTestUser && (
                <button onClick={() => setShowRecharge(!showRecharge)} className={`px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-yellow-500 hover:bg-yellow-400'} text-white`}>
                  充值
                </button>
              )}
              <button onClick={() => setShowSaved(!showSaved)} className={`px-3 py-2 rounded-lg text-sm transition ${showSaved ? theme.buttonBg + ' text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-green-900/50 text-green-300')}`}>
                {showSaved ? '📋 历史' : `⭐ 保存 (${savedList.length})`}
              </button>
              <button onClick={toggleDarkMode} className={`p-2 rounded-lg transition ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-green-900/50 text-green-300 hover:bg-green-800/50'}`}>
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${theme.avatar}`}>
                {session.user?.email?.charAt(0).toUpperCase()}
              </div>
              <button onClick={() => signOut()} className={`px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-green-900/50 hover:bg-green-800/50 text-green-300'}`}>
                退出
              </button>
            </div>
          </div>
        </header>

        {showRecharge && !isTestUser && (
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className={`${theme.card} border rounded-xl p-6`}>
              <h3 className={`text-lg font-bold ${theme.text} mb-4`}>💳 充值积分</h3>
              <div className="grid grid-cols-3 gap-4">
                <button onClick={recharge} className={`p-4 rounded-xl border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-green-700 hover:bg-green-900/30'} ${theme.text} transition`}>
                  <div className="text-2xl font-bold mb-1">1000</div>
                  <div className="text-sm text-green-400">积分</div>
                  <div className="text-xs text-gray-500 mt-1">¥7</div>
                </button>
              </div>
              <p className={`text-xs mt-4 ${theme.textMuted2}`}>* 1积分 = 1000字符，speech-2.6-hd 模型约 ¥0.7/千字符</p>
            </div>
          </div>
        )}

        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className={`${theme.card} backdrop-blur-sm border rounded-2xl p-6 mb-8`}>
            <h2 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center gap-2`}>
              <svg className={`w-5 h-5 ${theme.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              声音设置
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block ${theme.accent} text-sm mb-2`}>情感</label>
                <select value={emotion} onChange={(e) => setEmotion(e.target.value)} className={`w-full p-3 ${theme.select} rounded-xl focus:outline-none ${darkMode ? 'focus:border-gray-500' : 'focus:border-green-500'}`}>
                  {EMOTIONS.map(e => (<option key={e.id} value={e.id} className={theme.selectOption}>{e.name}</option>))}
                </select>
              </div>
              <div>
                <label className={`block ${theme.accent} text-sm mb-2`}>语速</label>
                <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className={`w-full p-3 ${theme.select} rounded-xl focus:outline-none ${darkMode ? 'focus:border-gray-500' : 'focus:border-green-500'}`}>
                  {SPEEDS.map(s => (<option key={s.id} value={s.id} className={theme.selectOption}>{s.name}</option>))}
                </select>
              </div>
            </div>
          </div>

          <div className={`${theme.card} backdrop-blur-sm border rounded-2xl p-6 mb-8`}>
            <h2 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center gap-2`}>
              <span className={`w-2 h-2 ${theme.dot} rounded-full animate-pulse`}></span>
              {showSaved ? '已保存的音频 (24小时内)' : '生成语音'}
            </h2>
            {!showSaved && (
              <>
                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="输入要转换的文字..." className={`w-full h-40 p-4 ${theme.input} rounded-xl focus:outline-none transition resize-none`} />
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-4">
                    <span className={`${darkMode ? 'text-gray-500' : 'text-green-600'} text-sm`}>{charCount} / 1000 字符</span>
                    {charCount > 0 && (
                      <span className={`${darkMode ? 'text-gray-500' : 'text-green-600'} text-sm`}>
                        💰 消耗: {costCredits}积分 ≈ ¥{costCNY.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <button onClick={generateAudio} disabled={loading || !text.trim()} className={`px-8 py-3 bg-gradient-to-r ${theme.buttonBg} text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg`}>
                    {loading ? (<><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>生成中...</>) : (<><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>生成音频</>)}
                  </button>
                </div>
                <div className={`mt-3 text-xs ${darkMode ? 'text-gray-500' : 'text-green-700/70'}`}>
                  📊 计费: speech-2.6-hd = $0.1/千字符 (约¥0.7) | 1积分 = 1000字符
                </div>
              </>
            )}
            {audioUrl && !showSaved && (
              <div className={`mt-6 p-4 ${theme.card} rounded-xl`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`${theme.textMuted} text-sm`}>最新生成</span>
                  <div className="flex gap-2">
                    <button onClick={() => saveAudio({id: Date.now().toString(), text, url: audioUrl, time: new Date().toISOString()})} className={`text-sm flex items-center gap-1 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-green-400 hover:text-green-300'}`}>
                      ⭐ 保存
                    </button>
                    <a href={audioUrl} download="audio.mp3" className={`text-sm flex items-center gap-1 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-green-400 hover:text-green-300'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>下载
                    </a>
                  </div>
                </div>
                <audio controls src={audioUrl} className="w-full h-12" />
              </div>
            )}
          </div>

          {displayList.length > 0 && (
            <div className={`${theme.card} backdrop-blur-sm border rounded-2xl p-6`}>
              <h3 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center gap-2`}>
                <svg className={`w-5 h-5 ${theme.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {showSaved ? '已保存' : '历史记录'}
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {displayList.map((item) => (
                  <div key={item.id} className={`flex items-center gap-4 p-4 rounded-xl ${darkMode ? 'bg-gray-900/30' : 'bg-black/20'}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${theme.text}`}>{item.text}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-green-600'}`}>{new Date(item.time).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      {showSaved && (
                        <button onClick={() => deleteSaved(item.id)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-black/30 text-green-600'}`}>
                          🗑️
                        </button>
                      )}
                      {!item.saved && !showSaved && (
                        <button onClick={() => saveAudio(item)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-black/30 text-green-600'}`}>
                          ⭐
                        </button>
                      )}
                      <audio controls src={item.url} className="h-10 w-40" />
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
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 bg-gradient-to-r ${IconBg} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl`}>
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </div>
          <h1 className={`text-4xl font-bold ${theme.text} mb-2`}>MiniMax TTS</h1>
          <p className={theme.textMuted2}>极速调用你的克隆声音</p>
        </div>
        <div className={`${theme.card} backdrop-blur-sm border rounded-2xl p-8 shadow-2xl`}>
          <h2 className={`text-xl font-semibold ${theme.text} text-center mb-6`}>登录体验</h2>
          <button onClick={() => signIn()} className={`w-full py-4 bg-gradient-to-r ${theme.buttonBg} text-white rounded-xl font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>立即体验
          </button>
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><div className="text-2xl mb-1">🎙️</div><p className={darkMode ? 'text-gray-500' : 'text-green-500'} text-xs>克隆声音</p></div>
              <div><div className="text-2xl mb-1">⚡</div><p className={darkMode ? 'text-gray-500' : 'text-green-500'} text-xs>极速生成</p></div>
              <div><div className="text-2xl mb-1">💰</div><p className={darkMode ? 'text-gray-500' : 'text-green-500'} text-xs>积分消耗</p></div>
            </div>
          </div>
        </div>
     积分: {isTestUser ? '无限' : credits}</div>
    </div>
  )
}
