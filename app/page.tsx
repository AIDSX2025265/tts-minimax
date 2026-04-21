'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

const MALE_VOICES = [
  { id: 'yansangdage002', name: '烟嗓大哥' },
  { id: 'ywyj_001', name: '一网一家' },
  { id: 'dcnzy_003', name: '低沉男中' },
  { id: 'ysqn_002', name: '烟嗓青年' },
]

const FEMALE_VOICES = [
  { id: 'keainvsheng001', name: '可爱女声' },
  { id: 'nengliangnvzhu006', name: '能量女主' },
  { id: 'yqnzj_002', name: '元气女2' },
  { id: 'ysnlb_002', name: '烟嗓女老板' },
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
  const [voice, setVoice] = useState('keainvsheng001')
  const [voiceType, setVoiceType] = useState<'male' | 'female'>('female')
  const [speed, setSpeed] = useState(1)
  const [credits, setCredits] = useState(0)

  const charCount = text.length
  const costCredits = charCount

  useEffect(() => {
    const savedAudios = localStorage.getItem('savedAudios')
    if (savedAudios) {
      const parsed = JSON.parse(savedAudios) as AudioItem[]
      const now = Date.now()
      const filtered = parsed.filter(item => now - new Date(item.time).getTime() < 24 * 60 * 60 * 1000)
      setSavedList(filtered)
      localStorage.setItem('savedAudios', JSON.stringify(filtered))
    }
  }, [])

  useEffect(() => {
    if (session?.user?.email) {
      fetchCredits(session.user.email)
    }
  }, [session])

  useEffect(() => {
    // 切换音色类型时自动选择第一个
    if (voiceType === 'male' && MALE_VOICES.length > 0) {
      setVoice(MALE_VOICES[0].id)
    } else if (voiceType === 'female' && FEMALE_VOICES.length > 0) {
      setVoice(FEMALE_VOICES[0].id)
    }
  }, [voiceType])

  const fetchCredits = async (email: string): Promise<number> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getCredits', email })
      })
      const data = await res.json()
      if (data.credits !== undefined) {
        setCredits(data.credits)
        return data.credits
      }
    } catch (e) {
      console.error('Failed to fetch credits', e)
    }
    return 0
  }

  const generateAudio = async () => {
    if (!text.trim()) return
    const isTest = session?.user?.email === 'test@example.com'

    setLoading(true)
    try {
      if (!isTest) {
        const latestCredits = await fetchCredits(session!.user!.email!)
        if (costCredits > latestCredits) {
          alert('积分不足！请联系管理员充值')
          setLoading(false)
          return
        }

        const deductRes = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'deductCredits', email: session!.user!.email, credits: costCredits })
        })
        const deductData = await deductRes.json()
        if (!deductData.success) {
          alert(deductData.error || '积分扣除失败')
          setLoading(false)
          return
        }
        setCredits(deductData.credits)
      }

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, emotion, speed })
      })
      const data = await res.json()

      if (data.audio_url) {
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
        if (!isTest) {
          await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'addCredits', email: session!.user!.email, credits: costCredits })
          })
          setCredits(prev => prev + costCredits)
        }
        alert(data.error || '生成失败')
      }
    } catch (e) {
      if (!isTest) {
        await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'addCredits', email: session!.user!.email, credits: costCredits })
        })
        setCredits(prev => prev + costCredits)
      }
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

  const currentVoices = voiceType === 'male' ? MALE_VOICES : FEMALE_VOICES
  const displayList = showSaved ? savedList : history
  const isTestUser = session?.user?.email === 'test@example.com'

  const VoiceCard = ({ v, selected }: { v: { id: string, name: string }, selected: boolean }) => (
    <button
      onClick={() => setVoice(v.id)}
      className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
        selected
          ? 'border-[#ff6b35] bg-[#ff6b35]/20 text-[#ff6b35] shadow-[0_0_20px_rgba(255,107,53,0.5)]'
          : 'border-[#2a2a3e] bg-[#1a1a2e]/50 text-gray-400 hover:border-[#ff6b35]/50 hover:text-[#ff6b35]/80'
      }`}
      style={{
        textShadow: selected ? '0 0 10px rgba(255,107,53,0.8)' : 'none'
      }}
    >
      {v.name}
      {selected && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#ff6b35] rounded-full animate-pulse shadow-[0_0_10px_#ff6b35]"></span>
      )}
    </button>
  )

  if (session) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
        {/* 背景网格 */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,107,53,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,53,0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>

        {/* 顶部装饰线 */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff6b35] to-transparent"></div>
        <div className="absolute top-0 left-0 w-32 h-[2px] bg-[#ff6b35] shadow-[0_0_20px_#ff6b35]"></div>
        <div className="absolute top-0 right-0 w-32 h-[2px] bg-[#ff6b35] shadow-[0_0_20px_#ff6b35]"></div>

        <header className="relative border-b border-[#2a2a3e] bg-[#0a0a0f]/90 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-[#ff6b35] to-[#ff4500] rounded-lg flex items-center justify-center shadow-[0_0_30px_rgba(255,107,53,0.5)]">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-[#ff6b35] rounded-lg blur-lg opacity-50"></div>
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-wider">大师兄的</span>
                <span className="text-xl font-bold text-[#ff6b35] tracking-wider" style={{ textShadow: '0 0 20px rgba(255,107,53,0.8)' }}>AI配音坊</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-1.5 rounded-full border border-[#ff6b35]/50 bg-[#ff6b35]/10">
                <span className="text-sm text-[#ff6b35]" style={{ textShadow: '0 0 10px rgba(255,107,53,0.5)' }}>
                  {isTestUser ? '∞ 无限' : credits} 积分
                </span>
              </div>
              <button
                onClick={() => setShowSaved(!showSaved)}
                className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                  showSaved
                    ? 'bg-[#ff6b35] text-white shadow-[0_0_20px_rgba(255,107,53,0.5)]'
                    : 'bg-[#1a1a2e] text-gray-400 border border-[#2a2a3e]'
                }`}
              >
                {showSaved ? '📋 历史' : `⭐ ${savedList.length}`}
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#ff6b35] to-[#ff4500] flex items-center justify-center text-white text-sm font-bold shadow-[0_0_15px_rgba(255,107,53,0.5)]">
                {session.user?.email?.charAt(0).toUpperCase()}
              </div>
              <button onClick={() => signIn()} className="px-3 py-1.5 rounded-full text-sm bg-[#1a1a2e] text-gray-400 border border-[#2a2a3e] hover:border-[#ff6b35]/50">切换</button>
              <button onClick={() => signOut()} className="px-3 py-1.5 rounded-full text-sm bg-[#1a1a2e] text-gray-400 border border-[#2a2a3e] hover:border-[#ff6b35]/50">退出</button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8 relative">

          {/* 音色选择区域 */}
          <div className="bg-[#1a1a2e]/80 rounded-2xl border border-[#2a2a3e] p-6 mb-6 backdrop-blur-sm">
            <h2 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ff6b35] rounded-full animate-pulse shadow-[0_0_10px_#ff6b35]"></span>
              选择音色
            </h2>

            {/* 性别切换 */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setVoiceType('female')}
                className={`px-6 py-2 rounded-xl transition-all ${
                  voiceType === 'female'
                    ? 'bg-gradient-to-r from-[#ff6b35] to-[#ff4500] text-white font-bold shadow-[0_0_25px_rgba(255,107,53,0.5)]'
                    : 'bg-[#0a0a0f] text-gray-500 border border-[#2a2a3e] hover:border-[#ff6b35]/50'
                }`}
              >
                女声
              </button>
              <button
                onClick={() => setVoiceType('male')}
                className={`px-6 py-2 rounded-xl transition-all ${
                  voiceType === 'male'
                    ? 'bg-gradient-to-r from-[#ff6b35] to-[#ff4500] text-white font-bold shadow-[0_0_25px_rgba(255,107,53,0.5)]'
                    : 'bg-[#0a0a0f] text-gray-500 border border-[#2a2a3e] hover:border-[#ff6b35]/50'
                }`}
              >
                男声
              </button>
            </div>

            {/* 音色卡片 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currentVoices.map(v => (
                <VoiceCard key={v.id} v={v} selected={voice === v.id} />
              ))}
            </div>

            {/* 情感和语速 */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#2a2a3e]">
              <div>
                <label className="block text-xs text-gray-500 mb-2">情感</label>
                <select
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value)}
                  className="w-full p-3 bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl text-gray-300 focus:border-[#ff6b35] focus:outline-none transition-colors"
                >
                  {EMOTIONS.map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">语速</label>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full p-3 bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl text-gray-300 focus:border-[#ff6b35] focus:outline-none transition-colors"
                >
                  {SPEEDS.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
            </div>
          </div>

          {/* 输入和生成区域 */}
          <div className="bg-[#1a1a2e]/80 rounded-2xl border border-[#2a2a3e] p-6 mb-6 backdrop-blur-sm">
            <h2 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ff6b35] rounded-full animate-pulse shadow-[0_0_10px_#ff6b35]"></span>
              {showSaved ? '已保存的音频' : '生成语音'}
            </h2>

            {!showSaved && (
              <>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="输入要转换的文字..."
                  className="w-full h-40 p-4 bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl text-gray-200 placeholder-gray-600 resize-none focus:border-[#ff6b35] focus:outline-none transition-colors"
                />
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{charCount} 字符</span>
                    {charCount > 0 && (
                      <span className="text-sm text-[#ff6b35]" style={{ textShadow: '0 0 10px rgba(255,107,53,0.5)' }}>
                        💰 {costCredits} 积分
                      </span>
                    )}
                  </div>
                  <button
                    onClick={generateAudio}
                    disabled={loading || !text.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-[#ff6b35] to-[#ff4500] text-white rounded-xl font-bold disabled:opacity-50 transition-all hover:shadow-[0_0_30px_rgba(255,107,53,0.6)] hover:scale-105 disabled:hover:scale-100"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        生成中...
                      </span>
                    ) : '⚡ 生成音频'}
                  </button>
                </div>
              </>
            )}

            {audioUrl && !showSaved && (
              <div className="mt-6 p-4 bg-[#0a0a0f] rounded-xl border border-[#2a2a3e]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[#ff6b35]">最新生成</span>
                  <div className="flex gap-3">
                    <button onClick={() => saveAudio({id: Date.now().toString(), text, url: audioUrl, time: new Date().toISOString()})} className="text-sm text-[#ff6b35] hover:text-white transition-colors">⭐ 保存</button>
                    <a href={audioUrl} download="audio.mp3" className="text-sm text-[#ff6b35] hover:text-white transition-colors">📥 下载</a>
                  </div>
                </div>
                <audio controls src={audioUrl} className="w-full h-10" />
              </div>
            )}
          </div>

          {/* 历史记录 */}
          {displayList.length > 0 && (
            <div className="bg-[#1a1a2e]/80 rounded-2xl border border-[#2a2a3e] p-6 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-4">{showSaved ? '已保存' : '历史记录'}</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {displayList.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-[#0a0a0f] rounded-xl border border-[#2a2a3e] hover:border-[#ff6b35]/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 truncate">{item.text}</p>
                      <p className="text-xs text-gray-600">{new Date(item.time).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      {showSaved && (
                        <button onClick={() => deleteSaved(item.id)} className="p-2 text-gray-500 hover:text-[#ff6b35] transition-colors">🗑️</button>
                      )}
                      {!item.saved && !showSaved && (
                        <button onClick={() => saveAudio(item)} className="p-2 text-gray-500 hover:text-[#ff6b35] transition-colors">⭐</button>
                      )}
                      <audio controls src={item.url} className="h-8 w-36" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* 底部装饰 */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff6b35] to-transparent"></div>
      </div>
    )
  }

  // 未登录页面
  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden flex items-center justify-center p-6">
      {/* 背景网格 */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,107,53,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,53,0.3) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>

      {/* 装饰元素 */}
      <div className="absolute top-1/4 left-10 w-32 h-[2px] bg-gradient-to-r from-[#ff6b35] to-transparent opacity-50"></div>
      <div className="absolute top-1/3 right-20 w-48 h-[2px] bg-gradient-to-l from-[#ff4500] to-transparent opacity-30"></div>
      <div className="absolute bottom-1/4 right-10 w-32 h-[2px] bg-gradient-to-l from-[#ff6b35] to-transparent opacity-50"></div>

      <div className="max-w-sm w-full relative">
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-r from-[#ff6b35] to-[#ff4500] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_60px_rgba(255,107,53,0.6)]">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="absolute inset-0 bg-[#ff6b35] rounded-2xl blur-2xl opacity-50"></div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-wider">
            大师兄的<span className="text-[#ff6b35]" style={{ textShadow: '0 0 30px rgba(255,107,53,0.8)' }}>AI配音坊</span>
          </h1>
          <p className="text-gray-500">极速调用你的克隆声音</p>
        </div>

        <div className="bg-[#1a1a2e]/80 rounded-2xl border border-[#2a2a3e] p-8 backdrop-blur-sm">
          <button
            onClick={() => signIn()}
            className="w-full py-4 bg-gradient-to-r from-[#ff6b35] to-[#ff4500] text-white rounded-xl font-bold text-lg transition-all hover:shadow-[0_0_40px_rgba(255,107,53,0.6)] hover:scale-105"
          >
            立即体验 ⚡
          </button>

          <div className="mt-6 pt-6 border-t border-[#2a2a3e]">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl mb-1">🎤</div>
                <p className="text-gray-500 text-xs">8种音色</p>
              </div>
              <div>
                <div className="text-2xl mb-1">⚡</div>
                <p className="text-gray-500 text-xs">极速生成</p>
              </div>
              <div>
                <div className="text-2xl mb-1">🔥</div>
                <p className="text-gray-500 text-xs">1字1积分</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff6b35] to-transparent"></div>
    </div>
  )
}
