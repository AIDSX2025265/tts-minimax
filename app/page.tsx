'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState } from 'react'

const VOICES = [
  { id: 'achuan_voice_003', name: '克隆声音' },
  { id: 'male-qn-qingse', name: '青涩青年' },
  { id: 'male-qn-jingying', name: '精英青年' },
  { id: 'male-qn-badao', name: '霸道总裁' },
  { id: 'female-shaonv', name: '活泼少女' },
  { id: 'female-yujie', name: '温柔御姐' },
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

export default function Home() {
  const { data: session } = useSession()
  const [text, setText] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<{text: string, url: string, time: string, voice: string}[]>([])
  const [voice, setVoice] = useState('achuan_voice_003')
  const [emotion, setEmotion] = useState('')
  const [speed, setSpeed] = useState(1)

  const generateAudio = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, emotion, speed })
      })
      const data = await res.json()
      if (data.audio_url) {
        setAudioUrl(data.audio_url)
        const voiceName = VOICES.find(v => v.id === voice)?.name || voice
        setHistory([{text, url: data.audio_url, time: new Date().toLocaleTimeString(), voice: voiceName}, ...history])
      } else {
        alert(data.error || '生成失败')
      }
    } catch (e) {
      alert('生成失败')
    }
    setLoading(false)
  }

  if (session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-teal-50">
        <header className="border-b border-green-200/50 backdrop-blur-md bg-white/60">
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-green-800">MiniMax TTS</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-green-700">
                <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center text-white text-sm">
                  {session.user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm hidden sm:inline">{session.user?.email}</span>
              </div>
              <button onClick={() => signOut()} className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm transition">
                退出
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white/70 backdrop-blur-sm border border-green-200 rounded-2xl p-6 mb-8 shadow-lg">
            <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              声音设置
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-green-600 text-sm mb-2">音色</label>
                <select value={voice} onChange={(e) => setVoice(e.target.value)} className="w-full p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 focus:outline-none focus:border-green-400">
                  {VOICES.map(v => (<option key={v.id} value={v.id} className="bg-white">{v.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-green-600 text-sm mb-2">情感</label>
                <select value={emotion} onChange={(e) => setEmotion(e.target.value)} className="w-full p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 focus:outline-none focus:border-green-400">
                  {EMOTIONS.map(e => (<option key={e.id} value={e.id} className="bg-white">{e.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-green-600 text-sm mb-2">语速</label>
                <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 focus:outline-none focus:border-green-400">
                  {SPEEDS.map(s => (<option key={s.id} value={s.id} className="bg-white">{s.name}</option>))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-green-200 rounded-2xl p-6 mb-8 shadow-lg">
            <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              生成语音
            </h2>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="输入要转换的文字..." className="w-full h-40 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 placeholder-green-400 focus:outline-none focus:border-green-400 transition resize-none" />
            <div className="flex justify-between items-center mt-4">
              <span className="text-green-500 text-sm">{text.length} / 1000 字符</span>
              <button onClick={generateAudio} disabled={loading || !text.trim()} className="px-8 py-3 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2">
                {loading ? (<><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>生成中...</>) : (<><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>生成音频</>)}
              </button>
            </div>
            {audioUrl && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-green-700 text-sm">生成结果</span>
                  <a href={audioUrl} download="audio.mp3" className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>下载
                  </a>
                </div>
                <audio controls src={audioUrl} className="w-full h-12" />
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div className="bg-white/70 backdrop-blur-sm border border-green-200 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                历史记录
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {history.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition cursor-pointer" onClick={() => setAudioUrl(item.url)}>
                    <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center"><svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg></div>
                    <div className="flex-1 min-w-0"><p className="text-green-800 text-sm truncate">{item.text}</p><p className="text-green-500 text-xs">{item.time} · {item.voice}</p></div>
                    <audio controls src={item.url} className="h-8 w-32" onClick={(e) => e.stopPropagation()} />
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-teal-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-300/30">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </div>
          <h1 className="text-4xl font-bold text-green-800 mb-2">MiniMax TTS</h1>
          <p className="text-green-600">极速调用你的克隆声音</p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm border border-green-200 rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-semibold text-green-800 text-center mb-6">登录体验</h2>
          <button onClick={() => signIn()} className="w-full py-4 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white rounded-xl font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>立即体验
          </button>
          <div className="mt-6 pt-6 border-t border-green-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><div className="text-2xl mb-1">🎙️</div><p className="text-green-600 text-xs">克隆声音</p></div>
              <div><div className="text-2xl mb-1">⚡</div><p className="text-green-600 text-xs">极速生成</p></div>
              <div><div className="text-2xl mb-1">🔊</div><p className="text-green-600 text-xs">高清音质</p></div>
            </div>
          </div>
        </div>
        <p className="text-center text-green-500 text-sm mt-8">测试账号: test@example.com / password123</p>
      </div>
    </div>
  )
}
