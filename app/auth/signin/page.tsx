'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isRegister) {
      if (password !== confirmPassword) { setError('两次密码输入不一致'); setLoading(false); return }
      if (password.length < 6) { setError('密码至少 6 位'); setLoading(false); return }

      // Register via cloud API
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', email, password })
      })
      const data = await res.json()

      if (data.error) { setError(data.error); setLoading(false); return }

      // Auto login after register
      const loginRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
      })
      const loginData = await loginRes.json()

      if (loginData.success) {
        localStorage.setItem('tts_email', email)
        router.push('/')
      } else { setError('注册成功，登录失败') }
    } else {
      // Login via NextAuth to create session
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // If NextAuth fails (e.g., missing env vars), fall back to cloud API
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', email, password })
        })
        const data = await res.json()

        if (data.success) {
          localStorage.setItem('tts_email', email)
          router.push('/')
        } else {
          setError(data.error || '登录失败')
        }
      } else {
        // NextAuth signIn succeeded
        localStorage.setItem('tts_email', email)
        router.push('/')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center p-6 text-[#1f1e1d]">
      <div className="max-w-sm w-full">
        {/* Logo + 标题 */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-xl bg-[#c96442] flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="font-serif-display text-3xl font-medium tracking-tight mb-2">
            {isRegister ? (
              <>创建你的 <span className="text-[#c96442]">配音坊</span> 账号</>
            ) : (
              <>欢迎回来，<span className="text-[#c96442]">大师兄配音坊</span></>
            )}
          </h1>
          <p className="text-[#6b6862] text-sm">
            {isRegister ? '使用 speech-2.6-hd 最新高清模型' : '登录账号继续使用'}
          </p>
        </div>

        {/* 表单卡片 */}
        <div className="bg-white rounded-2xl border border-[#e7e2d6] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#6b6862] mb-2">邮箱</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#faf9f5] border border-[#e7e2d6] rounded-lg text-[15px] text-[#1f1e1d] placeholder-[#a8a298] focus:border-[#c96442] focus:outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b6862] mb-2">密码</label>
              <input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#faf9f5] border border-[#e7e2d6] rounded-lg text-[15px] text-[#1f1e1d] placeholder-[#a8a298] focus:border-[#c96442] focus:outline-none transition"
                required
                minLength={6}
              />
            </div>
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-[#6b6862] mb-2">确认密码</label>
                <input
                  type="password"
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#faf9f5] border border-[#e7e2d6] rounded-lg text-[15px] text-[#1f1e1d] placeholder-[#a8a298] focus:border-[#c96442] focus:outline-none transition"
                  required
                  minLength={6}
                />
              </div>
            )}
            {error && (
              <div className="p-3 bg-[#f4e4d9] border border-[#c96442]/40 rounded-lg text-[#c96442] text-sm text-center">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#c96442] text-white rounded-full font-medium text-[15px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#b3563a] transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  处理中…
                </span>
              ) : (isRegister ? '注册并登录' : '登录')}
            </button>
          </form>

          {/* 切换登录/注册 */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm text-[#6b6862] hover:text-[#c96442] transition"
            >
              {isRegister ? '已有账号？立即登录' : '还没有账号？立即注册'}
            </button>
          </div>

          {/* 注册时的提示 */}
          {isRegister && (
            <div className="mt-5 pt-5 border-t border-[#e7e2d6]">
              <p className="text-xs text-[#a8a298] text-center leading-relaxed">
                新用户注册后默认 0 积分<br/>
                请联系管理员充值后使用
              </p>
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
