'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function Redeem() {
  const { data: session } = useSession()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{success?: boolean, message?: string}>({})
  const router = useRouter()

  const redeem = async () => {
    if (!code.trim()) return
    if (!session) { alert('请先登录'); return }

    setLoading(true)
    setResult({})

    const codes = JSON.parse(localStorage.getItem('tts_redeem_codes') || '[]')
    const codeIndex = codes.findIndex((c: any) => c.code === code.toUpperCase())

    if (codeIndex < 0) { setResult({ success: false, message: '兑换码不存在' }); setLoading(false); return }
    if (codes[codeIndex].used) { setResult({ success: false, message: '兑换码已被使用' }); setLoading(false); return }

    codes[codeIndex].used = true
    codes[codeIndex].usedBy = session.user?.email
    localStorage.setItem('tts_redeem_codes', JSON.stringify(codes))

    const users = JSON.parse(localStorage.getItem('tts_users') || '[]')
    const userIndex = users.findIndex((u: any) => u.email === session.user?.email)
    if (userIndex >= 0) {
      users[userIndex].credits = (users[userIndex].credits || 0) + codes[codeIndex].credits
      localStorage.setItem('tts_users', JSON.stringify(users))
    }

    setResult({ success: true, message: `兑换成功！+${codes[codeIndex].credits} 积分` })
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center p-6 text-[#1f1e1d]">
      <div className="max-w-sm w-full">
        {/* Logo + 标题 */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-xl bg-[#c96442] flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-serif-display text-3xl font-medium tracking-tight mb-2">
            兑换 <span className="text-[#c96442]">积分</span>
          </h1>
          <p className="text-[#6b6862] text-sm">
            输入兑换码，立即增加积分
          </p>
        </div>

        {/* 表单卡片 */}
        <div className="bg-white rounded-2xl border border-[#e7e2d6] p-8">
          {/* 当前账号 */}
          {session?.user?.email && (
            <div className="mb-5 pb-5 border-b border-[#e7e2d6]">
              <p className="text-xs text-[#6b6862] mb-1">当前账号</p>
              <p className="text-sm text-[#1f1e1d] font-medium">{session.user.email}</p>
            </div>
          )}

          {/* 输入区 */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#6b6862] mb-2">兑换码</label>
              <input
                type="text"
                placeholder="请输入兑换码"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-[#faf9f5] border border-[#e7e2d6] rounded-lg text-[16px] text-[#1f1e1d] placeholder-[#a8a298] focus:border-[#c96442] focus:outline-none transition text-center font-mono tracking-wider"
                disabled={!session}
              />
            </div>

            <button
              onClick={redeem}
              disabled={loading || !session || !code.trim()}
              className="w-full py-3 bg-[#c96442] text-white rounded-full font-medium text-[15px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#b3563a] transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  兑换中…
                </span>
              ) : '立即兑换'}
            </button>
          </div>

          {/* 兑换结果 */}
          {result.message && (
            <div
              className={`mt-5 p-3 rounded-lg text-sm text-center border ${
                result.success
                  ? 'bg-[#f4e4d9] border-[#c96442]/40 text-[#c96442]'
                  : 'bg-[#faf6ee] border-[#e7e2d6] text-[#6b6862]'
              }`}
            >
              {result.success ? '✓ ' : '✗ '}{result.message}
            </div>
          )}

          {/* 未登录提示 */}
          {!session && (
            <div className="mt-5 pt-5 border-t border-[#e7e2d6] text-center">
              <p className="text-xs text-[#a8a298] mb-3">需要先登录才能兑换</p>
              <button
                onClick={() => signIn()}
                className="text-sm text-[#c96442] hover:text-[#b3563a] font-medium"
              >
                立即登录 →
              </button>
            </div>
          )}
        </div>

        {/* 返回首页 */}
        <button
          onClick={() => router.push('/')}
          className="w-full mt-4 py-2 text-xs text-[#a8a298] hover:text-[#6b6862] transition"
        >
          ← 返回首页
        </button>

        {/* 底部 footer */}
        <p className="text-center text-xs text-[#a8a298] mt-8">
          基于 MiniMax speech-2.6-hd 最新高清引擎
        </p>
      </div>
    </div>
  )
}
