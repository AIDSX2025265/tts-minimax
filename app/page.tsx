'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

const MALE_VOICES = [
  { id: 'achuan_voice_003', name: '温暖男声', preview: '/previews/achuan_voice_003.mp3' },
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
  const [voice, setVoice] = useState('achuan_voice_003')
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
        className={`group relative px-4 py-3 rounded-lg border text-left transition-all ${
          selected
            ? 'border-[#c96442] bg-[#f4e4d9] text-[#1f1e1d]'
            : 'border-[#e7e2d6] bg-white text-[#1f1e1d] hover:border-[#d6cfbf] hover:bg-[#faf6ee]'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-[15px]">{v.name}</span>
          {v.preview && (
            <span
              onClick={handlePreview}
              className={`text-xs px-2 py-1 rounded-md border cursor-pointer ${
                isPlaying
                  ? 'border-[#c96442] bg-[#c96442] text-white'
                  : 'border-[#e7e2d6] text-[#6b6862] hover:border-[#c96442] hover:text-[#c96442]'
              }`}
            >
              {isPlaying ? '⏸' : '▶'}
            </span>
          )}
        </div>
      </button>
    )
  }

  if (session) {
    return (
      <div className="min-h-screen bg-[#faf9f5] text-[#1f1e1d]">
        <header className="border-b border-[#e7e2d6] bg-[#faf9f5]/90 backdrop-blur sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[#c96442] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div className="font-serif-display text-[19px] font-medium tracking-tight">
                大师兄的<span className="text-[#c96442]">AI配音坊</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-full border border-[#e7e2d6] bg-white text-sm text-[#1f1e1d]">
                <span className="text-[#c96442] mr-1">●</span>
                {isTestUser ? '∞ 无限' : credits} 积分
              </div>
              <button
                onClick={() => setShowSaved(!showSaved)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  showSaved
                    ? 'border-[#c96442] bg-[#f4e4d9] text-[#c96442]'
                    : 'border-[#e7e2d6] bg-white text-[#1f1e1d] hover:border-[#d6cfbf]'
                }`}
              >
                {showSaved ? '历史' : `已保存 ${savedList.length}`}
              </button>
              <div className="w-8 h-8 rounded-full bg-[#1f1e1d] flex items-center justify-center text-white text-xs font-medium">
                {session.user?.email?.charAt(0).toUpperCase()}
              </div>
              <button onClick={() => signIn()} className="px-3 py-1.5 rounded-full text-sm text-[#6b6862] hover:text-[#1f1e1d]">切换</button>
              <button onClick={() => signOut()} className="px-3 py-1.5 rounded-full text-sm text-[#6b6862] hover:text-[#c96442]">退出</button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-10">
          <h1 className="font-serif-display text-3xl md:text-4xl font-medium tracking-tight mb-2">
            把文字变成你想要的声音
          </h1>
          <p className="text-[#6b6862] mb-8">选择音色、输入文字，几秒生成自然语音。</p>

          {/* 音色选择 */}
          <section className="bg-white rounded-2xl border border-[#e7e2d6] p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif-display text-lg font-medium">选择音色</h2>
              <div className="inline-flex p-1 rounded-full bg-[#f3efe7] border border-[#e7e2d6]">
                <button
                  onClick={() => setVoiceType('female')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    voiceType === 'female' ? 'bg-white text-[#1f1e1d] shadow-sm' : 'text-[#6b6862] hover:text-[#1f1e1d]'
                  }`}
                >女声</button>
                <button
                  onClick={() => setVoiceType('male')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    voiceType === 'male' ? 'bg-white text-[#1f1e1d] shadow-sm' : 'text-[#6b6862] hover:text-[#1f1e1d]'
                  }`}
                >男声</button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currentVoices.map(v => (
                <VoiceCard key={v.id} v={v} selected={voice === v.id} />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#e7e2d6]">
              <div>
                <label className="block text-xs font-medium text-[#6b6862] mb-2">情感</label>
                <select
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#e7e2d6] rounded-lg text-[15px] text-[#1f1e1d] focus:border-[#c96442]"
                >
                  {EMOTIONS.map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b6862] mb-2">语速</label>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white border border-[#e7e2d6] rounded-lg text-[15px] text-[#1f1e1d] focus:border-[#c96442]"
                >
                  {SPEEDS.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
            </div>
          </section>

          {/* 输入区 */}
          <section className="bg-white rounded-2xl border border-[#e7e2d6] p-6 mb-6">
            <h2 className="font-serif-display text-lg font-medium mb-4">{showSaved ? '已保存的音频' : '输入文字'}</h2>

            {!showSaved && (
              <>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="在这里输入要转换为语音的文字…"
                  className="w-full h-44 p-4 bg-[#faf9f5] border border-[#e7e2d6] rounded-lg text-[15px] text-[#1f1e1d] placeholder-[#a8a298] resize-none focus:border-[#c96442] leading-relaxed"
                />
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-4 text-sm text-[#6b6862]">
                    <span>{charCount} 字符</span>
                    {charCount > 0 && (
                      <span className="text-[#c96442]">需 {costCredits} 积分</span>
                    )}
                  </div>
                  <button
                    onClick={generateAudio}
                    disabled={loading || !text.trim()}
                    className="px-6 py-2.5 bg-[#c96442] text-white rounded-full font-medium text-[15px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#b3563a]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        生成中
                      </span>
                    ) : '生成音频'}
                  </button>
                </div>
              </>
            )}

            {audioUrl && !showSaved && (
              <div className="mt-6 p-4 bg-[#faf9f5] rounded-lg border border-[#e7e2d6]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#1f1e1d]">最新生成</span>
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => saveAudio({id: Date.now().toString(), text, url: audioUrl, time: new Date().toISOString()})} className="text-[#6b6862] hover:text-[#c96442]">保存</button>
                    <a href={audioUrl} download="audio.mp3" className="text-[#6b6862] hover:text-[#c96442]">下载</a>
                  </div>
                </div>
                <audio controls src={audioUrl} className="w-full h-10" />
              </div>
            )}
          </section>

          {/* 历史 / 已保存 */}
          {displayList.length > 0 && (
            <section className="bg-white rounded-2xl border border-[#e7e2d6] p-6">
              <h3 className="font-serif-display text-lg font-medium mb-4">{showSaved ? '已保存' : '本次会话历史'}</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {displayList.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-[#faf9f5] rounded-lg border border-[#e7e2d6] hover:border-[#d6cfbf]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1f1e1d] truncate">{item.text}</p>
                      <p className="text-xs text-[#a8a298] mt-1">{new Date(item.time).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {showSaved && (
                        <button onClick={() => deleteSaved(item.id)} className="px-2 py-1 text-xs text-[#6b6862] hover:text-[#c96442]">删除</button>
                      )}
                      {!item.saved && !showSaved && (
                        <button onClick={() => saveAudio(item)} className="px-2 py-1 text-xs text-[#6b6862] hover:text-[#c96442]">保存</button>
                      )}
                      <audio controls src={item.url} className="h-8 w-44" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <footer className="text-center text-xs text-[#a8a298] mt-12 pb-6">
            大师兄的 AI 配音坊 · 1 字 1 积分
          </footer>
        </main>
      </div>
    )
  }

  // 未登录页
  return (
    <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-xl bg-[#c96442] flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="font-serif-display text-4xl font-medium tracking-tight mb-3 text-[#1f1e1d]">
            大师兄的<span className="text-[#c96442]">AI配音坊</span>
          </h1>
          <p className="text-[#6b6862]">极速调用你的克隆声音</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e7e2d6] p-8">
          <button
            onClick={() => signIn()}
            className="w-full py-3 bg-[#c96442] text-white rounded-full font-medium text-[15px] hover:bg-[#b3563a]"
          >
            立即登录使用
          </button>

          <div className="mt-8 pt-6 border-t border-[#e7e2d6]">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-serif-display text-xl text-[#1f1e1d]">9</p>
                <p className="text-xs text-[#6b6862] mt-1">种音色</p>
              </div>
              <div>
                <p className="font-serif-display text-xl text-[#1f1e1d]">秒级</p>
                <p className="text-xs text-[#6b6862] mt-1">生成速度</p>
              </div>
              <div>
                <p className="font-serif-display text-xl text-[#1f1e1d]">1:1</p>
                <p className="text-xs text-[#6b6862] mt-1">字符积分</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[#a8a298] mt-8">
          基于 MiniMax speech-2.6-hd 引擎
        </p>
      </div>
    </div>
  )
}
