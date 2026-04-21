'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

const MALE_VOICES = [
  { id: 'yansangdage002', name: '烟嗓大哥', preview: '/previews/yansangdage002.mp3' },
  { id: 'ywyj_001', name: '一网一家', preview: '/previews/ywyj_001.mp3' },
  { id: 'dcnzy_003', name: '低沉男中', preview: '/previews/dcnzy_003.mp3' },
  { id: 'ysqn_002', name: '烟嗓青年', preview: '/previews/ysqn_002.mp3' },
]

const FEMALE_VOICES = [
  { id: 'keainvsheng001', name: '可爱女声', preview: '/previews/keainvsheng001.mp3' },
  { id: 'nengliangnvzhu006', name: '能量女主', preview: '/previews/nengliangnvzhu006.mp3' },
  { id: 'yqnzj_002', name: '元气女2', preview: '/previews/yqnzj_002.mp3' },
  { id: 'ysnlb_002', name: '烟嗓女老板', preview: '/previews/ysnlb_002.mp3' },
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
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)

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

  const VoiceCard = ({ v, selected }: { v: { id: string, name: string, preview?: string }, selected: boolean }) => {
    const isPlaying = playingVoice === v.id

    const handlePreview = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isPlaying) {
        setPlayingVoice(null)
      } else if (v.preview) {
        setPlayingVoice(v.id)
        const audio = new Audio(v.preview)
        audio.onended = () => setPlayingVoice(null)
        audio.play()
      }
    }

    return (
      <button
        onClick={() => setVoice(v.id)}
        className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
          selected
            ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400 shadow-[0_0_25px_rgba(0,245,255,0.6)]'
            : 'border-purple-500/50 bg-purple-500/10 text-purple-300 hover:border-cyan-400/60 hover:text-cyan-400'
        }`}
        style={{
          textShadow: selected ? '0 0 15px rgba(0,245,255,0.8)' : 'none'
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{v.name}</span>
          {v.preview && (
            <span
              onClick={handlePreview}
              className={`text-sm px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                isPlaying
                  ? 'border-pink-400 bg-pink-400 text-white shadow-[0_0_10px_#ff00ff]'
                  : 'border-cyan-400/50 text-cyan-400/70 hover:border-cyan-400 hover:text-cyan-400 hover:shadow-[0_0_10px_rgba(0,245,255,0.5)]'
              }`}
            >
              {isPlaying ? '⏸' : '▶'}
            </span>
          )}
        </div>
        {selected && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_15px_#00f5ff]"></span>
        )}
      </button>
    )
  }

  if (session) {
    return (
      <div className="min-h-screen bg-[#050510] relative overflow-hidden">
        {/* 背景网格 - 赛博朋克网格线 */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `
            linear-gradient(rgba(0,245,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,245,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>

        {/* 扫描线效果 */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,245,255,0.03) 2px, rgba(0,245,255,0.03) 4px)'
        }}></div>

        {/* 渐变遮罩 */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-pink-500/10 via-transparent to-transparent"></div>

        {/* 顶部霓虹装饰线 */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-pink-500 via-cyan-400 to-purple-500 shadow-[0_0_30px_rgba(0,245,255,0.8)]"></div>
        <div className="absolute top-0 left-0 w-48 h-[3px] bg-cyan-400 shadow-[0_0_20px_#00f5ff]"></div>
        <div className="absolute top-0 right-0 w-48 h-[3px] bg-pink-500 shadow-[0_0_20px_#ff00ff]"></div>

        <header className="relative border-b border-purple-500/30 bg-[#0a0515]/95 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_40px_rgba(0,245,255,0.6)] animate-pulse">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-pink-500 rounded-xl blur-xl opacity-70 animate-pulse"></div>
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-wider">大师兄的</span>
                <span className="text-xl font-black text-cyan-400 tracking-wider" style={{ textShadow: '0 0 25px rgba(0,245,255,1)' }}>AI配音坊</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-full border-2 border-cyan-400/60 bg-gradient-to-r from-cyan-400/20 to-purple-500/20 shadow-[0_0_20px_rgba(0,245,255,0.3)] backdrop-blur-sm">
                <span className="text-sm font-bold text-cyan-400" style={{ textShadow: '0 0 15px rgba(0,245,255,0.8)' }}>
                  💎 {isTestUser ? '∞ 无限' : credits} 积分
                </span>
              </div>
              <button
                onClick={() => setShowSaved(!showSaved)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  showSaved
                    ? 'bg-gradient-to-r from-pink-500 to-cyan-400 text-white shadow-[0_0_25px_rgba(0,245,255,0.6)]'
                    : 'bg-purple-500/30 text-purple-300 border border-purple-500/50 hover:border-pink-400/70 hover:text-pink-400'
                }`}
              >
                {showSaved ? '📋 历史' : `⭐ ${savedList.length}`}
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 flex items-center justify-center text-white text-sm font-black shadow-[0_0_20px_rgba(0,245,255,0.5)] border-2 border-cyan-400/50">
                {session.user?.email?.charAt(0).toUpperCase()}
              </div>
              <button onClick={() => signIn()} className="px-3 py-2 rounded-full text-sm bg-purple-500/30 text-purple-300 border border-purple-500/50 hover:border-cyan-400/50 hover:text-cyan-400">切换</button>
              <button onClick={() => signOut()} className="px-3 py-2 rounded-full text-sm bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/40">退出</button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8 relative">

          {/* 音色选择区域 */}
          <div className="bg-gradient-to-br from-[#0a0520]/90 via-[#150a30]/90 to-[#0a0520]/90 rounded-2xl border-2 border-purple-500/40 p-6 mb-6 backdrop-blur-md shadow-[0_0_50px_rgba(138,43,226,0.2)]">
            <h2 className="text-sm font-bold text-cyan-400 mb-4 flex items-center gap-3 tracking-wider">
              <span className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_15px_#00f5ff]"></span>
              <span className="text-shadow-[0_0_10px_rgba(0,245,255,0.8)]">选择音色</span>
            </h2>

            {/* 性别切换 */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setVoiceType('female')}
                className={`px-8 py-3 rounded-xl font-black transition-all ${
                  voiceType === 'female'
                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 text-white shadow-[0_0_35px_rgba(0,245,255,0.7)] border-2 border-cyan-400'
                    : 'bg-[#0a0520] text-purple-400 border-2 border-purple-500/50 hover:border-pink-400/60 hover:text-pink-400'
                }`}
              >
                ♀ 女声
              </button>
              <button
                onClick={() => setVoiceType('male')}
                className={`px-8 py-3 rounded-xl font-black transition-all ${
                  voiceType === 'male'
                    ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white shadow-[0_0_35px_rgba(0,245,255,0.7)] border-2 border-cyan-400'
                    : 'bg-[#0a0520] text-purple-400 border-2 border-purple-500/50 hover:border-cyan-400/60 hover:text-cyan-400'
                }`}
              >
                ♂ 男声
              </button>
            </div>

            {/* 音色卡片 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {currentVoices.map(v => (
                <VoiceCard key={v.id} v={v} selected={voice === v.id} />
              ))}
            </div>

            {/* 情感和语速 */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t-2 border-purple-500/40">
              <div>
                <label className="block text-xs font-bold text-pink-400 mb-2 tracking-wider">🎭 情感</label>
                <select
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value)}
                  className="w-full p-4 bg-gradient-to-r from-[#0a0520] to-[#150a30] border-2 border-purple-500/50 rounded-xl text-cyan-300 font-medium focus:border-cyan-400 focus:outline-none transition-all shadow-[0_0_15px_rgba(138,43,226,0.3)]"
                >
                  {EMOTIONS.map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-pink-400 mb-2 tracking-wider">⚡ 语速</label>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full p-4 bg-gradient-to-r from-[#0a0520] to-[#150a30] border-2 border-purple-500/50 rounded-xl text-cyan-300 font-medium focus:border-cyan-400 focus:outline-none transition-all shadow-[0_0_15px_rgba(138,43,226,0.3)]"
                >
                  {SPEEDS.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
            </div>
          </div>

          {/* 输入和生成区域 */}
          <div className="bg-gradient-to-br from-[#0a0520]/90 via-[#150a30]/90 to-[#0a0520]/90 rounded-2xl border-2 border-cyan-500/40 p-6 mb-6 backdrop-blur-md shadow-[0_0_50px_rgba(0,245,255,0.15)]">
            <h2 className="text-sm font-bold text-cyan-400 mb-4 flex items-center gap-3 tracking-wider">
              <span className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_15px_#00f5ff]"></span>
              <span>{showSaved ? '已保存的音频' : '生成语音'}</span>
            </h2>

            {!showSaved && (
              <>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="输入要转换的文字..."
                  className="w-full h-44 p-5 bg-gradient-to-br from-[#050515] to-[#0a0520] border-2 border-purple-500/40 rounded-xl text-cyan-100 placeholder-purple-400/50 resize-none focus:border-cyan-400 focus:outline-none transition-all font-medium tracking-wide"
                  style={{ boxShadow: 'inset 0 0 30px rgba(138,43,226,0.1)' }}
                />
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-5">
                    <span className="text-sm font-bold text-purple-400">{charCount} 字符</span>
                    {charCount > 0 && (
                      <span className="text-sm font-bold text-cyan-400 animate-pulse" style={{ textShadow: '0 0 15px rgba(0,245,255,0.8)' }}>
                        💎 {costCredits} 积分
                      </span>
                    )}
                  </div>
                  <button
                    onClick={generateAudio}
                    disabled={loading || !text.trim()}
                    className="px-10 py-4 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white rounded-xl font-black text-lg disabled:opacity-40 transition-all hover:shadow-[0_0_50px_rgba(0,245,255,0.8)] hover:scale-105 disabled:hover:scale-100 border-2 border-cyan-400/50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-3">
                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                          <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        生成中...
                      </span>
                    ) : '⚡ 生成音频'}
                  </button>
                </div>
              </>
            )}

            {audioUrl && !showSaved && (
              <div className="mt-6 p-5 bg-gradient-to-br from-[#050515] to-[#0a0520] rounded-xl border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(0,245,255,0.2)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-cyan-400 animate-pulse">✨ 最新生成</span>
                  <div className="flex gap-4">
                    <button onClick={() => saveAudio({id: Date.now().toString(), text, url: audioUrl, time: new Date().toISOString()})} className="text-sm font-bold text-pink-400 hover:text-cyan-400 transition-colors">⭐ 保存</button>
                    <a href={audioUrl} download="audio.mp3" className="text-sm font-bold text-cyan-400 hover:text-pink-400 transition-colors">📥 下载</a>
                  </div>
                </div>
                <audio controls src={audioUrl} className="w-full h-12 rounded-lg" style={{ filter: 'hue-rotate(180deg)' }} />
              </div>
            )}
          </div>

          {/* 历史记录 */}
          {displayList.length > 0 && (
            <div className="bg-gradient-to-br from-[#0a0520]/90 via-[#150a30]/90 to-[#0a0520]/90 rounded-2xl border-2 border-purple-500/40 p-6 backdrop-blur-md shadow-[0_0_50px_rgba(138,43,226,0.2)]">
              <h3 className="text-sm font-bold text-cyan-400 mb-4 tracking-wider">{showSaved ? '已保存' : '历史记录'}</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {displayList.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#050515] to-[#0a0520] rounded-xl border-2 border-purple-500/30 hover:border-cyan-400/50 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-cyan-200 truncate font-medium">{item.text}</p>
                      <p className="text-xs text-purple-400 mt-1">{new Date(item.time).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {showSaved && (
                        <button onClick={() => deleteSaved(item.id)} className="p-2 text-red-400/70 hover:text-red-400 transition-colors">🗑️</button>
                      )}
                      {!item.saved && !showSaved && (
                        <button onClick={() => saveAudio(item)} className="p-2 text-pink-400/70 hover:text-pink-400 transition-colors">⭐</button>
                      )}
                      <audio controls src={item.url} className="h-9 w-40 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* 底部装饰 */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-cyan-400 to-pink-500 shadow-[0_0_30px_rgba(0,245,255,0.8)]"></div>

        {/* 角落装饰 */}
        <div className="absolute bottom-8 left-8 w-32 h-1 bg-gradient-to-r from-cyan-400 to-transparent shadow-[0_0_15px_#00f5ff]"></div>
        <div className="absolute bottom-8 right-8 w-32 h-1 bg-gradient-to-l from-pink-500 to-transparent shadow-[0_0_15px_#ff00ff]"></div>
      </div>
    )
  }

  // 未登录页面
  return (
    <div className="min-h-screen bg-[#050510] relative overflow-hidden flex items-center justify-center p-6">
      {/* 背景网格 */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: `
          linear-gradient(rgba(0,245,255,0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,245,255,0.5) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}></div>

      {/* 扫描线 */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,245,255,0.03) 2px, rgba(0,245,255,0.03) 4px)'
      }}></div>

      {/* 装饰元素 */}
      <div className="absolute top-1/4 left-10 w-48 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent shadow-[0_0_20px_#00f5ff]"></div>
      <div className="absolute top-1/3 right-20 w-64 h-[2px] bg-gradient-to-l from-pink-500 to-transparent shadow-[0_0_20px_#ff00ff]"></div>
      <div className="absolute bottom-1/4 right-10 w-48 h-[2px] bg-gradient-to-l from-purple-500 to-transparent shadow-[0_0_20px_#8a2be2]"></div>

      <div className="max-w-sm w-full relative">
        <div className="text-center mb-10">
          <div className="relative inline-block">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-5 shadow-[0_0_80px_rgba(0,245,255,0.7)] animate-pulse">
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-pink-500 rounded-2xl blur-2xl opacity-60 animate-pulse"></div>
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-wider">
            大师兄的<span className="text-cyan-400" style={{ textShadow: '0 0 40px rgba(0,245,255,1)' }}>AI配音坊</span>
          </h1>
          <p className="text-purple-400 font-medium tracking-wider">极速调用你的克隆声音</p>
        </div>

        <div className="bg-gradient-to-br from-[#0a0520]/90 to-[#150a30]/90 rounded-2xl border-2 border-purple-500/50 p-8 backdrop-blur-md shadow-[0_0_60px_rgba(138,43,226,0.4)]">
          <button
            onClick={() => signIn()}
            className="w-full py-5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white rounded-xl font-black text-xl transition-all hover:shadow-[0_0_60px_rgba(0,245,255,0.8)] hover:scale-105 border-2 border-cyan-400/50"
          >
            立即体验 ⚡
          </button>

          <div className="mt-8 pt-6 border-t-2 border-purple-500/40">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl mb-2">🎤</div>
                <p className="text-cyan-400 text-xs font-bold tracking-wider">8种音色</p>
              </div>
              <div>
                <div className="text-3xl mb-2">⚡</div>
                <p className="text-cyan-400 text-xs font-bold tracking-wider">极速生成</p>
              </div>
              <div>
                <div className="text-3xl mb-2">🔥</div>
                <p className="text-cyan-400 text-xs font-bold tracking-wider">1字1积分</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-cyan-400 to-pink-500 shadow-[0_0_30px_rgba(0,245,255,0.8)]"></div>
    </div>
  )
}