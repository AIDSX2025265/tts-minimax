'use client'

import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function Redeem() {
  const { data: session } = useSession()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{success?: boolean, message?: string}>({})
  const router = useRouter()

  const redeem = async () => {
    if (!code.trim()) return
    if (!session) {
      alert('请先登录')
      return
    }

    setLoading(true)
    setResult({})

    const codes = JSON.parse(localStorage.getItem('tts_redeem_codes') || '[]')
    const codeIndex = codes.findIndex((c: any) => c.code === code.toUpperCase())

    if (codeIndex < 0) {
      setResult({ success: false, message: '兑换码不存在' })
      setLoading(false)
      return
    }

    if (codes[codeIndex].used) {
      setResult({ success: false, message: '兑换码已被使用' })
      setLoading(false)
      return
    }

    codes[codeIndex].used = true
    codes[codeIndex].usedBy = session.user?.email
    localStorage.setItem('tts_redeem_codes', JSON.stringify(codes))

    const users = JSON.parse(localStorage.getItem('tts_users') || '[]')
    const userIndex = users.findIndex((u: any) => u.email === session.user?.email)
    if (userIndex >= 0) {
      users[userIndex].credits = (users[userIndex].credits || 0) + codes[codeIndex].credits
      localStorage.setItem('tts_users', JSON.stringify(users))
    }

    setResult({ success: true, message: '兑换成功！+' + codes[codeIndex].credits + '积分' })
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-black/30 border border-green-800/30 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-2">兑换积分</h1>
          <p className="text-green-400 text-center mb-6">输入兑换码兑换积分</p>
          
          <input
            type="text"
            placeholder="请输入兑换码"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full p-4 bg-black/30 border border-green-700/30 rounded-xl text-white placeholder-green-600/50 focus:outline-none focus:border-green-500 mb-4 text-center text-lg font-mono"
          />

          <button 
            onClick={redeem} 
            disabled={loading || !session}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {loading ? '兑换中...' : '立即兑换'}
          </button>

          {result.message && (
            <div className={`mt-4 p-4 rounded-xl text-center ${result.success ? 'bg-green-600/20 border border-green-500 text-green-400' : 'bg-red-600/20 border border-red-500 text-red-400'}`}>
              {result.message}
            </div>
          )}

          {!session && (
            <p className="text-yellow-400 text-center mt-4 text-sm">请先登录后再兑换</p>
          )}

          <button onClick={() => router.push('/')} className="w-full mt-4 py-3 text-green-500 hover:text-green-400">
            返回首页
          </button>
        </div>
      </div>
    </div>
  )
}
